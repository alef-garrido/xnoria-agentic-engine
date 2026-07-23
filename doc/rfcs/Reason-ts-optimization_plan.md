# Implementation Plan: reason.ts Optimization
## Stage-Aware Tool Selection + Context Pre-Processing Refactor

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** Two targeted changes to `layers/cognitive/src/agent/reason.ts` to reduce token usage and eliminate multi-turn context retrieval overhead. No new files. No new infrastructure. No architectural changes.

---

## Context

The current `reason.ts` has three token budget problems:

1. All 19+ tools are injected on every LLM call regardless of the event's stage
2. Context retrieval (Engram, Compass) happens inside the LLM loop as tool calls, consuming turns and growing message history
3. The multi-turn loop has no guaranteed exit until the LLM stops requesting context

These are fixed by two changes: filter the toolset before building the LLM request, and move all context retrieval to deterministic pre-processing code that runs before the first LLM call.

---

## Change 1: Stage-Aware Tool Selection

### What changes

In `reason.ts`, before constructing the LLM request, derive the active toolset from `event.stage` rather than passing the full `TOOLS` array.

### Implementation

```typescript
// layers/cognitive/src/agent/reason.ts

const CONTEXT_TOOL_NAMES = new Set([
  'compass_get_signal',
  'compass_get_interventions',
  'posthog_get_contact_events',
  'posthog_get_feature_adoption',
  'reply'
]);

// Token budget constant — document here, not buried in a helper
const MAX_CONTEXT_TOKENS = 800;
const MAX_LOOP_ITERATIONS = 5;

function selectToolsForStage(stage: JourneyStage): ToolDefinition[] {
  return TOOLS.filter(tool => {
    const name = tool.function.name;
    const mapping = TOOL_TO_ACTION[name];

    // Always include: context retrieval tools and reply
    if (mapping === null) return true;

    // Include: filter action tools matching this stage
    return mapping.stage === stage;
  });
}
```

### Constraints

- `selectToolsForStage` must be called before any LLM call is constructed — not inside the loop
- If `event.stage` is not a valid `JourneyStage`, throw immediately with a clear error message before any LLM call is attempted:
  ```typescript
  if (!VALID_STAGES.includes(event.stage)) {
    throw new Error(`[reason] Unknown stage: ${event.stage}. Cannot select tools.`);
  }
  ```
- The filtered toolset is immutable for the duration of the session — do not re-filter inside the loop
- Log the selected tool names at `debug` level so token reduction can be verified:
  ```typescript
  console.debug(`[reason] stage=${event.stage} tools=${activeTools.map(t => t.function.name).join(', ')}`);
  ```

### Expected token reduction

| Stage | Tools before | Tools after | Estimated savings |
|---|---|---|---|
| ONB | 19+ | 5 (3 ONB actions + compass + reply) | ~1,200 tokens |
| PRD | 19+ | 6 (3 PRD actions + compass + reply) | ~1,100 tokens |
| SAL | 19+ | 5 (3 SAL actions + compass + reply) | ~1,200 tokens |
| SUP | 19+ | 4 (2 SUP actions + compass + reply) | ~1,300 tokens |

PostHog tools are included only when `POSTHOG_API_KEY` is set — wrap their inclusion in an environment check:

```typescript
if (process.env.POSTHOG_API_KEY) {
  // posthog tools already in TOOLS array — they'll be included via null mapping
}
```

---

## Change 2: Context Pre-Processing

### What changes

All context retrieval (Engram memory, Compass signal lookup) moves out of the LLM loop entirely. It runs as deterministic code before the first LLM call and produces a single `contextBlock` string that is injected into the system prompt. The LLM never calls context retrieval tools — it receives a pre-digested summary.

### The new reason() structure

