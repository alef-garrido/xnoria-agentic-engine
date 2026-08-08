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

### Development Workflow

When making changes to the cognitive layer:

1. Run `npm run build` to compile TypeScript to `dist/`.
2. Restart the `cognitive` container via `docker compose restart cognitive`.
   The container mounts the host `dist/` directory as a volume, allowing changes to be picked up without a full image rebuild.

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

| Term        | Meaning                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| **Signal**  | A structured business event (new lead, support ticket, churn indicator) |
| **Plan**    | Cognitive layer's output — prioritized actions for a signal             |
| **Action**  | A single permitted operation, identified as `stage.resource.verb`       |
| **Stage**   | Customer journey phase: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP          |
| **Session** | One reasoning cycle — groups all actions from a single signal           |

## Critical Rules

1. **The cognitive layer never calls external systems directly.** All actions exit through the filter.
2. **Tools are statically defined** — no dynamic registration at runtime.
3. **The `reply` tool is the only tool that doesn't go through the filter.**
4. **Every reasoning cycle creates a session** — FK for history writes.

## On-Demand Diagnosis + Action Plans

Operator-triggered diagnosis (dashboard Radar tool) is a separate cognitive
service in `src/diagnosis/` — run via an Express endpoint, not the reasoning
loop:

- `POST /diagnose` (`src/diagnosis/server.ts`) — queues a job in the `diagnosis` table, resolves `email` → contact via the filter (`acq.contact.get`, fallback `email:<addr>`), then `runDiagnosis()` runs an LLM analysis (compass signal findings + stage health) via forced tool calls (`src/diagnosis/llm.ts`).
- `POST /diagnose/:id/plan` — `generatePlan()` produces ≤5 prioritized plan items. **Allowlist validation is deterministic:** each `action_id` must exist and be enabled in `filter_action` (read via the same pool), otherwise the item is dropped. Plans persist to `action_plan`.
- Jobs are fire-and-forget (`queued → running → completed|failed`); the dashboard polls `GET /diagnose/:id`.
- **Critical rule:** diagnosis results are informational. Nothing in `src/diagnosis/` dispatches to n8n or external systems — only dashboard-executed plan items reach the filter, and only via `POST /filter/execute` with `meta.triggered_by = "action-plan"`.
- Endpoint port: `COGNITIVE_DIAGNOSE_PORT` (default 3002); disabled when `<= 0`.

## Adding a New Tool

1. Add entry to `TOOLS[]` in `src/tools/definitions.ts`
2. Add mapping to `TOOL_TO_ACTION` in the same file (or `null` if local-only like `reply`)
3. Ensure corresponding `filter_action` seed row exists in the filter layer
4. Ensure n8n workflow exists for the action

## Environment Variables

| Variable                    | Description                            |
| --------------------------- | -------------------------------------- |
| `LLM_API_KEY`               | LLM API key                            |
| `TELEGRAM_BOT_TOKEN`        | Telegram bot token                     |
| `TELEGRAM_OPERATOR_CHAT_ID` | Operator chat for HITL notifications   |
| `COGNITIVE_MEMORY_PORT`     | Memory search endpoint (default: 3001) |
| `COGNITIVE_DIAGNOSE_PORT`   | Diagnosis endpoint (default: 3002)     |

## Database

- Migrations: `db/migrations/NNN_description.sql`
- Never modify existing migrations, always add new ones
- Tables: `cognitive_session`, `cognitive_history`, `cognitive_embeddings`, `diagnosis`, `action_plan`
