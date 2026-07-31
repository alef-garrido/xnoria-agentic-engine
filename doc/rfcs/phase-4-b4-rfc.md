# RFC: Phase 4 — B4 Multi-Agent Coordination

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** Refactor the cognitive layer from a single general-purpose agent into a coordinator + three specialist agents, differentiated by domain cluster, model, and tool subset.

---

## Executive Summary

The current cognitive layer is a single agent that handles all eight journey stages with a unified tool set. This works at MVP scale but has two structural limits: the tool set grows with every phase (already at 19+ tools), and the reasoning quality is uniform across stages that have very different stakes and complexity.

B4 introduces a coordinator-specialist architecture. A lightweight coordinator receives every `CXEvent`, routes it to the correct specialist based on stage, and the specialist reasons with a targeted tool subset and domain-specific system prompt. Specialists dispatch to the filter — the coordinator never does.

The non-negotiable principles are unchanged. Every action still exits through `POST /filter/execute`. Every attempt is still logged. The filter allowlist still governs what can execute. Multi-agent coordination adds routing and specialization above the cognitive layer — it does not change anything below it.

---

## Architecture

### Before B4 (current)

```
CXEvent
  → Single Agent (all 19+ tools, one model, one system prompt)
    → Filter → n8n → External systems
```

### After B4

```
CXEvent
  → Coordinator Agent (routing only, no filter dispatch)
    → AcqSal Specialist  (ACQ + SAL tools, fast model)
    → Lifecycle Specialist (ONB + PRD + COM + RET tools, reasoning model)
    → Escalation Specialist (SUP + EXP tools, reasoning model)
      → Filter → n8n → External systems
```

### Three Non-Negotiable Principles — unchanged

1. The cognitive layer never calls external systems directly. All actions exit through the filter.
2. Every action is logged, whether executed, rejected, or pending human approval.
3. The filter allowlist is managed at runtime via the database, not by redeploying code.

### New principle added for B4

4. **Only specialist agents dispatch to the filter.** The coordinator routes — it never selects or dispatches actions. If the coordinator finds itself calling `dispatchToFilter()`, that is an architectural violation.

---

## Domain Cluster Design

### Cluster 1: Acquisition & Sales (`acq`, `sal`)

**Rationale:** Growth-focused, high-velocity, WhatsApp-first. These stages share the speed-to-lead imperative, the same HubSpot pipeline context, and conversion as the primary metric. Simple signal patterns — new contact, opt-in, score, enroll, prioritize.

**Tools (7):**
- `acq_lead_engage`, `acq_lead_nurture`, `acq_contact_outreach`
- `sal_sequence_enroll`, `sal_contact_prioritize`, `sal_contact_message`
- `reply`

**Context retrieval tools (always null in TOOL_TO_ACTION):**
- `compass_get_signal`, `compass_get_interventions`
- `posthog_get_contact_events` (if POSTHOG_API_KEY set)

**Model:** `llama-3.3-70b-versatile` on Groq — fast, cost-efficient, 32k context window. ACQ/SAL decisions are relatively low-complexity and high-volume. Speed matters more than reasoning depth here.

**System prompt focus:** Speed to lead, conversion intent, WhatsApp-first communication, HubSpot pipeline hygiene.

---

### Cluster 2: Lifecycle (`onb`, `prd`, `com`, `ret`)

**Rationale:** Relationship-focused, slower cadence, multi-channel, health-score driven. These stages share the "customer is already paying" context. Wrong decisions here — a missed churn signal, a tone-deaf nudge, re-engaging an unsubscribed contact — have the highest cost. Reasoning quality matters more than speed.

**Tools (11):**
- `onb_document_request`, `onb_document_validate`, `onb_contact_nudge`, `onb_contact_assist`, `onb_ticket_escalate`
- `prd_friction_flag`, `prd_adoption_nudge`, `prd_feedback_log`
- `com_contact_reengage`, `com_feedback_request`, `com_channel_flag`
- `ret_contact_winback`, `ret_account_flag`
- `reply`