```typescript
export async function reason(event: CXEvent): Promise<void> {

  // ── STAGE GATE ──────────────────────────────────────────────────────────
  if (!VALID_STAGES.includes(event.stage)) {
    throw new Error(`[reason] Unknown stage: ${event.stage}`);
  }

  // ── TOOL SELECTION ───────────────────────────────────────────────────────
  const activeTools = selectToolsForStage(event.stage);
  console.debug(`[reason] stage=${event.stage} active_tools=${activeTools.length}`);

  // ── PRE-PROCESSING ───────────────────────────────────────────────────────
  // Runs deterministically — no LLM involvement
  // Failures are caught and produce a degraded-but-functional context block
  const [contactContext, signalContext] = await Promise.allSettled([
    buildContactContext(event),   // Engram — from memory/engram.ts
    buildSignalContext(event),    // Compass — from mcp/client.ts
  ]);

  const contextBlock = assembleContextBlock(
    contactContext.status === 'fulfilled' ? contactContext.value : null,
    signalContext.status  === 'fulfilled' ? signalContext.value  : null,
    MAX_CONTEXT_TOKENS
  );

  // ── LLM CALL ─────────────────────────────────────────────────────────────
  // Single call with pre-digested context — no multi-turn context retrieval
  const systemPrompt = buildSystemPrompt(event, contextBlock, activeTools);
  let messages = buildInitialMessages(event);
  let iterations = 0;

  while (iterations < MAX_LOOP_ITERATIONS) {
    iterations++;

    const response = await llm.chat({
      model: process.env.LLM_MODEL,
      messages,
      tools: activeTools,
      tool_choice: 'auto'
    });

    const toolCalls = extractToolCalls(response);

    if (toolCalls.length === 0) {
      // LLM finished without selecting an action — log and exit
      console.warn('[reason] LLM returned no tool calls');
      break;
    }

    // Classify tool calls — reject mixed batches
    const actionCalls    = toolCalls.filter(tc => TOOL_TO_ACTION[tc.name] !== null);
    const contextCalls   = toolCalls.filter(tc => TOOL_TO_ACTION[tc.name] === null);

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      // LLM attempted to retrieve context and act in the same turn — reject
      console.error('[reason] Mixed tool call batch rejected:', toolCalls.map(t => t.name));
      break;
    }

    if (contextCalls.length > 0) {
      // This should not happen if pre-processing is working correctly
      // Log as a warning but handle gracefully rather than crashing
      console.warn('[reason] LLM requested context tools after pre-processing:', contextCalls.map(t => t.name));
      // Execute context calls and feed results back — degraded path
      const results = await executContextCalls(contextCalls);
      messages = appendToolResults(messages, response, results);
      continue;
    }

    if (actionCalls.length > 0) {
      // Execute the first action call — single action per session
      const call = actionCalls[0];
      const filterResponse = await dispatchToFilter(call, event);

      // ── POST-DISPATCH ───────────────────────────────────────────────────
      await recordSession(event, call.name, filterResponse);  // fire-and-forget
      break;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    console.error(`[reason] Max iterations (${MAX_LOOP_ITERATIONS}) reached without action dispatch`);
  }
}
```

### The assembleContextBlock function

This is the token budget enforcer. It takes the two context pieces and produces a string that fits within `MAX_CONTEXT_TOKENS`:

```typescript
function assembleContextBlock(
  contactContext: string | null,
  signalContext: string | null,
  maxTokens: number
): string {
  const sections: string[] = [];

  if (signalContext) {
    sections.push('## Signal Context\n' + signalContext);
  }

  if (contactContext) {
    sections.push('## Contact History\n' + contactContext);
  }

  if (sections.length === 0) {
    return 'No prior context available.';
  }

  const combined = sections.join('\n\n');

  // Rough token estimate: 1 token ≈ 4 characters
  // If over budget, truncate contact history (signal context is smaller and higher value)
  const estimatedTokens = Math.ceil(combined.length / 4);
  if (estimatedTokens > maxTokens) {
    const budget = maxTokens * 4;
    return combined.slice(0, budget) + '\n[context truncated to fit token budget]';
  }

  return combined;
}
```

### The buildSignalContext function

Lives in `layers/cognitive/src/mcp/client.ts` or a dedicated `compass.ts` helper:

