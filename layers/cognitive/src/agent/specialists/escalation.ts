// ==============================================================================
// Exnoria · Cognitive · Escalation Specialist
// Phase 4 B4 — Agent-based orchestration
//
// Handles SUP, EXP stages — resolution and growth-focused.
// Low-volume, high-stakes decisions requiring accurate triage.
// ==============================================================================
import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { CNXEvent, FilterResponse } from '../shared/types';
import { getClusterTools } from '../tools/clusters';
import { createLLMClient } from '../shared/llm';
import { executeMcpTool } from '../mcp/client';
import { recordSessionOutcome } from '../memory/engram';
import { TOOL_TO_ACTION } from '../tools/definitions';
import { dispatchToFilter } from '../dispatch';

const MAX_LOOP_ITERATIONS = 5;
const MAX_CONTEXT_TOKENS = 800;

const ESCALATION_SYSTEM_PROMPT = `You are Xnoria's Escalation Specialist — the agent responsible for support resolution escalation and expansion opportunities.

Your role is to accurately triage support tickets and identify expansion signals.

Key judgment rules:
- For SUP signals: escalate to senior queue only if ticket is open > 48h AND severity > 0.6
- For SUP signals: notify contact directly only if you have clear resolution status to communicate
- For EXP signals: flag only on high-confidence expansion signals (renewal near, usage spike, etc.)
- Never over-promise — expansion recommendations must be data-driven
- All actions exit through the filter — you only recommend actions, never execute directly

Context has already been retrieved and is provided below. Select one action only.`;

// Pre-processing: gather context deterministically before LLM call
async function gatherEscalationContext(event: CNXEvent): Promise<string> {
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
function buildEventPrompt(event: CNXEvent): string {
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

export async function runEscalationSpecialist(db: Pool, event: CNXEvent): Promise<void> {
  const activeTools = getClusterTools('escalation');

  // Pre-processing (deterministic — no LLM call)
  const context = await gatherEscalationContext(event);
  const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);

  // LLM client for Anthropic claude-sonnet-4-6
  const clientConfig = createLLMClient('LLM_ESCALATION_MODEL');
  const llm = clientConfig.client as Anthropic;
  console.info(`[escalation] using model: ${clientConfig.model}`);

  const systemPrompt = `${ESCALATION_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

  const session_id = uuid();
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: buildEventPrompt(event),
    },
  ];

  let iterations = 0;

  while (iterations < MAX_LOOP_ITERATIONS) {
    iterations++;

    const response = await llm.messages.create({
      model: clientConfig.model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: activeTools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters as Anthropic.Tool['input_schema'],
      })),
      messages,
    });

    console.info(`[escalation] iteration=${iterations} stop_reason=${response.stop_reason} input_tokens=${response.usage?.input_tokens}`);

    if (response.stop_reason === 'end_turn') {
      console.warn('[escalation] LLM finished without tool call');
      break;
    }

    if (response.stop_reason !== 'tool_use') break;

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    if (toolUseBlocks.length === 0) break;

    // Classify tool calls
    const actionCalls = toolUseBlocks.filter(b => TOOL_TO_ACTION[b.name] !== null);
    const contextCalls = toolUseBlocks.filter(b => TOOL_TO_ACTION[b.name] === null);

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      console.error('[escalation] Mixed tool call batch rejected');
      break;
    }

    if (contextCalls.length > 0) {
      console.warn('[escalation] LLM requested context tools after pre-processing:', contextCalls.map(b => b.name));
      break;
    }

    if (actionCalls.length > 0) {
      const call = actionCalls[0];
      const mapping = TOOL_TO_ACTION[call.name];

      if (!mapping) {
        console.error(`[escalation] Invalid action tool: ${call.name}`);
        break;
      }

      console.log(`[escalation] Dispatching: ${mapping.action_id}`);

      const filterResponse = await dispatchToFilter({
        action_id: mapping.action_id,
        stage: mapping.stage,
        session_id: session_id,
        contact_id: event.contact_id,
        signal_id: event.signal_id,
        signal_severity: event.signal_severity,
        cause_code: event.cause_code,
        interventions: event.interventions,
        payload: call.input as Record<string, unknown>,
        meta: {
          triggered_by: `escalation-specialist:${call.name}`,
          cluster: 'escalation',
        },
      });

      // Post-dispatch memory write (fire-and-forget)
      await recordSessionOutcome(
        { contact_id: event.contact_id, stage: event.stage!, signal_id: event.signal_id! },
        mapping.action_id,
        filterResponse,
        session_id,
        'escalation'
      );
      break;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    console.error(`[escalation] Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
  }
}