**Model:** `claude-sonnet-4-6` via Anthropic API (`ANTHROPIC_API_KEY` already in environment). Better multi-step reasoning for nuanced intervention decisions. The `claude-sonnet-4-6` model string is `claude-sonnet-4-6`.

**System prompt focus:** Customer health, intervention history awareness, cooldown logic, escalation judgment (nudge vs assist vs escalate), churn risk recognition, COM legal sensitivity (unsubscribe compliance).

---

### Cluster 3: Escalation (`sup`, `exp`)

**Rationale:** Resolution and growth-focused. SUP signals require accurate severity triage and ticket routing. EXP signals require commercial judgment — expansion readiness, executive relationship strategy. Both are low-volume, high-stakes. Same model as Lifecycle justified by the same reasoning quality requirement.

**Tools (6):**
- `sup_ticket_escalate`, `sup_contact_notify`
- `exp_account_expand`, `exp_contact_upgrade`, `exp_relationship_build`
- `reply`

**Model:** `claude-sonnet-4-6` via Anthropic API — same as Lifecycle.

**System prompt focus:** Escalation threshold judgment, ticket triage accuracy, expansion opportunity identification, CSM resource allocation, commercial relationship sensitivity.

---

### Coordinator

**Role:** Receives `CXEvent`, validates stage, reads contact history summary from Engram, selects the correct specialist, passes the enriched event. Does not reason about which action to take. Does not call the filter.

**Model:** `llama-3.1-8b-instant` on Groq — minimal reasoning required, sub-100ms routing decisions, negligible cost per event.

**What it does:**
1. Validates `event.stage` is a known `JourneyStage`
2. Fetches a brief contact history summary from Engram (last 3 sessions, any stage)
3. Appends summary to event as `meta.contact_history`
4. Routes to the correct specialist based on stage
5. Returns the specialist's result

**What it does not do:** Select tools. Reason about signals. Call `dispatchToFilter`. Access PostHog. Access Compass directly (specialists handle this).

---

## Implementation

### New file structure

```
layers/cognitive/src/
├── agent/
│   ├── coordinator.ts      ← NEW: routing logic
│   ├── specialists/
│   │   ├── acqsal.ts       ← NEW: ACQ + SAL specialist
│   │   ├── lifecycle.ts    ← NEW: ONB + PRD + COM + RET specialist
│   │   └── escalation.ts   ← NEW: SUP + EXP specialist
│   └── reason.ts           ← MODIFY: becomes coordinator entry point
├── tools/
│   ├── definitions.ts      ← MODIFY: split into cluster subsets
│   └── clusters.ts         ← NEW: tool subset definitions per cluster
├── memory/
│   └── engram.ts           ← MODIFY: add agent tag to mem_save
└── shared/
    └── types.ts            ← MODIFY: add AgentCluster type, coordinator result type
```

### `layers/cognitive/src/tools/clusters.ts`

Defines the tool subset for each cluster. `selectToolsForStage` in `reason.ts` is replaced by `getClusterTools`:

```typescript
import { TOOLS, TOOL_TO_ACTION } from './definitions';
import { ToolDefinition } from '../shared/types';

export type AgentCluster = 'acqsal' | 'lifecycle' | 'escalation';

export const STAGE_TO_CLUSTER: Record<string, AgentCluster> = {
  ACQ: 'acqsal',
  SAL: 'acqsal',
  ONB: 'lifecycle',
  PRD: 'lifecycle',
  COM: 'lifecycle',
  RET: 'lifecycle',
  SUP: 'escalation',
  EXP: 'escalation',
};

const CONTEXT_TOOL_NAMES = new Set([
  'compass_get_signal',
  'compass_get_interventions',
  'posthog_get_contact_events',
  'posthog_get_feature_adoption',
  'reply',
]);

export function getClusterTools(cluster: AgentCluster): ToolDefinition[] {
  const clusterStages = Object.entries(STAGE_TO_CLUSTER)
    .filter(([, c]) => c === cluster)
    .map(([stage]) => stage);

  return TOOLS.filter(tool => {
    const name = tool.function.name;
    const mapping = TOOL_TO_ACTION[name];

    // Always include context retrieval tools and reply
    if (mapping === null) return true;

    // Include filter action tools whose stage belongs to this cluster
    return clusterStages.includes(mapping.stage);
  });
}
```

