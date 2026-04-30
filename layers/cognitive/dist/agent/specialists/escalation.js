"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEscalationSpecialist = runEscalationSpecialist;
const uuid_1 = require("uuid");
const clusters_1 = require("../../tools/clusters");
const client_1 = require("../../mcp/client");
const engram_1 = require("../../memory/engram");
const definitions_1 = require("../../tools/definitions");
const dispatch_1 = require("../dispatch");
const telegram_1 = require("../../channels/telegram");
const session_1 = require("../../memory/session");
const llm_fallback_1 = require("../../shared/llm-fallback");
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
async function gatherEscalationContext(event) {
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
async function runEscalationSpecialist(db, event) {
    const activeTools = (0, clusters_1.getClusterTools)('escalation');
    // Pre-processing (deterministic — no LLM call)
    const context = await gatherEscalationContext(event);
    const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);
    // LLM client — escalation uses Groq with automatic fallback to OpenRouter
    const clientConfig = await (0, llm_fallback_1.createLLMClientWithFallback)();
    const llm = clientConfig.client;
    console.info(`[escalation] using model: ${clientConfig.model} (provider: ${clientConfig.provider})`);
    const systemPrompt = `${ESCALATION_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;
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
            tools: activeTools.map((t) => ({
                type: 'function',
                function: {
                    name: t.function.name,
                    description: t.function.description,
                    parameters: t.function.parameters,
                },
            })),
            tool_choice: 'auto',
        });
        console.info(`[escalation] iteration=${iterations} stop_reason=${completion.choices[0]?.finish_reason} tokens_used=${completion.usage?.total_tokens}`);
        const message = completion.choices[0]?.message;
        const toolCalls = message?.tool_calls ?? [];
        if (toolCalls.length === 0) {
            console.warn('[escalation] LLM finished without tool call');
            break;
        }
        // Classify tool calls: null mapping = local/MCP tool, non-null = filter action
        const actionCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] !== undefined && definitions_1.TOOL_TO_ACTION[tc.function.name] !== null);
        const replyCalls = toolCalls.filter(tc => tc.function.name === 'reply');
        const contextCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] === null && tc.function.name !== 'reply');
        if (actionCalls.length > 0 && contextCalls.length > 0) {
            console.error('[escalation] Mixed tool call batch rejected');
            break;
        }
        // Handle reply tool — send message back to contact via channel
        if (replyCalls.length > 0) {
            try {
                const args = JSON.parse(replyCalls[0].function.arguments);
                botReply = args.message;
                await (0, telegram_1.sendReply)(event.contact_id, botReply);
                console.log(`[escalation] Reply sent to ${event.contact_id}`);
            }
            catch (err) {
                console.error('[escalation] Failed to send reply:', err);
                // Si falla al parsear los argumentos, intentar extraer el mensaje del error
                try {
                    const failedGenMatch = replyCalls[0].function.arguments.match(/"message":\s*"([^"]+)"/);
                    if (failedGenMatch && failedGenMatch[1]) {
                        await (0, telegram_1.sendReply)(event.contact_id, failedGenMatch[1]);
                        console.log(`[escalation] Fallback reply sent to ${event.contact_id}`);
                    }
                }
                catch (fallbackErr) {
                    console.error('[escalation] Fallback reply also failed:', fallbackErr);
                }
            }
            break;
        }
        if (contextCalls.length > 0) {
            console.warn('[escalation] LLM requested context tools after pre-processing:', contextCalls.map(tc => tc.function.name));
            break;
        }
        if (actionCalls.length > 0) {
            const call = actionCalls[0];
            const mapping = definitions_1.TOOL_TO_ACTION[call.function.name];
            if (!mapping) {
                console.error(`[escalation] Invalid action tool: ${call.function.name}`);
                break;
            }
            console.log(`[escalation] Dispatching: ${mapping.action_id}`);
            const filterResponse = await (0, dispatch_1.dispatchToFilter)({
                action_id: mapping.action_id,
                stage: mapping.stage,
                session_id: session_id,
                contact_id: event.contact_id,
                signal_id: event.signal_id,
                signal_severity: event.signal_severity,
                cause_code: event.cause_code,
                interventions: event.interventions,
                payload: call.function.arguments ? JSON.parse(call.function.arguments) : {},
                meta: {
                    triggered_by: `escalation-specialist:${call.function.name}`,
                    cluster: 'escalation',
                },
            });
            actionsTaken.push({ action_id: mapping.action_id, status: filterResponse.status, log_id: filterResponse.log_id });
            // Post-dispatch memory write (fire-and-forget)
            await (0, engram_1.recordSessionOutcome)({ contact_id: event.contact_id, stage: event.stage, signal_id: event.signal_id }, mapping.action_id, filterResponse, session_id, 'escalation');
            break;
        }
    }
    if (iterations >= MAX_LOOP_ITERATIONS) {
        console.error(`[escalation] Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
    }
    // Log session to Postgres for the Dashboard (fire-and-forget)
    await (0, session_1.logSessionToDb)(db, session_id, event, clientConfig.model, actionsTaken, botReply);
}
