"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSingleAgent = runSingleAgent;
const uuid_1 = require("uuid");
const definitions_1 = require("../tools/definitions");
const client_1 = require("../mcp/client");
const engram_1 = require("../memory/engram");
const dispatch_1 = require("./dispatch");
const telegram_1 = require("../channels/telegram");
const session_1 = require("../memory/session");
const llm_fallback_1 = require("../shared/llm-fallback");
const logging_1 = require("../../../shared/logging");
const logger = (0, logging_1.createLogger)('single-agent', 'cognitive');
const MAX_LOOP_ITERATIONS = 5;
const MAX_FILTER_DISPATCHES = 3;
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
async function gatherContext(event) {
    const signalCtx = await (0, client_1.executeMcpTool)('compass_get_signal', { signal_id: event.signal_id });
    const signalContent = signalCtx.success
        ? signalCtx.content.substring(0, 500)
        : 'Signal context unavailable.';
    return `Signal Context: ${signalContent}\n\n${event.meta?.cross_stage_history || 'No cross-stage history available.'}`;
}
// Build context block respecting token budget
function buildContextBlock(context, maxTokens) {
    const charsPerToken = 4;
    const maxChars = maxTokens * charsPerToken;
    return context.length > maxChars ? context.substring(0, maxChars) : context;
}
// Build event prompt for LLM
function buildEventPrompt(event) {
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
async function runSingleAgent(db, event) {
    // Pre-processing (deterministic — no LLM call)
    const context = await gatherContext(event);
    const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);
    // LLM client — with automatic fallback from Groq to OpenRouter
    const clientConfig = await (0, llm_fallback_1.createLLMClientWithFallback)();
    const llm = clientConfig.client;
    logger.info({ model: clientConfig.model, provider: clientConfig.provider }, 'LLM client ready');
    const systemPrompt = `${SINGLE_AGENT_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;
    const session_id = event.meta?.session_id ?? (0, uuid_1.v4)();
    const actionsTaken = [];
    let botReply;
    const messages = [
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
        let retries = 0;
        const MAX_RETRIES = 1;
        while (true) {
            try {
                completion = await llm.chat.completions.create({
                    model: clientConfig.model,
                    messages,
                    tools: definitions_1.TOOLS.map((t) => ({
                        type: 'function',
                        function: {
                            name: t.function.name,
                            description: t.function.description,
                            parameters: t.function.parameters,
                        },
                    })),
                    tool_choice: 'auto',
                });
                break;
            }
            catch (err) {
                const apiError = err;
                if (retries >= MAX_RETRIES || apiError?.status !== 400 || !apiError?.message?.includes('tool_use_failed')) {
                    throw err;
                }
                retries++;
                logger.warn({ retry: retries, iteration: iterations }, 'LLM function call malformed — retrying');
                messages.push({
                    role: 'user',
                    content: 'Your previous function call had a JSON syntax error. Ensure you pass valid JSON (curly braces {}, double quotes on keys/strings, no brackets). Call the function again with correct syntax.',
                });
            }
        }
        logger.debug({ iteration: iterations, stop_reason: completion.choices[0]?.finish_reason, tokens: completion.usage?.total_tokens }, 'LLM response received');
        const message = completion.choices[0]?.message;
        const toolCalls = message?.tool_calls ?? [];
        if (toolCalls.length === 0) {
            const textContent = message?.content;
            if (textContent && textContent.trim()) {
                botReply = textContent;
                await (0, telegram_1.sendReply)(event.contact_id, textContent);
                logger.info({ contact_id: event.contact_id }, 'LLM text reply sent to contact');
            }
            else {
                logger.warn({ iteration: iterations }, 'LLM finished without tool call or text response');
            }
            break;
        }
        // Classify tool calls: null mapping = local/MCP tool, non-null = filter action
        const actionCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] !== undefined && definitions_1.TOOL_TO_ACTION[tc.function.name] !== null);
        const replyCalls = toolCalls.filter(tc => tc.function.name === 'reply');
        const contextCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] === null && tc.function.name !== 'reply');
        if (actionCalls.length > 0 && contextCalls.length > 0) {
            logger.error({ action_count: actionCalls.length, context_count: contextCalls.length }, 'Mixed tool call batch rejected');
            break;
        }
        // Append the assistant's message back to context for sequential execution
        messages.push(message);
        // Handle reply tool — send message back to contact via channel
        if (replyCalls.length > 0) {
            try {
                const args = JSON.parse(replyCalls[0].function.arguments);
                botReply = args.message;
                await (0, telegram_1.sendReply)(event.contact_id, botReply);
                logger.info({ contact_id: event.contact_id }, 'Reply sent to contact');
            }
            catch (err) {
                logger.error({ err }, 'Failed to send reply — attempting regex fallback');
                try {
                    const failedGenMatch = replyCalls[0].function.arguments.match(/"message":\s*"([^"]+)"/);
                    if (failedGenMatch && failedGenMatch[1]) {
                        await (0, telegram_1.sendReply)(event.contact_id, failedGenMatch[1]);
                        logger.info({ contact_id: event.contact_id }, 'Fallback reply sent');
                    }
                }
                catch (fallbackErr) {
                    logger.error({ err: fallbackErr }, 'Fallback reply also failed');
                }
            }
            break;
        }
        if (contextCalls.length > 0) {
            logger.warn({ tools: contextCalls.map(t => t.function.name) }, 'LLM requested context tools after pre-processing — sending fallback reply');
            const fallback = 'I couldn\'t retrieve enough context to process this request. Please provide more details or include a stage keyword (ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP).';
            botReply = fallback;
            await (0, telegram_1.sendReply)(event.contact_id, fallback);
            break;
        }
        if (actionCalls.length > 0) {
            const call = actionCalls[0];
            const mapping = definitions_1.TOOL_TO_ACTION[call.function.name];
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
            const filterResponse = await (0, dispatch_1.dispatchToFilter)({
                action_id: mapping.action_id,
                stage: mapping.stage,
                session_id: session_id,
                contact_id: event.contact_id,
                signal_id: event.signal_id,
                signal_severity: event.signal_severity,
                cause_code: event.cause_code,
                interventions: event.interventions,
                payload: JSON.parse(call.function.arguments),
                meta: {
                    triggered_by: `single-agent:${call.function.name}`,
                    // No cluster tag in single mode
                },
            });
            actionsTaken.push({ action_id: mapping.action_id, status: filterResponse.status, log_id: filterResponse.log_id });
            // Post-dispatch memory write (fire-and-forget)
            await (0, engram_1.recordSessionOutcome)({ contact_id: event.contact_id, stage: event.stage, signal_id: event.signal_id }, mapping.action_id, filterResponse, session_id
            // No cluster tag in single mode
            );
            // Confirm action outcome to the operator via Telegram
            let confirmMsg;
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
            await (0, telegram_1.sendReply)(event.contact_id, confirmMsg);
            logger.info({ contact_id: event.contact_id, action_id: mapping.action_id, status: filterResponse.status }, 'Action confirmation sent to operator');
            // Only 'executed' status allows chaining — HITL, rejected, error all halt the loop
            if (filterResponse.status !== 'executed') {
                logger.info({ status: filterResponse.status, action_id: mapping.action_id }, 'Non-executed status — halting chain');
                break;
            }
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
    await (0, session_1.logSessionToDb)(db, session_id, event, clientConfig.model, actionsTaken, botReply);
}