### `layers/cognitive/src/agent/coordinator.ts`

```typescript
import { CXEvent } from '../shared/types';
import { STAGE_TO_CLUSTER, AgentCluster } from '../tools/clusters';
import { buildContactContext } from '../memory/engram';
import { runAcqSalSpecialist } from './specialists/acqsal';
import { runLifecycleSpecialist } from './specialists/lifecycle';
import { runEscalationSpecialist } from './specialists/escalation';

const CLUSTER_RUNNERS: Record<AgentCluster, (event: CXEvent) => Promise<void>> = {
  acqsal:     runAcqSalSpecialist,
  lifecycle:  runLifecycleSpecialist,
  escalation: runEscalationSpecialist,
};

export async function coordinate(event: CXEvent): Promise<void> {
  // 1. Validate stage
  const cluster = STAGE_TO_CLUSTER[event.stage];
  if (!cluster) {
    throw new Error(`[coordinator] Unknown stage: ${event.stage}`);
  }

  console.info(`[coordinator] stage=${event.stage} cluster=${cluster} contact=${event.contact_id}`);

  // 2. Fetch cross-cluster contact history (coordinator scope — all stages)
  // This gives the specialist context about what happened in OTHER stages
  // Each specialist also fetches its own stage-specific history
  try {
    const crossStageHistory = await buildContactContext({
      ...event,
      stage: 'ALL' as any  // special query — all stages for this contact
    });
    event.meta = {
      ...event.meta,
      cross_stage_history: crossStageHistory,
      routed_by: 'coordinator',
      cluster,
    };
  } catch (err) {
    // Non-blocking — specialist proceeds without cross-stage context
    console.warn('[coordinator] cross-stage history fetch failed:', err);
  }

  // 3. Route to specialist
  await CLUSTER_RUNNERS[cluster](event);
}
```

### `layers/cognitive/src/agent/specialists/lifecycle.ts`

The lifecycle specialist is the reference implementation — the most complex cluster. AcqSal and Escalation follow the same pattern with their own tool subsets and system prompts.

```typescript
import OpenAI from 'openai';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { CXEvent } from '../../shared/types';
import { FilterResponse } from '../dispatch';
import { getClusterTools } from '../../tools/clusters';
import { createLLMClient } from '../../shared/llm';
import { executeMcpTool } from '../../mcp/client';
import { recordSessionOutcome } from '../../memory/engram';
import { TOOL_TO_ACTION } from '../../tools/definitions';
import { dispatchToFilter } from '../dispatch';

const MAX_LOOP_ITERATIONS = 5;
const MAX_CONTEXT_TOKENS = 800;

const LIFECYCLE_SYSTEM_PROMPT = `You are Xnoria's Lifecycle Specialist — the agent responsible for customer health across onboarding, product adoption, communication, and retention stages.

Your role is to select the single most appropriate intervention for the customer signal you receive. You have access to the customer's prior intervention history and the Compass signal framework.

Key judgment rules:
- Prefer the least invasive action that matches the signal severity
- Check prior interventions before acting — do not repeat a nudge sent within 48 hours
- For ONB signals: nudge first (automated), assist only if severity >= 0.8 or nudge already sent
- For RET signals: flag first (no HITL), winback only if severity >= 0.7
- For COM signals (unsubscribed): this is legally sensitive — always confirm compliance in your reasoning
- For PRD_CAP_02 (feature requests): log only, do not message the contact

