// ==============================================================================
// Exnoria · Cognitive · Single Agent
// Phase 4 B4 Enhancement — AGENT_MODE switch
//
// Legacy single-agent behavior for debugging, cost control, or constrained infra.
// Uses ALL TOOLS, LLM_MODEL env var, no cluster tagging.
//
// CRITICAL: All actions still go through dispatchToFilter — no shortcuts.
// ==============================================================================
import OpenAI from 'openai';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { CXEvent } from '../shared/types';
import { TOOLS, TOOL_TO_ACTION } from '../tools/definitions';
import { executeMcpTool } from '../mcp/client';
import { recordSessionOutcome } from '../memory/engram';
import { dispatchToFilter } from './dispatch';
import { sendReply } from '../channels/telegram';
import { logSessionToDb, ActionRecord } from '../memory/session';
import { createLLMClientWithFallback } from '../shared/llm-fallback';
import { createLogger } from '../../../shared/logging';

const logger = createLogger('single-agent', 'cognitive');

const MAX_LOOP_ITERATIONS = 5;
const MAX_CONTEXT_TOKENS = 800;

const SINGLE_AGENT_SYSTEM_PROMPT = `You are Xnoria's customer experience agent. 
Select the single most appropriate action for the signal you receive.

Key judgment rules:
- Prefer the least invasive action that matches the signal severity
- Check prior interventions before acting
- For ONB signals: nudge first (automated), assist only if severity >= 0.8
- For RET signals: flag first, winback only if severity >= 0.7
- For COM signals: legally sensitive — always confirm compliance
- For PRD_CAP_02: log only, do not message the contact

Context has already been retrieved and is provided below. Select one action only.`;

// Pre-processing: gather context deterministically before LLM call
async function gatherContext(event: CXEvent): Promise<string> {
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

export async function runSingleAgent(db: Pool, event: CXEvent): Promise<void> {
  // Pre-processing (deterministic — no LLM call)
  const context = await gatherContext(event);
  const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);

  // LLM client — with automatic fallback from Groq to OpenRouter
  const clientConfig = await createLLMClientWithFallback();
  const llm = clientConfig.client as OpenAI;
  logger.info({ model: clientConfig.model, provider: clientConfig.provider }, 'LLM client ready');

  const systemPrompt = `${SINGLE_AGENT_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

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
      tools: TOOLS.map((t) => ({
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
      logger.warn({ tools: contextCalls.map(t => t.function.name) }, 'LLM requested context tools after pre-processing — sending fallback reply');
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
        payload: JSON.parse(call.function.arguments) as Record<string, unknown>,
        meta: {
          triggered_by: `single-agent:${call.function.name}`,
          // No cluster tag in single mode
        },
      });

      actionsTaken.push({ action_id: mapping.action_id, status: filterResponse.status, log_id: filterResponse.log_id });

      // Post-dispatch memory write (fire-and-forget)
      await recordSessionOutcome(
        { contact_id: event.contact_id, stage: event.stage!, signal_id: event.signal_id! },
        mapping.action_id,
        filterResponse,
        session_id
        // No cluster tag in single mode
      );
      break;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    logger.warn({ iterations, max: MAX_LOOP_ITERATIONS, session_id }, 'Max loop iterations reached');
  }

  // Log session to Postgres for the Dashboard (fire-and-forget)
  await logSessionToDb(db, session_id, event, clientConfig.model, actionsTaken, botReply);
}