// ==============================================================================
// Exnoria · Cognitive · AcqSal Specialist
// Phase 4 B4 — Agent-based orchestration
//
// Handles ACQ, SAL stages — growth-focused, high-velocity, WhatsApp-first.
// Speed matters more than reasoning depth here.
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
const MAX_FILTER_DISPATCHES = 3;
const MAX_CONTEXT_TOKENS = 800;

const ACQSAL_SYSTEM_PROMPT = `You are Xnoria's Acquisition & Sales Specialist — the agent responsible for lead scoring, sales enablement, and high-velocity outreach.

Your role is to quickly route contacts to the appropriate action based on signal severity and HubSpot pipeline context.

Key judgment rules:
- Prioritize speed to lead — ACQ contacts should be engaged immediately
- Use WhatsApp as the primary channel when possible
- Score leads based on source and engagement signals
- For SAL contacts: prioritize for SDR follow-up only on high-severity signals
- All actions exit through the filter — you only recommend actions, never execute directly
- You may execute multiple tools in sequence. If you need to create/update a contact before prioritizing, execute the upsert tool, wait for the response, and then execute the prioritization tool.

Context has already been retrieved and is provided below.`;

// Pre-processing: gather context deterministically before LLM call
async function gatherAcqSalContext(event: CXEvent): Promise<string> {
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
    `Signal ID: ${event.signal_id ?? 'N/A'}`,
    `Severity: ${event.signal_severity ?? 'N/A'}`,
    `Cause Code: ${event.cause_code ?? 'N/A'}`,
    `Contact ID: ${event.contact_id}`,
  ];

  if (event.input) {
    parts.push(`\nOperator Message:\n${event.input}`);
  }

  if (event.interventions && event.interventions.length > 0) {
    parts.push(`Interventions: ${event.interventions.join(', ')}`);
  }

  return parts.join('\n');
}

export async function runAcqSalSpecialist(db: Pool, event: CXEvent): Promise<void> {
  const activeTools = getClusterTools('acqsal');

  // Pre-processing (deterministic — no LLM call)
  const context = await gatherAcqSalContext(event);
  const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);

  // LLM client — acqsal uses Groq with automatic fallback to OpenRouter
  const clientConfig = await createLLMClientWithFallback();
  const llm = clientConfig.client as OpenAI;
  console.info(`[acqsal] using model: ${clientConfig.model} (provider: ${clientConfig.provider})`);

  const systemPrompt = `${ACQSAL_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

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
  let filterDispatches = 0;

  while (iterations < MAX_LOOP_ITERATIONS) {
    iterations++;
    console.info(`[acqsal] loop iteration=${iterations}/${MAX_LOOP_ITERATIONS} filter_dispatches=${filterDispatches}/${MAX_FILTER_DISPATCHES}`);

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

    console.info(`[acqsal] iteration=${iterations} stop_reason=${completion.choices[0]?.finish_reason} tokens_used=${completion.usage?.total_tokens}`);

    const message = completion.choices[0]?.message;
    const toolCalls = message?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      console.warn('[acqsal] LLM finished without tool call');
      break;
    }

    // Append the assistant's message back to context for sequential execution
    // Cast is needed because OpenAI types `tool_calls` slightly differently in responses vs inputs
    messages.push(message as OpenAI.ChatCompletionMessageParam);

    // Classify tool calls: null mapping = local/MCP tool, non-null = filter action
    const actionCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] !== undefined && TOOL_TO_ACTION[tc.function.name] !== null);
    const replyCalls  = toolCalls.filter(tc => tc.function.name === 'reply');
    const contextCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] === null && tc.function.name !== 'reply');

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      console.error('[acqsal] Mixed tool call batch rejected');
      break;
    }

    // Handle reply tool — send message back to contact via channel
    if (replyCalls.length > 0) {
      try {
        const args = JSON.parse(replyCalls[0].function.arguments) as { message: string };
        botReply = args.message;
        await sendReply(event.contact_id, botReply);
        console.log(`[acqsal] Reply sent to ${event.contact_id}`);
      } catch (err) {
        console.error('[acqsal] Failed to send reply:', err);
      }
      break;
    }

    if (contextCalls.length > 0) {
      console.warn('[acqsal] LLM requested context tools after pre-processing:', contextCalls.map(t => t.function.name));
      break;
    }

    if (actionCalls.length > 0) {
      const call = actionCalls[0];
      const mapping = TOOL_TO_ACTION[call.function.name];

      if (!mapping) {
        console.error(`[acqsal] Invalid action tool: ${call.function.name}`);
        break;
      }

      filterDispatches++;
      console.log(`[acqsal] Dispatching: ${mapping.action_id} (dispatch ${filterDispatches}/${MAX_FILTER_DISPATCHES})`);

      if (filterDispatches > MAX_FILTER_DISPATCHES) {
        console.warn(`[acqsal] Max filter dispatches (${MAX_FILTER_DISPATCHES}) reached — halting chain. session_id=${session_id}`);
        break;
      }

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
          triggered_by: `acqsal-specialist:${call.function.name}`,
          cluster: 'acqsal',
        },
      });

      actionsTaken.push({ action_id: mapping.action_id, status: filterResponse.status, log_id: filterResponse.log_id });

      // Post-dispatch memory write (fire-and-forget)
      await recordSessionOutcome(
        { contact_id: event.contact_id, stage: event.stage!, signal_id: event.signal_id! },
        mapping.action_id,
        filterResponse,
        session_id,
        'acqsal'
      );

      // Append filter response as tool role and continue for multi-step execution
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify({
          status: filterResponse.status,
          log_id: filterResponse.log_id,
          workflow_result: filterResponse.workflow_result,
        }),
      });

      // Provide dummy responses for any other tool calls in the same batch to avoid 400 errors from strict LLM APIs
      for (const tc of toolCalls) {
        if (tc.id !== call.id) {
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({ error: 'Ignored due to sequential execution policy. Call this again later if needed.' }),
          });
        }
      }

      continue;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    console.error(`[acqsal] Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
  }

  // Log session to Postgres for the Dashboard (fire-and-forget)
  await logSessionToDb(db, session_id, event, clientConfig.model, actionsTaken, botReply);
}