Context has already been retrieved and is provided below. Do not call compass or memory tools — select an action directly.`;

// Pre-processing (deterministic — no LLM)
async function gatherLifecycleContext(event: CXEvent): Promise<string> {
  const signalCtx = await executeMcpTool('compass_get_signal', { signal_id: event.signal_id! });

  const signalContent = signalCtx.success
    ? signalCtx.content.substring(0, 500)
    : 'Signal context unavailable.';

  return `Signal Context: ${signalContent}\n\n${event.meta?.cross_stage_history || 'No cross-stage history available.'}`;
}

// Build context block respecting token budget
function buildContextBlock(context: string, maxTokens: number): string {
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;
  return context.length > maxChars ? context.substring(0, maxChars) : context;
}

// Build event prompt for LLM
function buildEventPrompt(event: CXEvent): string {
  const parts = [
    `Stage: ${event.stage}`,
    `Signal ID: ${event.signal_id}`,
    `Severity: ${event.signal_severity ?? 'N/A'}`,
    `Cause Code: ${event.cause_code}`,
    `Contact ID: ${event.contact_id}`,
  ];

  if (event.interventions && event.interventions.length > 0) {
    parts.push(`Interventions: ${event.interventions.join(', ')}`);
  }

  return parts.join('\n');
}

export async function runLifecycleSpecialist(db: Pool, event: CXEvent): Promise<void> {
  const activeTools = getClusterTools('lifecycle');

  // Pre-processing (deterministic — no LLM call)
  const context = await gatherLifecycleContext(event);
  const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);

  // LLM client for OpenAI-compatible (OpenRouter)
  const clientConfig = createLLMClient('LLM_LIFECYCLE_MODEL');
  const llm = clientConfig.client as OpenAI;
  console.info(`[lifecycle] using model: ${clientConfig.model}`);

  const systemPrompt = `${LIFECYCLE_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

  const session_id = uuid();
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: buildEventPrompt(event),
    },
  ];

  let iterations = 0;

  while (iterations < MAX_LOOP_ITERATIONS) {
    iterations++;

    const completion = await llm.chat.completions.create({
      model: clientConfig.model,
      messages,
      tools: activeTools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        },
      })),
      tool_choice: 'auto',
    });

    console.info(`[lifecycle] iteration=${iterations} stop_reason=${completion.choices[0]?.finish_reason} tokens_used=${completion.usage?.total_tokens}`);

    const message = completion.choices[0]?.message;
    const toolCalls = message?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      console.warn('[lifecycle] LLM finished without tool call');
      break;
    }

    // Classify tool calls
    const actionCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] !== null);
    const contextCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] === null);

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      console.error('[lifecycle] Mixed tool call batch rejected');
      break;
    }

    if (contextCalls.length > 0) {
      console.warn('[lifecycle] LLM requested context tools after pre-processing:', contextCalls.map(t => t.function.name));
      break;
    }

    if (actionCalls.length > 0) {
      const call = actionCalls[0];
      const mapping = TOOL_TO_ACTION[call.function.name];

      if (!mapping) {
        console.error(`[lifecycle] Invalid action tool: ${call.function.name}`);
        break;
      }

      console.log(`[lifecycle] Dispatching: ${mapping.action_id}`);

      const filterResponse = await dispatchToFilter({
        action_id: mapping.action_id,
        stage: mapping.stage,
        session_id: session_id,
        contact_id: event.contact_id,
        signal_id: event.signal_id,
        signal_severity: event.signal_severity,
        cause_code: event.cause_code,
        interventions: event.interventions,
        payload: JSON.parse(call.function.arguments) as Record<string, unknown>,
        meta: {
          triggered_by: `lifecycle-specialist:${call.function.name}`,
          cluster: 'lifecycle',
        },
      });

      // Post-dispatch memory write (fire-and-forget)
      await recordSessionOutcome(
        { contact_id: event.contact_id, stage: event.stage!, signal_id: event.signal_id! },
        mapping.action_id,
        filterResponse,
        session_id,
        'lifecycle'
      );
      break;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    console.error(`[lifecycle] Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
  }
}
        meta: { ...event.meta, triggered_by: `lifecycle-specialist:${call.name}` }
      });

      // Post-dispatch memory write (fire-and-forget)
      await recordSession(event, mapping.action_id, filterResponse, 'lifecycle');
      break;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    console.error(`[lifecycle] Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
  }
}
```

### `layers/cognitive/src/memory/engram.ts` — agent tag addition

The `mem_save` call adds `agent:{cluster}` to the title for agent-scoped filtering:

```typescript
export async function recordSession(
  event: CXEvent,
  actionId: string,
  filterResponse: FilterResponse,
  agentCluster: string  // NEW parameter
): Promise<void> {
  try {
    await mcpClient.call('mem_save', {
      title: `${event.contact_id} | ${event.stage} | ${event.signal_id} → ${actionId} [${filterResponse.status}] | agent:${agentCluster}`,
      type: 'cx_intervention',
      content: buildMemoryContent(event, actionId, filterResponse, agentCluster)
    });
  } catch (err) {
    console.error('[memory] session record failed:', err);
  }
}
```

The `buildContactContext` function gains an optional `agentCluster` filter:

```typescript
export async function buildContactContext(
  event: CXEvent,
  agentCluster?: string  // if provided, filters to this agent's records only
): Promise<string> {
  const query = agentCluster
    ? `${event.contact_id} ${event.stage} agent:${agentCluster}`
    : `${event.contact_id} ${event.stage}`;

  // ... rest of implementation unchanged
}
```

### `layers/cognitive/src/agent/reason.ts` — becomes coordinator entry point

The existing `reason()` function is replaced with a thin wrapper that calls `coordinate()`:

```typescript
import { coordinate } from './coordinator';
import { CXEvent } from '../shared/types';

