// ==============================================================================
// Exnoria · Cognitive · Lifecycle Specialist
// Phase 4 B4 — Agent-based orchestration
//
// Handles ONB, PRD, COM, RET stages — relationship-focused, multi-channel,
// health-score driven interventions. Requires reasoning quality over speed.
// ==============================================================================
import OpenAI from 'openai';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { CXEvent } from '../../shared/types';
import { getClusterTools } from '../../tools/clusters';
import { executeMcpTool } from '../../mcp/client';
import { recordSessionOutcome } from '../../memory/engram';
import { TOOL_TO_ACTION } from '../../tools/definitions';
import { dispatchToFilter } from '../dispatch';
import { sendReply } from '../../channels/telegram';
import { logSessionToDb, ActionRecord } from '../../memory/session';
import { createLLMClientWithFallback } from '../../shared/llm-fallback';

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

  // LLM client — lifecycle uses Groq with automatic fallback to OpenRouter
  const clientConfig = await createLLMClientWithFallback();
  const llm = clientConfig.client as OpenAI;
  console.info(`[lifecycle] using model: ${clientConfig.model} (provider: ${clientConfig.provider})`);

  const systemPrompt = `${LIFECYCLE_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

  const session_id = (event.meta?.session_id as string | undefined) ?? uuid();
  const actionsTaken: ActionRecord[] = [];
  let botReply: string | undefined;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
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

    // Classify tool calls: null mapping = local/MCP tool, non-null = filter action
    const actionCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] !== undefined && TOOL_TO_ACTION[tc.function.name] !== null);
    const replyCalls  = toolCalls.filter(tc => tc.function.name === 'reply');
    const contextCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] === null && tc.function.name !== 'reply');

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      console.error('[lifecycle] Mixed tool call batch rejected');
      break;
    }

    // Handle reply tool — send message back to contact via channel
    if (replyCalls.length > 0) {
      try {
        const args = JSON.parse(replyCalls[0].function.arguments) as { message: string };
        botReply = args.message;
        await sendReply(event.contact_id, botReply);
        console.log(`[lifecycle] Reply sent to ${event.contact_id}`);
      } catch (err) {
        console.error('[lifecycle] Failed to send reply:', err);
        // Si falla al parsear los argumentos, intentar extraer el mensaje del error
        try {
          const failedGenMatch = replyCalls[0].function.arguments.match(/"message":\s*"([^"]+)"/);
          if (failedGenMatch && failedGenMatch[1]) {
            await sendReply(event.contact_id, failedGenMatch[1]);
            console.log(`[lifecycle] Fallback reply sent to ${event.contact_id}`);
          }
        } catch (fallbackErr) {
          console.error('[lifecycle] Fallback reply also failed:', fallbackErr);
        }
      }
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

      actionsTaken.push({ action_id: mapping.action_id, status: filterResponse.status, log_id: filterResponse.log_id });

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

  // Log session to Postgres for the Dashboard (fire-and-forget)
  await logSessionToDb(db, session_id, event, clientConfig.model, actionsTaken, botReply);
}
