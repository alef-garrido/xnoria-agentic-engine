// ==============================================================================
// Exnoria · Cognitive · Lifecycle Specialist
// Phase 4 B4 — Agent-based orchestration
//
// Handles ONB, PRD, COM, RET stages — relationship-focused, multi-channel,
// health-score driven interventions. Requires reasoning quality over speed.
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

// Pre-processing: gather context deterministically before LLM call
async function gatherLifecycleContext(event: CNXEvent): Promise<string> {
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

export async function runLifecycleSpecialist(db: Pool, event: CNXEvent): Promise<void> {
  const activeTools = getClusterTools('lifecycle');

  // Pre-processing (deterministic — no LLM call)
  const context = await gatherLifecycleContext(event);
  const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);

  // LLM client for Anthropic claude-sonnet-4-6
  const clientConfig = createLLMClient('LLM_LIFECYCLE_MODEL');
  const llm = clientConfig.client as Anthropic;
  console.info(`[lifecycle] using model: ${clientConfig.model}`);

  const systemPrompt = `${LIFECYCLE_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

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

    console.info(`[lifecycle] iteration=${iterations} stop_reason=${response.stop_reason} input_tokens=${response.usage?.input_tokens}`);

    if (response.stop_reason === 'end_turn') {
      console.warn('[lifecycle] LLM finished without tool call');
      break;
    }

    if (response.stop_reason !== 'tool_use') break;

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    if (toolUseBlocks.length === 0) break;

    // Classify tool calls
    const actionCalls = toolUseBlocks.filter(b => TOOL_TO_ACTION[b.name] !== null);
    const contextCalls = toolUseBlocks.filter(b => TOOL_TO_ACTION[b.name] === null);

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      console.error('[lifecycle] Mixed tool call batch rejected');
      break;
    }

    if (contextCalls.length > 0) {
      console.warn('[lifecycle] LLM requested context tools after pre-processing:', contextCalls.map(b => b.name));
      break;
    }

    if (actionCalls.length > 0) {
      const call = actionCalls[0];
      const mapping = TOOL_TO_ACTION[call.name];

      if (!mapping) {
        console.error(`[lifecycle] Invalid action tool: ${call.name}`);
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
        payload: call.input as Record<string, unknown>,
        meta: {
          triggered_by: `lifecycle-specialist:${call.name}`,
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