export async function reason(event: CXEvent): Promise<void> {
  return coordinate(event);
}
```

`reason.ts` stays as the public interface so the rest of the codebase (`index.ts`, `events/loop.ts`) needs no changes.

---

## Model Configuration

### New environment variables

| Variable | Service | Description | Default |
|---|---|---|---|
| `LLM_ACQSAL_MODEL` | cognitive | Model for ACQ/SAL specialist | `llama-3.3-70b-versatile` |
| `LLM_ACQSAL_BASE_URL` | cognitive | Base URL for ACQ/SAL model | Groq |
| `LLM_LIFECYCLE_MODEL` | cognitive | Model for Lifecycle specialist | `claude-sonnet-4-6` |
| `LLM_LIFECYCLE_BASE_URL` | cognitive | Base URL for Lifecycle model | OpenRouter |
| `LLM_ESCALATION_MODEL` | cognitive | Model for Escalation specialist | `claude-sonnet-4-6` |
| `LLM_ESCALATION_BASE_URL` | cognitive | Base URL for Escalation model | OpenRouter |
| `LLM_COORDINATOR_MODEL` | cognitive | Model for coordinator | `llama-3.1-8b-instant` |

Using environment variables for model and base URL configuration means switching models or providers requires no code changes — operators can tune per-cluster costs and providers without a deployment.

Add to `.env.example`:

```
# Multi-agent model configuration
LLM_COORDINATOR_MODEL=llama-3.1-8b-instant
LLM_ACQSAL_MODEL=llama-3.3-70b-versatile
LLM_ACQSAL_BASE_URL=https://api.groq.com/openai/v1
LLM_LIFECYCLE_MODEL=claude-sonnet-4-6
LLM_LIFECYCLE_BASE_URL=https://openrouter.ai/api/v1
LLM_ESCALATION_MODEL=claude-sonnet-4-6
LLM_ESCALATION_BASE_URL=https://openrouter.ai/api/v1
```

### Model client abstraction

Each specialist initializes its own LLM client based on environment variables. Create a factory in `layers/cognitive/src/shared/llm.ts`:

```typescript
export function createLLMClient(modelEnvVar: string, baseUrlEnvVar?: string) {
  const model = process.env[modelEnvVar];
  const baseURL = baseUrlEnvVar ? process.env[baseUrlEnvVar] : undefined;

  // OpenAI-compatible API (Groq, OpenRouter, etc.)
  const apiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error(`API key not found. Set GROQ_API_KEY or LLM_API_KEY environment variable.`);
  }

  return {
    model,
    client: new OpenAI({
      apiKey,
      baseURL: baseURL || process.env.LLM_BASE_URL,
    }),
  };
}
```

This keeps each specialist's LLM initialization clean and provider-agnostic.

---

## Environment Variables

| Variable | Service | Description | Default |
|---|---|---|---|
| `AGENT_MODE` | cognitive | Agent mode: 'multi' (coordinator + specialists) or 'single' (legacy) | `single` |

---

## Token Budget Per Cluster

With stage-aware tool selection per specialist, the token budgets are:

| Cluster | Tools | Estimated prompt tokens | Model context limit |
|---|---|---|---|
| Coordinator | 0 tools (routing only) | ~500 | 8k (llama-3.1-8b-instant) |
| AcqSal | 7 tools | ~2,500 | 32k (llama-3.3-70b-versatile) |
| Lifecycle | 13 tools | ~4,000 | 200k (claude-sonnet-4-6) |
| Escalation | 6 tools | ~2,800 | 200k (claude-sonnet-4-6) |

No cluster approaches its model's context limit. The 413 errors from the single-agent design are eliminated structurally — even Lifecycle at its largest is well within claude-sonnet-4-6's budget.

---

## Engram Memory Model Update

The memory tagging convention after B4:

```
title: "{contact_id} | {stage} | {signal_id} → {action_id} [{status}] | agent:{cluster}"

