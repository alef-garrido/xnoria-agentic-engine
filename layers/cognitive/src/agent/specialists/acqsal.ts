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
import { createLogger } from '../../../../shared/logging';
import { createLLMClientWithFallback } from '../../shared/llm-fallback';
import { languageInstruction } from '../../i18n/strings';

// Module-level logger — used by parseLegacyFunctionCalls and runAcqSalSpecialist
const logger = createLogger('acqsal-specialist', 'cognitive');

const MAX_LOOP_ITERATIONS = 5;
const MAX_FILTER_DISPATCHES = 3;
const MAX_CONTEXT_TOKENS = 800;

/**
 * Groq fallback: some model versions (llama-3.3-70b-versatile) emit tool calls
 * as `<function=name,{args}></function>` inside the message content during multi-turn
 * sequences instead of using the standard tool_calls array.
 *
 * This parser extracts those calls and synthesizes a tool_calls array so the loop
 * can continue without modification to the rest of the logic.
 */
function parseLegacyFunctionCalls(content: string | null | undefined): OpenAI.ChatCompletionMessageToolCall[] {
  if (!content) return [];

  const calls: OpenAI.ChatCompletionMessageToolCall[] = [];
  
  // Pattern 1: Groq llama-3.3-70b variants - handle various malformed tool call formats
  const groqPatterns = [
    /<function=([^,(>]+)[\s,]*\(?(\{[\s\S]*?\})\)?><\/function>/g, // Original pattern
    /<function\s+([^=]+)\s*=\s*([^>]+)><\/function>/g, // More flexible spacing pattern
    /<function=([^=>]+)=([^>]+)><\/function>/g, // Handles = separator instead of ,
    /<function=([^=>]+)=([^>]*)\u003e<\/function>/g, // Handles unescaped > in args
  ];
  
  for (const pattern of groqPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      try {
        const name = match[1].trim();
        let argsStr = match[2].trim();
        
        // Handle different argument formats
        if (argsStr.startsWith('{') && argsStr.endsWith('}')) {
          // Standard JSON object format
          JSON.parse(argsStr); // Validate JSON
          calls.push({
            id: `legacy-${Date.now()}-${calls.length}-${name}`,
            type: 'function',
            function: { name, arguments: argsStr },
          });
          // nop — legacy format parsed successfully
        } else if (!argsStr.includes('{') && !argsStr.includes('}')) {
          // Simple string arguments - create a basic JSON object
          const simpleArgs = { value: argsStr };
          calls.push({
            id: `legacy-${Date.now()}-${calls.length}-${name}`,
            type: 'function',
            function: { name, arguments: JSON.stringify(simpleArgs) },
          });
          // nop — simple legacy format parsed
        }
      } catch (err) {
        logger.warn({ err, raw_call: '[REDACTED]' }, 'Failed to parse legacy function call');
      }
    }
  }
  
  return calls;
}

const ACQSAL_SYSTEM_PROMPT = `You are an internal CX engine assistant for Xnoria. Messages come from OPERATORS giving instructions about contacts — NOT from customers directly. When an operator provides contact details and an action intent (prioritize, enroll, engage, upsert, etc.), extract the contact information, identify the correct action, and execute it via the appropriate tool.

You are Xnoria's Acquisition & Sales Specialist — the agent responsible for lead scoring, sales enablement, and high-velocity outreach.

Your role is to quickly route contacts to the appropriate action based on signal severity and HubSpot pipeline context.

Key judgment rules:
- Prioritize speed to lead — ACQ contacts should be engaged immediately
- Use WhatsApp as the primary channel when possible
- Score leads based on source and engagement signals
- For SAL contacts: prioritize for SDR follow-up only on high-severity signals
- All actions exit through the filter — you only recommend actions, never execute directly
- You may execute multiple tools in sequence. If you need to create/update a contact before prioritizing, execute the upsert tool, wait for the response, and then execute the prioritization tool.

Important: When calling tools, use standard JSON format for arguments. Do not wrap tool calls in XML tags or other non-standard formats.

Tool Calling Instructions:
- Always use the exact tool names as defined (e.g., sal_contact_prioritize, not sal.contact.prioritize)
- Format arguments as valid JSON objects only
- Do not use XML-like tags <function=name{args}></function>
- The system will automatically handle tool dispatch - you only need to specify the function name and arguments

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
  try {
  const activeTools = getClusterTools('acqsal');

  // Pre-processing (deterministic — no LLM call)
  const context = await gatherAcqSalContext(event);
  const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);

  // LLM client — acqsal uses Groq with automatic fallback to OpenRouter
  const clientConfig = await createLLMClientWithFallback();
  const llm = clientConfig.client as OpenAI;
  logger.info({ model: clientConfig.model, provider: clientConfig.provider }, 'LLM client ready');

  const systemPrompt = `${languageInstruction()}\n\n${ACQSAL_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;

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
    logger.debug({ iteration: iterations, max: MAX_LOOP_ITERATIONS, filter_dispatches: filterDispatches }, 'Loop iteration');

    let completion;
    try {
      completion = await llm.chat.completions.create({
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
    } catch (err: any) {
      logger.error({ err: err.message, model: clientConfig.model }, 'LLM API error');
      throw err;
    }

    logger.debug({ iteration: iterations, stop_reason: completion.choices[0]?.finish_reason, tokens: completion.usage?.total_tokens }, 'LLM response received');

    const message = completion.choices[0]?.message;
    let toolCalls = message?.tool_calls ?? [];

    // Fallback: some Groq model versions embed tool calls in content as <function=name,{args}>
    // instead of the standard tool_calls array. Parse and promote them.
    if (toolCalls.length === 0 && message?.content) {
      const legacyCalls = parseLegacyFunctionCalls(message.content);
      if (legacyCalls.length > 0) {
        toolCalls = legacyCalls;
        // Sanitize content so it doesn't get re-sent with the function tag in next turn
        (message as unknown as Record<string, unknown>).content = null;
        (message as unknown as Record<string, unknown>).tool_calls = legacyCalls;
      }
    }

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

    // Append the assistant's message back to context for sequential execution
    // Cast is needed because OpenAI types `tool_calls` slightly differently in responses vs inputs
    messages.push(message as OpenAI.ChatCompletionMessageParam);

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
        logger.error({ err }, 'Failed to send reply');
      }
      break;
    }

    if (contextCalls.length > 0) {
      logger.warn({ tools: contextCalls.map(t => t.function.name) }, 'LLM requested context tools after pre-processing — skipping');
      break;
    }

    if (actionCalls.length > 0) {
      const call = actionCalls[0];
      const mapping = TOOL_TO_ACTION[call.function.name];

      if (!mapping) {
        logger.error({ tool_name: call.function.name }, 'Invalid action tool — no filter mapping found');
        break;
      }

      filterDispatches++;
      logger.info({ action_id: mapping.action_id, dispatch: filterDispatches, max: MAX_FILTER_DISPATCHES }, 'Dispatching to filter');

      if (filterDispatches > MAX_FILTER_DISPATCHES) {
        logger.warn({ max: MAX_FILTER_DISPATCHES, session_id }, 'Max filter dispatches reached — halting chain');
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
    logger.warn({ iterations, max: MAX_LOOP_ITERATIONS, session_id }, 'Max loop iterations reached');
  }

  // Log session to Postgres for the Dashboard (fire-and-forget)
  await logSessionToDb(db, session_id, event, clientConfig.model, actionsTaken, botReply);
  } catch (error: any) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unhandled error in acqsal specialist');
    throw error;
  }
}