```typescript
async function buildSignalContext(event: CXEvent): Promise<string> {
  if (!event.signal_id) return '';

  try {
    const signal = await mcpClient.call('compass_get_signal', {
      signal_id: event.signal_id
    });

    const interventions = await mcpClient.call('compass_get_interventions', {
      signal_id: event.signal_id
    });

    return [
      `Signal: ${signal.name} (${event.signal_id})`,
      `Severity: ${signal.severity} | Cause: ${signal.cause_code}`,
      `Interventions:`,
      `  A: ${interventions.A}`,
      `  B: ${interventions.B}`,
      `  C: ${interventions.C}`,
    ].join('\n');
  } catch (err) {
    console.error('[reason] Compass context fetch failed:', err);
    return '';
  }
}
```

---

## Change 3: Verification via Logs

### What to look for after deployment

The subagent must verify three things from the logs after restarting the container.

**Token reduction — verify in Groq/LLM API response:**

Add token logging after each LLM call:

```typescript
console.info(`[reason] tokens used: prompt=${response.usage?.prompt_tokens} completion=${response.usage?.completion_tokens} total=${response.usage?.total_tokens}`);
```

Expected result: prompt tokens should be 2,000–3,500 range vs the previous 6,000+ that triggered the 413.

**Stage-aware selection — verify in debug logs:**

```
[reason] stage=ONB active_tools=5
[reason] stage=ONB tools=onb_contact_nudge, onb_contact_assist, onb_ticket_escalate, compass_get_signal, reply
```

If you see all 19 tools listed, stage selection is not working.

**Pre-processing execution — verify context block is being built:**

```
[memory] contact_context fetched: 3 entries for CID_12345 in ONB
[compass] signal_context fetched: ONB_FRC_01 severity=0.7
[reason] context_block_tokens=~180
```

If you see `[reason] LLM requested context tools after pre-processing`, the LLM is bypassing the pre-processing step. This means the system prompt is not clearly communicating that context is already provided. Fix by adding an explicit instruction to the system prompt:

```
Context has already been retrieved and is provided above.
Do not call compass_get_signal or memory tools — select an action directly.
```

**End-to-end test sequence:**

```bash
# 1. Inject ONB_FRC_01 event via Telegram
# Expected log sequence:
# [reason] stage=ONB active_tools=5
# [memory] fetching contact history...
# [compass] fetching signal context...
# [reason] context_block_tokens=~150
# [reason] tokens used: prompt=~2800 completion=~200 total=~3000
# [filter] dispatching onb.contact.nudge → executed
# [memory] session recorded

# 2. Inject second ONB_FRC_01 for same contact within 48h
# Expected: context block contains "nudge sent within last 48 hours"
# Expected: LLM selects onb.contact.assist instead of onb.contact.nudge
# Expected: routes through HITL
```

---

## What NOT to change

- Do not touch `definitions.ts` tool descriptions — they are correct as-is
- Do not touch `filter/` — this change is cognitive layer only
- Do not add new MCP servers or tools
- Do not change the filter dispatch path — only the pre-LLM preparation changes
- Do not remove the loop entirely — it handles the edge case where the LLM requests context tools despite pre-processing (degraded path)

---

## Build and Deploy Sequence

```bash
cd layers/cognitive
npx tsc --noEmit                          # verify no errors before emitting
npx tsc                                   # emit to dist/
# volume mount picks up new dist/ immediately
docker compose restart cognitive
docker exec exnoria_cognitive grep -r "selectToolsForStage" /app/dist/  # verify new code is live
# inject test event via Telegram
# check logs: docker logs exnoria_cognitive --tail 100 -f
```

---

## Acceptance Criteria

- [ ] `[reason] active_tools=N` log shows 3–6 tools per call, never 19+
- [ ] Prompt token count in LLM response is below 4,000 on all test events
- [ ] No 413 errors on any stage's test event
- [ ] `[reason] LLM requested context tools after pre-processing` warning does not appear in normal operation
- [ ] Second ONB_FRC_01 for same contact within 48h → agent selects `onb.contact.assist` not `onb.contact.nudge`
- [ ] `npx tsc --noEmit` passes with no errors before deployment
- [ ] Token usage logged after every LLM call