Examples:
"CID_001 | ONB | ONB_FRC_01 → onb.contact.nudge [executed] | agent:lifecycle"
"CID_001 | ACQ | ACQ_VIS_01 → acq.lead.engage [executed] | agent:acqsal"
"CID_001 | SUP | SUP_RES_02 → sup.ticket.escalate [executed] | agent:escalation"
```

**Coordinator cross-stage query:** `mem_search({ query: "CID_001" })` — returns all sessions across all clusters for this contact.

**Specialist stage query:** `mem_search({ query: "CID_001 ONB" })` — returns ONB-specific history.

**Cluster-scoped query:** `mem_search({ query: "CID_001 agent:lifecycle" })` — returns all lifecycle specialist sessions for this contact across ONB, PRD, COM, RET.

---

## New and Modified Files

### New Files

| # | File | Purpose |
|---|---|---|
| 1 | `cognitive/src/agent/coordinator.ts` | Routing logic — stage → cluster |
| 2 | `cognitive/src/agent/specialists/acqsal.ts` | ACQ + SAL specialist |
| 3 | `cognitive/src/agent/specialists/lifecycle.ts` | ONB + PRD + COM + RET specialist |
| 4 | `cognitive/src/agent/specialists/escalation.ts` | SUP + EXP specialist |
| 5 | `cognitive/src/tools/clusters.ts` | Tool subset definitions per cluster |
| 6 | `cognitive/src/shared/llm.ts` | LLM client factory |
| 7 | `cognitive/src/agent/single.ts` | Legacy single-agent behavior |

### Modified Files

| # | File | Change |
|---|---|---|
| 1 | `cognitive/src/agent/reason.ts` | Add `AGENT_MODE` switch |
| 2 | `cognitive/src/memory/engram.ts` | Add `agentCluster` tag to `mem_save`, optional cluster filter to `buildContactContext` |
| 3 | `cognitive/src/shared/types.ts` | Add `AgentCluster` type, coordinator result type |
| 4 | `cognitive/src/tools/definitions.ts` | No tool changes — clusters.ts handles subsetting |
| 5 | `docker-compose.yml` | Add new env vars to cognitive service |
| 6 | `.env.example` | Add model configuration variables and `AGENT_MODE` |

---

## Implementation Sequence

```
1. Create clusters.ts with STAGE_TO_CLUSTER and getClusterTools()
2. Create shared/llm.ts with createLLMClient factory
3. Add AgentCluster type to shared/types.ts
4. Implement lifecycle specialist (reference implementation)
   → Verify: claude-sonnet-4-6 responds correctly to ONB test event
   → Verify: token count logged, within budget
5. Implement acqsal specialist (simpler — Groq model, fewer tools)
   → Verify: ACQ test event routes correctly
6. Implement escalation specialist
   → Verify: SUP test event routes correctly
7. Implement coordinator
   → Verify: coordinator routes correctly for all 8 stages
   → Verify: coordinator never calls dispatchToFilter
