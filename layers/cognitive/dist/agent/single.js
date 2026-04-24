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
    return parts.join('\n');
}
async function runSingleAgent(db, event) {
    // Pre-processing (deterministic — no LLM call)
    const context = await gatherContext(event);
    const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);
    // LLM client — with automatic fallback from Groq to OpenRouter
    const clientConfig = await (0, llm_fallback_1.createLLMClientWithFallback)();
    const llm = clientConfig.client;
    console.info(`[single] using model: ${clientConfig.model} (provider: ${clientConfig.provider})`);
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
    while (iterations < MAX_LOOP_ITERATIONS) {
        iterations++;
        const completion = await llm.chat.completions.create({
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
        console.info(`[single] iteration=${iterations} stop_reason=${completion.choices[0]?.finish_reason} tokens_used=${completion.usage?.total_tokens}`);
        const message = completion.choices[0]?.message;
        const toolCalls = message?.tool_calls ?? [];
        if (toolCalls.length === 0) {
            console.warn('[single] LLM finished without tool call');
            break;
        }
        // Classify tool calls: null mapping = local/MCP tool, non-null = filter action
        const actionCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] !== undefined && definitions_1.TOOL_TO_ACTION[tc.function.name] !== null);
        const replyCalls = toolCalls.filter(tc => tc.function.name === 'reply');
        const contextCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] === null && tc.function.name !== 'reply');
        if (actionCalls.length > 0 && contextCalls.length > 0) {
            console.error('[single] Mixed tool call batch rejected');
            break;
        }
        // Handle reply tool — send message back to contact via channel
        if (replyCalls.length > 0) {
            try {
                const args = JSON.parse(replyCalls[0].function.arguments);
                botReply = args.message;
                await (0, telegram_1.sendReply)(event.contact_id, botReply);
                console.log(`[single] Reply sent to ${event.contact_id}`);
            }
            catch (err) {
                console.error('[single] Failed to send reply:', err);
                // Si falla al parsear los argumentos, intentar extraer el mensaje del error
                try {
                    const failedGenMatch = replyCalls[0].function.arguments.match(/"message":\s*"([^"]+)"/);
                    if (failedGenMatch && failedGenMatch[1]) {
                        await (0, telegram_1.sendReply)(event.contact_id, failedGenMatch[1]);
                        console.log(`[single] Fallback reply sent to ${event.contact_id}`);
                    }
                }
                catch (fallbackErr) {
                    console.error('[single] Fallback reply also failed:', fallbackErr);
                }
            }
            break;
        }
        if (contextCalls.length > 0) {
            console.warn('[single] LLM requested context tools after pre-processing:', contextCalls.map(t => t.function.name));
            break;
        }
        if (actionCalls.length > 0) {
            const call = actionCalls[0];
            const mapping = definitions_1.TOOL_TO_ACTION[call.function.name];
            if (!mapping) {
                console.error(`[single] Invalid action tool: ${call.function.name}`);
                break;
            }
            console.log(`[single] Dispatching: ${mapping.action_id}`);
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
            break;
        }
    }
    if (iterations >= MAX_LOOP_ITERATIONS) {
        console.error(`[single] Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
    }
    // Log session to Postgres for the Dashboard (fire-and-forget)
    await (0, session_1.logSessionToDb)(db, session_id, event, clientConfig.model, actionsTaken, botReply);
}
