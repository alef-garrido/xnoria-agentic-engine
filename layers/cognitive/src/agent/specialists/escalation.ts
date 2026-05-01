// ==============================================================================
// Exnoria · Cognitive · Escalation Specialist
// Phase 4 B4 — Agent-based orchestration
//
// Handles SUP, EXP stages — resolution and growth-focused.
// Low-volume, high-stakes decisions requiring accurate triage.
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
import { createLogger } from '../../../../shared/logging';

// Module-level logger
const logger = createLogger('escalation-specialist', 'cognitive');

const MAX_LOOP_ITERATIONS = 5;
const MAX_CONTEXT_TOKENS = 800;

const ESCALATION_SYSTEM_PROMPT = `Always respond in the same language the operator is writing in. If the operator writes in Spanish, respond in Spanish. If in English, respond in English.

You are an internal CX engine assistant for Xnoria. Messages come from OPERATORS giving instructions about contacts — NOT from customers directly. When an operator provides contact details and an action intent, extract the contact information, identify the correct action, and execute it via the appropriate tool.

You are Xnoria's Escalation Specialist — the agent responsible for support resolution escalation and expansion opportunities.

Your role is to accurately triage support tickets and identify expansion signals.

Key judgment rules:
- For SUP signals: escalate to senior queue only if ticket is open > 48h AND severity > 0.6
- For SUP signals: notify contact directly only if you have clear resolution status to communicate
- For EXP signals: flag only on high-confidence expansion signals (renewal near, usage spike, etc.)
- Never over-promise — expansion recommendations must be data-driven
- All actions exit through the filter — you only recommend actions, never execute directly

Context has already been retrieved and is provided below. Select one action only.`;

// Pre-processing: gather context deterministically before LLM call
async function gatherEscalationContext(event: CXEvent): Promise<string> {
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

  if (event.input) {
    parts.push(`\nOperator Message:\n${event.input}`);
  }

  return parts.join('\n');
}

export async function runEscalationSpecialist(db: Pool, event: CXEvent): Promise<void> {
  const activeTools = getClusterTools('escalation');

  // Pre-processing (deterministic — no LLM call)
  const context = await gatherEscalationContext(event);
  const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);

  // LLM client — escalation uses Groq with automatic fallback to OpenRouter
  const clientConfig = await createLLMClientWithFallback();
  const llm = clientConfig.client as OpenAI;
  logger.info({ model: clientConfig.model, provider: clientConfig.provider }, 'LLM client ready');

  const systemPrompt = `${ESCALATION_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

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

    logger.debug({ iteration: iterations, stop_reason: completion.choices[0]?.finish_reason, tokens: completion.usage?.total_tokens }, 'LLM response received');

    const message = completion.choices[0]?.message;
    const toolCalls = message?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const textContent = message?.content;
      if (textContent && textContent.trim()) {
        botReply = textContent;
        await sendReply(event.contact_id, textContent);
        logger.info({ contact_id: event.contact_id }, 'LLM text reply sent to contact');
      } else {
        logger.warn({ iteration: iterations }, 'LLM finished without tool call or text response');
      }
      break;
    }

    // Classify tool calls: null mapping = local/MCP tool, non-null = filter action
    const actionCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] !== undefined && TOOL_TO_ACTION[tc.function.name] !== null);
    const replyCalls  = toolCalls.filter(tc => tc.function.name === 'reply');
    const contextCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] === null && tc.function.name !== 'reply');

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      logger.error({ action_count: actionCalls.length, context_count: contextCalls.length }, 'Mixed tool call batch rejected');
      break;
    }

    // Handle reply tool — send message back to contact via channel
    if (replyCalls.length > 0) {
      try {
        const args = JSON.parse(replyCalls[0].function.arguments) as { message: string };
        botReply = args.message;
        await sendReply(event.contact_id, botReply);
        logger.info({ contact_id: event.contact_id }, 'Reply sent to contact');
      } catch (err) {
        logger.error({ err }, 'Failed to send reply — attempting regex fallback');
        try {
          const failedGenMatch = replyCalls[0].function.arguments.match(/"message":\s*"([^"]+)"/);
          if (failedGenMatch && failedGenMatch[1]) {
            await sendReply(event.contact_id, failedGenMatch[1]);
            logger.info({ contact_id: event.contact_id }, 'Fallback reply sent');
          }
        } catch (fallbackErr) {
          logger.error({ err: fallbackErr }, 'Fallback reply also failed');
        }
      }
      break;
    }

    if (contextCalls.length > 0) {
      logger.warn({ tools: contextCalls.map(tc => tc.function.name) }, 'LLM requested context tools after pre-processing — sending fallback reply');
      const fallback = 'I couldn\'t retrieve enough context to process this request. Please provide more details or include a stage keyword (ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP).';
      botReply = fallback;
      await sendReply(event.contact_id, fallback);
      break;
    }

    if (actionCalls.length > 0) {
      const call = actionCalls[0];
      const mapping = TOOL_TO_ACTION[call.function.name];

      if (!mapping) {
        logger.error({ tool_name: call.function.name }, 'Invalid action tool — no filter mapping found');
        break;
      }

      logger.info({ action_id: mapping.action_id }, 'Dispatching to filter');

      const filterResponse = await dispatchToFilter({
        action_id: mapping.action_id,
        stage: mapping.stage,
        session_id: session_id,
        contact_id: event.contact_id,
        signal_id: event.signal_id,
        signal_severity: event.signal_severity,
        cause_code: event.cause_code,
        interventions: event.interventions,
        payload: call.function.arguments ? JSON.parse(call.function.arguments) : {} as Record<string, unknown>,
        meta: {
          triggered_by: `escalation-specialist:${call.function.name}`,
          cluster: 'escalation',
        },
      });

      actionsTaken.push({ action_id: mapping.action_id, status: filterResponse.status, log_id: filterResponse.log_id });

      // Post-dispatch memory write (fire-and-forget)
      await recordSessionOutcome(
        { contact_id: event.contact_id, stage: event.stage!, signal_id: event.signal_id! },
        mapping.action_id,
        filterResponse,
        session_id,
        'escalation'
      );
      // Confirm action outcome to the operator via Telegram
      let confirmMsg: string;
      switch (filterResponse.status) {
        case 'executed':
          confirmMsg = `✅ Action \`${mapping.action_id}\` executed successfully.`;
          break;
        case 'pending_hitl':
          confirmMsg = `⏳ Action \`${mapping.action_id}\` is pending human approval (HITL). Check the dashboard to approve or reject.`;
          break;
        case 'rejected':
          confirmMsg = `🚫 Action \`${mapping.action_id}\` was rejected by the filter. Reason: ${filterResponse.rejection_code ?? 'unknown'}.`;
          break;
        case 'error':
          confirmMsg = `⚠️ Action \`${mapping.action_id}\` failed to execute. ${filterResponse.message ?? 'Workflow unreachable.'}`;
          break;
        default:
          confirmMsg = `ℹ️ Action \`${mapping.action_id}\` — status: ${filterResponse.status}.`;
      }
      botReply = confirmMsg;
      await sendReply(event.contact_id, confirmMsg);
      logger.info({ contact_id: event.contact_id, action_id: mapping.action_id, status: filterResponse.status }, 'Action confirmation sent to operator');
      break;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    logger.warn({ iterations, max: MAX_LOOP_ITERATIONS, session_id }, 'Max loop iterations reached');
  }

  // Log session to Postgres for the Dashboard (fire-and-forget)
  await logSessionToDb(db, session_id, event, clientConfig.model, actionsTaken, botReply);
}