8. Update reason.ts to call coordinate()
9. Update engram.ts with agent tag
10. Add env vars to docker-compose.yml and .env.example
11. npx tsc --noEmit
12. docker compose up -d --force-recreate cognitive
13. End-to-end test sequence (see below)
```

---

## Verification

### Routing verification

```bash
# Test each cluster receives the correct stage
# ONB → lifecycle specialist
# ACQ → acqsal specialist
# SUP → escalation specialist

docker logs exnoria_cognitive --tail 100 | grep "coordinator"
# Expected:
# [coordinator] stage=ONB cluster=lifecycle contact=CID_TEST
# [coordinator] stage=ACQ cluster=acqsal contact=CID_TEST
# [coordinator] stage=SUP cluster=escalation contact=CID_TEST
```

### Token budget verification

```bash
docker logs exnoria_cognitive --tail 100 | grep "input_tokens"
# Expected:
# [acqsal] iteration=1 stop_reason=tool_use input_tokens=~2500
# [lifecycle] iteration=1 stop_reason=tool_use input_tokens=~3800
# [escalation] iteration=1 stop_reason=tool_use input_tokens=~2700
```

### Memory tagging verification

```bash
docker exec exnoria_cognitive engram search "CID_TEST"
# Expected entries include agent: tag:
# "CID_TEST | ONB | ONB_FRC_01 → onb.contact.nudge [executed] | agent:lifecycle"
```

### Coordinator isolation verification

```bash
grep -r "dispatchToFilter" layers/cognitive/src/agent/coordinator.ts
# Must return nothing — coordinator never dispatches
```

### Full end-to-end test per cluster

```bash
# Lifecycle: ONB signal → lifecycle specialist → onb.contact.nudge
# AcqSal: ACQ signal → acqsal specialist → acq.lead.engage
# Escalation: SUP signal → escalation specialist → sup.ticket.escalate (HITL check)
# Cross-cluster: inject ONB then RET for same contact → verify coordinator
#   passes cross-stage history to RET specialist
```

---

## Acceptance Criteria

- [ ] Coordinator routes all 8 stages to the correct cluster — verified in logs
- [ ] Coordinator never calls `dispatchToFilter` — verified by grep
- [ ] Lifecycle specialist uses `claude-sonnet-4-6` — verified in logs
- [ ] AcqSal specialist uses Groq model — verified in logs
- [ ] Token counts within budget for all clusters — no 413 errors
- [ ] Engram records include `agent:{cluster}` tag — verified by search
- [ ] Cross-stage history available to specialists via `meta.cross_stage_history`
- [ ] `reason.ts` is a thin wrapper — verified by line count (< 10 lines)
- [ ] TypeScript compilation passes with no errors
- [ ] All three non-negotiable principles unchanged — filter still gates all actions
- [ ] `npx tsc --noEmit` passes before container rebuild
- [ ] `AGENT_MODE=single` in `.env` + container restart → system behaves identically to pre-B4
- [ ] `AGENT_MODE=multi` → coordinator routes correctly to specialists
- [ ] Filter dispatch path unchanged in both modes

---

## Design Decisions Log

**Why coordinator + clusters instead of one agent per stage:**
Eight independent agents would duplicate the Engram connection, Compass MCP, PostHog MCP, and filter dispatch logic eight times. Clusters share infrastructure within the specialist. Three specialists is the minimum that produces meaningful specialization without operational overhead.

**Why the coordinator does not dispatch:**
Separation of concerns. The coordinator's job is routing, not reasoning. If it could dispatch, a bug in routing logic could produce actions in the wrong stage context. Keeping dispatch exclusively in specialists makes the system easier to reason about and audit.

**Why different models per cluster:**
ACQ/SAL decisions are high-volume and relatively simple — speed and cost matter more than reasoning depth. Lifecycle and Escalation decisions are lower-volume and higher-stakes — reasoning quality justifies the cost difference. The environment variable configuration means this can be tuned without code changes.

**Why shared Engram with agent tagging instead of isolated instances:**
A contact's full journey is more valuable than any single stage's history. The Lifecycle specialist benefits from knowing this contact was recently active in ACQ. The Escalation specialist benefits from knowing this contact had unresolved ONB friction. Shared memory with tagging gives both cross-agent visibility and per-agent filtering.