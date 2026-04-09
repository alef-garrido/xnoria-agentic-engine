# AGENTS.md — Cognitive Layer

**Location:** `layers/cognitive/`
**Role:** Agentic core — interprets signals, plans actions, decides

## Tech Stack
- **Runtime:** Node.js + TypeScript (ES2020, CommonJS)
- **LLM:** OpenAI-compatible API (Groq qwen3-32b)
- **Channel:** Telegram bot (node-telegram-bot-api)
- **Memory:** Postgres + pgvector (embeddings via Google API)
- **Build:** `tsc`, run with `ts-node` or `node dist/`

## Commands
```bash
npm run dev     # ts-node src/index.ts
npm run build   # tsc
npm run start   # node dist/index.js
```

## Directory Structure
```
src/
├── index.ts              # Entry: init DB, channels, event loop
├── agent/
│   └── reason.ts         # LLM reasoning cycle (core agent logic)
├── channels/
│   └── telegram.ts       # Telegram bot adapter (inbound/outbound)
├── events/
│   └── loop.ts           # Event router: receives CXEvents, routes to reason()
├── memory/
│   ├── history.ts        # Short-term conversation history (read/write)
│   └── embeddings.ts     # Semantic memory via pgvector + Google embeddings
├── shared/
│   └── types.ts          # CXEvent, FilterRequest/Response, ToolDefinition
├── tools/
│   └── definitions.ts    # LLM tool definitions + TOOL_TO_ACTION mapping
db/
└── migrations/           # Versioned schema migrations
```

## Key Concepts

### Signal Vocabulary Bridge
The cognitive layer receives `CXEvent` with optional Compass signal fields:
- `signal_id` — Compass signal ID (e.g. `SUP_RES_01`)
- `signal_severity` — 0–1 severity score
- `cause_code` — e.g. `SUP-RES`
- `interventions` — available intervention IDs

These fields enable the agent to reason about severity and select appropriate actions.

### Reasoning Cycle
1. CXEvent arrives from channel (Telegram)
2. Memory retrieval: read recent history + semantic search
3. Session initialization: insert `cognitive_session` row
4. System prompt assembly: contact context, journey stage, history
5. LLM call with `tools: TOOLS`, `tool_choice: 'auto'`
6. Tool call processing:
   - `reply` → handled locally, routed back through channel
   - Other tools → dispatched to filter via `POST /filter/execute`
7. Session update + history write + embedding storage

### Tool System
Tools are defined in `src/tools/definitions.ts`:
- `TOOLS[]` — OpenAI-compatible function tool definitions
- `TOOL_TO_ACTION` — Maps tool names → `{ action_id, stage }` for filter dispatch

The `reply` tool is special — it bypasses the filter and is handled by the event loop.

### Memory
- **Short-term:** `cognitive_history` table (recent turns per contact)
- **Semantic:** `cognitive_embeddings` table (pgvector, Google embeddings)
- Both are queried during reasoning to provide context

### Domain Language
| Term | Meaning |
|---|---|
| **Signal** | A structured business event (new lead, support ticket, churn indicator) |
| **Plan** | Cognitive layer's output — prioritized actions for a signal |
| **Action** | A single permitted operation, identified as `stage.resource.verb` |
| **Stage** | Customer journey phase: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP |
| **Session** | One reasoning cycle — groups all actions from a single signal |

## Critical Rules
1. **The cognitive layer never calls external systems directly.** All actions exit through the filter.
2. **Tools are statically defined** — no dynamic registration at runtime.
3. **The `reply` tool is the only tool that doesn't go through the filter.**
4. **Every reasoning cycle creates a session** — FK for history writes.

## Adding a New Tool
1. Add entry to `TOOLS[]` in `src/tools/definitions.ts`
2. Add mapping to `TOOL_TO_ACTION` in the same file (or `null` if local-only like `reply`)
3. Ensure corresponding `filter_action` seed row exists in the filter layer
4. Ensure n8n workflow exists for the action

## Environment Variables
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | LLM API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_OPERATOR_CHAT_ID` | Operator chat for HITL notifications |

## Database
- Migrations: `db/migrations/NNN_description.sql`
- Never modify existing migrations, always add new ones
- Tables: `cognitive_session`, `cognitive_history`, `cognitive_embeddings`
