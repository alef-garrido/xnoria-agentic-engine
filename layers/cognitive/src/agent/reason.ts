// ==============================================================================
// Exnoria · Cognitive · Agent reasoning wrapper (Phase 4 B4)
// Routes to coordinator → specialist → filter
// ==============================================================================
import { Pool } from 'pg';
import { CNXEvent } from '../shared/types';
import { coordinate } from './coordinator';

export async function reason(db: Pool, event: CNXEvent): Promise<void> {
  return coordinate(db, event);
}
  }

  return { history, memories, compassContext };
}

// ------------------------------------------------------------------------------
// 2. LLM CALL: System Prompt & Decisions
// ------------------------------------------------------------------------------

function buildSystemPrompt(history: HistoryTurn[], memories: MemoryHit[], event: CXEvent, context: { compassContext: string }, activeTools: ToolDefinition[]): string {
  const historyText = history.length > 0 ? history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n') : 'None';
  const memoryText = memories.length > 0 ? memories.slice(0, 3).map(m => m.content).join('\n') : 'None';
  const toolList = activeTools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n');

  return `You are the Exnoria CX Intelligence Engine.
CORE PRINCIPLE: You decide, the filter executes. 

CONTEXT:
Contact: ${event.contact_id} | Stage: ${event.stage ?? 'Unknown'}
Compass Signal: ${context.compassContext}
Recent History: ${historyText}
Semantic Memory: ${memoryText}

ACTIVE TOOLS FOR THIS STAGE:
${toolList}

INSTRUCTIONS:
- Use the provided context to decide the best action.
- Only select tools listed above.
- The 'reply' tool is for direct contact communication.
- **CONTEXT IS ALREADY PROVIDED — DO NOT CALL compass_get_signal OR OTHER CONTEXT RETRIEVAL TOOLS**
- Be concise.`;
}

async function dispatchToFilter(action_id: string, stage: string, session_id: string, args: Record<string, unknown>): Promise<FilterResponse> {
  const res = await axios.post(`${FILTER_URL}/filter/execute`, {
    action_id,
    stage: stage as any,
    session_id,
    payload: args,
    meta: { triggered_by: 'openclaw', confidence: 1.0 }
  });
  return res.data;
}

// ------------------------------------------------------------------------------
// MAIN REASONING CYCLE
// ------------------------------------------------------------------------------

export interface ReasonResult {
  session_id: string;
  actions_taken: FilterResponse[];
  reply?: string;
}

export async function reason(db: Pool, event: CXEvent): Promise<ReasonResult> {
  const session_id = uuid();
  console.log(`\n[agent] Session: ${session_id} | Stage: ${event.stage ?? 'unknown (inferred from input)'}`);

  // Section 1: Pre-processing
  const context = await gatherContext(db, event);
  
  // Stage-aware tool selection (Entry Gate)
  // If stage is provided, filter by stage. Otherwise, include all tools and let LLM infer stage.
  const activeTools = TOOLS.filter(tool => {
    const mapping = TOOL_TO_ACTION[tool.function.name];
    // Always include: context retrieval tools and reply
    if (mapping === null) return true;
    // Filter by stage if provided, otherwise include all filter actions
    return !event.stage || mapping.stage === event.stage;
  });
  
  // Debug logging for verification (acceptance criterion 1)
  console.debug(`[reason] stage=${event.stage ?? 'unknown'} active_tools=${activeTools.length}: ${activeTools.map(t => t.function.name).join(', ')}`);

  await db.query(
    'INSERT INTO cognitive_session (id, contact_id, channel, stage, input, model) VALUES ($1, $2, $3, $4, $5, $6)',
    [session_id, event.contact_id, event.channel, event.stage, event.input, MODEL]
  );
  await writeHistory(db, event.contact_id, event.channel, 'user', event.input, session_id, event.stage);

  // Section 2: LLM Loop with multi-turn support
  const systemPrompt = buildSystemPrompt(context.history, context.memories, event, context, activeTools);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: any[] = [{ role: 'system', content: systemPrompt }, { role: 'user', content: event.input }];
  let actions_taken: FilterResponse[] = [];
  let replyMessage: string | undefined;
  let iterations = 0;

  while (iterations < MAX_LOOP_ITERATIONS) {
    iterations++;
    
    const completion = await llm.chat.completions.create({
      model: MODEL,
      messages,
      tools: activeTools,
      tool_choice: 'auto'
    });

    // Token usage logging (critical for optimization verification)
    console.info(`[reason] tokens used: prompt=${completion.usage?.prompt_tokens} completion=${completion.usage?.completion_tokens} total=${completion.usage?.total_tokens}`);

    const message = completion.choices[0].message;
    const toolCalls = message.tool_calls ?? [];

    if (toolCalls.length === 0 && message.content) {
      // LLM finished without selecting an action — log and exit
      replyMessage = message.content;
      console.warn('[reason] LLM returned no tool calls, only content');
      break;
    }

    // Classify tool calls — reject mixed batches (action + context in same turn)
    const actionCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] !== null);
    const contextCalls = toolCalls.filter(tc => TOOL_TO_ACTION[tc.function.name] === null);

    if (actionCalls.length > 0 && contextCalls.length > 0) {
      // LLM attempted to retrieve context and act in the same turn — reject
      console.error('[reason] Mixed tool call batch rejected:', toolCalls.map(t => t.function.name));
      break;
    }

    if (contextCalls.length > 0) {
      // This should not happen if pre-processing is working correctly
      // Log as a warning but handle gracefully rather than crashing
      console.warn('[reason] LLM requested context tools after pre-processing:', contextCalls.map(t => t.function.name));
      
      // Execute context calls and feed results back — degraded path
      for (const call of contextCalls) {
        const result = await executeMcpTool(call.function.name, JSON.parse(call.function.arguments));
        messages.push({
          role: 'tool' as const,
          tool_call_id: call.id,
          content: result.success ? result.content : `Error: ${result.error}`
        });
      }
      continue;
    }

    if (actionCalls.length > 0) {
      // Execute the first action call — single action per session
      const call = actionCalls[0];
      const action = TOOL_TO_ACTION[call.function.name];
      
      if (!action) {
        console.error(`[agent] Invalid action tool: ${call.function.name}`);
        break;
      }

      console.log(`[agent] Dispatching: ${action.action_id}`);
      const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
      const res = await dispatchToFilter(action.action_id, action.stage, session_id, args);
      actions_taken.push(res);
      break;
    }
  }

  if (iterations >= MAX_LOOP_ITERATIONS) {
    console.error(`[reason] Max iterations (${MAX_LOOP_ITERATIONS}) reached without action dispatch`);
  }

  // Section 4: Memory Write (Fire-and-forget)
  if (actions_taken.length > 0 && event.signal_id) {
    await recordSessionOutcome(
      { contact_id: event.contact_id, stage: event.stage ?? 'UNKNOWN', signal_id: event.signal_id },
      actions_taken[0].log_id ?? 'unknown',
      actions_taken[0],
      session_id
    );
  }

  await db.query('UPDATE cognitive_session SET actions_taken = $1 WHERE id = $2', [JSON.stringify(actions_taken), session_id]);
  await writeHistory(db, event.contact_id, event.channel, 'assistant', replyMessage ?? `Performed ${actions_taken.length} actions`, session_id, event.stage ?? undefined);
  await writeEmbedding(db, event.contact_id, event.input, await embed(event.input), session_id, event.stage);

  return { session_id, actions_taken, reply: replyMessage };
}
