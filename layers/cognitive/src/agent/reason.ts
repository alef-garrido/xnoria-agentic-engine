// ==============================================================================
// Exnoria · Cognitive · Agent reasoning loop
// One reasoning cycle: context assembly → LLM call → tool dispatch
// ==============================================================================
import OpenAI from 'openai';
import axios   from 'axios';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { readHistory, writeHistory }       from '../memory/history';
import { embed, searchMemory, writeEmbedding } from '../memory/embeddings';
import { TOOLS, TOOL_TO_ACTION }           from '../tools/definitions';
import {
  CXEvent, FilterRequest, FilterResponse,
  HistoryTurn, MemoryHit
} from '../shared/types';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

const llm = new OpenAI({
  baseURL: process.env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1',
  apiKey:  process.env.LLM_API_KEY  ?? ''
});

const MODEL = process.env.LLM_MODEL ?? 'qwen/qwen3-32b';

// ------------------------------------------------------------------------------
// Dispatch a single tool call to the filter service
// ------------------------------------------------------------------------------
async function dispatchToFilter(
  action_id: string,
  stage: string,
  session_id: string,
  args: Record<string, unknown>
): Promise<FilterResponse> {
  const body: FilterRequest = {
    action_id,
    stage:      stage as FilterRequest['stage'],
    session_id,
    payload:    args,
    meta: { triggered_by: 'openclaw', confidence: 1.0 }
  };
  const res = await axios.post(`${FILTER_URL}/filter/execute`, body);
  return res.data as FilterResponse;
}

// ------------------------------------------------------------------------------
// Build system prompt with memory context
// ------------------------------------------------------------------------------
function buildSystemPrompt(
  history:    HistoryTurn[],
  memories:   MemoryHit[],
  event:      CXEvent
): string {
  const historyText = history.length > 0
    ? history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')
    : 'No previous interactions.';

  const memoryText = memories.length > 0
    ? memories.map(m =>
        `[${m.stage ?? 'unknown stage'} · similarity ${(m.similarity * 100).toFixed(0)}%] ${m.content}`
      ).join('\n')
    : 'No relevant past interactions found.';

  return `You are the Exnoria CX Intelligence Engine — a cognitive layer that interprets 
customer experience signals and decides which CX actions to take.

You operate on behalf of a business to improve customer experience across the 
full customer journey: ACQ → SAL → ONB → PRD → SUP → COM → RET → EXP.

CORE PRINCIPLE: You decide, you never execute directly. All actions go through 
the filter service which enforces what is permitted.

CURRENT CONTACT: ${event.contact_id}
CHANNEL: ${event.channel}
STAGE CONTEXT: ${event.stage ?? 'unknown — infer from signal'}

RECENT HISTORY:
${historyText}

RELEVANT PAST INTERACTIONS (semantic memory):
${memoryText}

INSTRUCTIONS:
- Analyze the incoming signal carefully
- Select only the tools that are genuinely appropriate for this signal
- Do not call tools speculatively — only when clearly warranted
- Use the reply tool to communicate back to the contact when needed
- Be concise and purposeful in your decisions`;
}

// ------------------------------------------------------------------------------
// Main reasoning cycle
// ------------------------------------------------------------------------------
export interface ReasonResult {
  session_id:    string;
  actions_taken: FilterResponse[];
  reply?:        string;
}

export async function reason(db: Pool, event: CXEvent): Promise<ReasonResult> {
  const session_id = uuid();

  console.log(`\n[agent] Session: ${session_id}`);
  console.log(`[agent] Contact: ${event.contact_id} | Channel: ${event.channel}`);
  console.log(`[agent] Input:   ${event.input}`);

  // 1. Read memory
  const [history, queryEmbedding] = await Promise.all([
    readHistory(db, event.contact_id),
    embed(event.input)
  ]);
  const memories = await searchMemory(db, event.contact_id, queryEmbedding);

  console.log(`[agent] History: ${history.length} turns | Memory hits: ${memories.length}`);

  // 1.5 Initialize session record before writing history (due to foreign key)
  await db.query(
    `INSERT INTO cognitive_session
       (id, contact_id, channel, stage, input, model)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [session_id, event.contact_id, event.channel, event.stage ?? null, event.input, MODEL]
  );

  // 2. Write user turn to history
  await writeHistory(db, event.contact_id, event.channel, 'user',
    event.input, session_id, event.stage);

  // 3. Build prompt and call LLM
  const systemPrompt = buildSystemPrompt(history, memories, event);

  const completion = await llm.chat.completions.create({
    model:       MODEL,
    messages:    [
      { role: 'system',  content: systemPrompt },
      { role: 'user',    content: event.input  }
    ],
    tools:       TOOLS,
    tool_choice: 'auto'
  });

  const message = completion.choices[0].message;
  const toolCalls = message.tool_calls ?? [];

  console.log(`[agent] LLM selected ${toolCalls.length} action(s)`);

  // 4. Process tool calls
  const actions_taken: FilterResponse[] = [];
  let replyMessage: string | undefined;

  for (const call of toolCalls) {
    const name   = call.function.name;
    const args   = JSON.parse(call.function.arguments) as Record<string, unknown>;
    const action = TOOL_TO_ACTION[name];

    if (name === 'reply') {
      replyMessage = args.message as string;
      console.log(`[agent] → reply: ${replyMessage}`);
      continue;
    }

    if (!action) {
      console.warn(`[agent] Unknown tool: ${name} — skipping`);
      continue;
    }

    console.log(`[agent] → Dispatching: ${action.action_id} (${action.stage})`);
    const result = await dispatchToFilter(
      action.action_id, action.stage, session_id, args
    );
    console.log(`[agent]   status=${result.status} log_id=${result.log_id}`);
    actions_taken.push(result);
  }

  // 5. Update session record with actions taken
  await db.query(
    `UPDATE cognitive_session
     SET actions_taken = $1
     WHERE id = $2`,
    [JSON.stringify(actions_taken), session_id]
  );

  // 6. Write assistant turn + embedding
  const assistantContent = replyMessage
    ?? `Processed ${actions_taken.length} action(s): ${actions_taken.map(a => a.status).join(', ')}`;

  await writeHistory(db, event.contact_id, event.channel, 'assistant',
    assistantContent, session_id, event.stage);

  await writeEmbedding(db, event.contact_id, event.input,
    queryEmbedding, session_id, event.stage);

  return { session_id, actions_taken, reply: replyMessage };
}
