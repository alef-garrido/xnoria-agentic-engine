"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLifecycleSpecialist = runLifecycleSpecialist;
const uuid_1 = require("uuid");
const clusters_1 = require("../../tools/clusters");
const llm_1 = require("../../shared/llm");
const client_1 = require("../../mcp/client");
const engram_1 = require("../../memory/engram");
const definitions_1 = require("../../tools/definitions");
const dispatch_1 = require("../dispatch");
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
async function gatherLifecycleContext(event) {
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
async function runLifecycleSpecialist(db, event) {
    const activeTools = (0, clusters_1.getClusterTools)('lifecycle');
    // Pre-processing (deterministic — no LLM call)
    const context = await gatherLifecycleContext(event);
    const contextBlock = buildContextBlock(context, MAX_CONTEXT_TOKENS);
    // LLM client for OpenAI-compatible (Groq/OpenRouter)
    const clientConfig = (0, llm_1.createLLMClient)('LLM_LIFECYCLE_MODEL');
    const llm = clientConfig.client;
    console.info(`[lifecycle] using model: ${clientConfig.model}`);
    const systemPrompt = `${LIFECYCLE_SYSTEM_PROMPT}\n\n## Retrieved Context\n${contextBlock}`;
    const session_id = (0, uuid_1.v4)();
    const messages = [
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
        console.info(`[lifecycle] iteration=${iterations} stop_reason=${completion.choices[0]?.finish_reason} tokens_used=${completion.usage?.total_tokens}`);
        const message = completion.choices[0]?.message;
        const toolCalls = message?.tool_calls ?? [];
        if (toolCalls.length === 0) {
            console.warn('[lifecycle] LLM finished without tool call');
            break;
        }
        // Classify tool calls
        const actionCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] !== null);
        const contextCalls = toolCalls.filter(tc => definitions_1.TOOL_TO_ACTION[tc.function.name] === null);
        if (actionCalls.length > 0 && contextCalls.length > 0) {
            console.error('[lifecycle] Mixed tool call batch rejected');
            break;
        }
        if (contextCalls.length > 0) {
            console.warn('[lifecycle] LLM requested context tools after pre-processing:', contextCalls.map(t => t.function.name));
            break;
        }
        if (actionCalls.length > 0) {
            const call = actionCalls[0];
            const mapping = definitions_1.TOOL_TO_ACTION[call.function.name];
            if (!mapping) {
                console.error(`[lifecycle] Invalid action tool: ${call.function.name}`);
                break;
            }
            console.log(`[lifecycle] Dispatching: ${mapping.action_id}`);
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
                    triggered_by: `lifecycle-specialist:${call.function.name}`,
                    cluster: 'lifecycle',
                },
            });
            // Post-dispatch memory write (fire-and-forget)
            await (0, engram_1.recordSessionOutcome)({ contact_id: event.contact_id, stage: event.stage, signal_id: event.signal_id }, mapping.action_id, filterResponse, session_id, 'lifecycle');
            break;
        }
    }
    if (iterations >= MAX_LOOP_ITERATIONS) {
        console.error(`[lifecycle] Max iterations (${MAX_LOOP_ITERATIONS}) reached`);
    }
}
