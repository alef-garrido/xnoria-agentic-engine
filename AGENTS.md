# AGENTS.md — Xnoria Agentic Engine
## Project Overview
**Exnoria** is a CX Intelligence Engine — an operational intelligence layer that sits above CRM, support, and marketing systems to coordinate diagnosis, prioritization, and controlled execution.
**Core rule:** The cognitive layer decides. The orchestration layer executes. The human intervenes where it matters interacting with the dashboard layer.
## Architecture
```
External systems / events
          │
          ▼
┌─────────────────────────────────┐
│  Execution Layer (Dashboard)    │  layers/dashboard/
│  Signals · Reporting · HITL     │  Next.js 16 + React 19
└────────────┬────────────────────┘
             │  Structured CX signal
             ▼
┌─────────────────────────────────┐
│  Cognitive Layer (Agentic Core) │  layers/cognitive/
│  Interprets · Plans · Decides   │  OpenAI-compatible LLM (Groq qwen3-32b)
└────────────┬────────────────────┘
             │  POST /filter/execute
             ▼
┌─────────────────────────────────┐
│  Filter Service                 │  layers/orchestration/filter/
│  Allowlist · Audit · Route      │  Express + Postgres
└────────────┬────────────────────┘
             │  Webhook trigger
             ▼
┌─────────────────────────────────┐
│  n8n Workflows                  │  layers/orchestration/workflows/
│  Executes actions               │  n8n
└────────────┬────────────────────┘
             │
             ▼
    External systems (CRM, sequences, comms)
```
### Three Non-Negotiable Principles
1. **The cognitive layer never calls external systems directly.** All actions exit through the filter.
2. **Every action is logged**, whether executed, rejected, or pending human approval.
3. **The filter allowlist is managed at runtime** via the database, not by redeploying code.
## Directory Structure
```
xnoria-agentic-engine/
├── layers/
│   ├── cognitive/                    # Agentic core
│   │   ├── src/
│   │   │   ├── index.ts              # Entry: init DB, channels, event loop
│   │   │   ├── agent/reason.ts       # LLM reasoning cycle
│   │   │   ├── channels/telegram.ts  # Telegram bot adapter
│   │   │   ├── events/loop.ts        # Event router
│   │   │   ├── memory/               # History + embeddings
│   │   │   ├── shared/types.ts       # CXEvent, FilterRequest/Response
│   │   │   └── tools/definitions.ts  # LLM tool definitions
│   │   └── db/migrations/
│   │
│   ├── orchestration/
│   │   └── filter/
│   │       ├── src/
│   │       │   ├── index.ts          # Express: POST /filter/execute, GET /health
│   │       │   ├── allowlist/        # DB allowlist lookup
│   │       │   ├── audit/            # Immutable audit log writer
│   │       │   ├── execution/        # n8n webhook dispatcher
│   │       │   └── shared/types.ts   # JourneyStage, FilterStatus, etc.
│   │       └── db/
│   │           ├── migrations/       # Versioned schema
│   │           └── seed.sql          # MVP action seed data
│   │
│   └── dashboard/                    # Next.js 16 dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/      # Dashboard pages
│       │   │   ├── api/              # API routes
│       │   │   └── login/            # Auth
│       │   ├── components/           # UI components
│       │   ├── lib/db.ts             # Postgres pool wrapper
│       │   └── proxy.ts              # Auth middleware
│       └── data/                     # Example data files
│
├── docker-compose.yml
├── .env / .env.example
└── .plan/                            # Planning documents
```
## Domain Language
Use these terms consistently across all code, files, and database tables:
| Term | Meaning |
|---|---|
| **Signal** | A structured business event (new lead, support ticket, churn indicator) |
| **Plan** | Cognitive layer's output — prioritized actions for a signal |
| **Action** | A single permitted operation, identified as `stage.resource.verb` |
| **Stage** | Customer journey phase: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP |
| **Session** | One reasoning cycle — groups all actions from a single signal |
| **Allowlist** | Actions currently permitted to execute (filter_action table) |
| **Audit log** | Immutable record of every action attempted (filter_log table) |
| **HITL** | Human-in-the-loop — action requiring human approval |
## MVP Scope
Three workflows targeting ACQ/SAL journey stage:
| Action ID | Stage | Description |
|---|---|---|
| `acq.lead.score` | ACQ | Score incoming lead, apply CRM tags |
| `sal.sequence.enroll` | SAL | Enroll contact in sales sequence |
| `sal.contact.prioritize` | SAL | Flag contact for immediate SDR follow-up |
## Development Workflows
### Adding a New Action (End-to-End)
1. **Build n8n workflow** in n8n UI at `localhost:5678`
2. **Export workflow JSON** to `layers/orchestration/workflows/`
3. **Register action** in filter seed: `layers/orchestration/filter/db/seed.sql`
   ```sql
   INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
   VALUES ('stage.resource.verb', 'STAGE', 'n8n-webhook-id', false, true, 'Description');
   ```
4. **Add tool definition** in `layers/cognitive/src/tools/definitions.ts`
5. **Test filter directly:**
   ```bash
   curl -X POST http://localhost:3000/filter/execute \
     -H "Content-Type: application/json" \
     -d '{"action_id": "stage.resource.verb", "stage": "STAGE", "session_id": "test-001", "payload": {}}'
   ```
6. **Test end-to-end** via cognitive layer
### Adding a New Journey Stage
1. Add stage to `JourneyStage` type in `layers/orchestration/filter/src/shared/types.ts`
2. Add seed rows to `layers/orchestration/filter/db/seed.sql`
3. Build n8n workflows for that stage
4. Add tool definitions in cognitive layer
### Adding a Dashboard Page
1. Create page at `layers/dashboard/src/app/(dashboard)/your-page/page.tsx`
2. Create API proxy route if needed: `layers/dashboard/src/app/api/your-api/route.ts`
3. Use existing TenacitOS components from `layers/dashboard/src/components/TenacitOS/`
4. Follow existing auth pattern (cookie-based, mc_auth)
### Database Migrations
- Migration files: `layers/orchestration/filter/db/migrations/NNN_description.sql`
- Cognitive layer migrations: `layers/cognitive/db/migrations/NNN_description.sql`
- Always add migration, never modify existing ones
- Update seed.sql for new filter_action entries
## Key Implementation Details
### Filter Service Flow (`POST /filter/execute`)
1. Validate required fields (action_id, stage, session_id, payload)
2. Check allowlist via `lookupAction()` — reject if not found, stage mismatch, or disabled
3. HITL gate — return 202 `pending_hitl` if `requires_hitl` is true
4. Dispatch to n8n via `dispatchToN8n()` — return 200 `executed`
5. Catch errors — return 502 `error` with `WORKFLOW_UNREACHABLE`
6. Every outcome written to immutable audit log
### Rejection Codes
- `ACTION_NOT_IN_ALLOWLIST` — action_id not found
- `STAGE_MISMATCH` — action stage doesn't match request stage
- `ACTION_DISABLED` — action exists but enabled=false
- `HITL_REJECTED` — human rejected the action
- `WORKFLOW_UNREACHABLE` — n8n dispatch failed
### Environment Variables
| Variable | Service | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | orchestration | Postgres password |
| `POSTGRES_DB` | orchestration | Database name (default: exnoria) |
| `N8N_ENCRYPTION_KEY` | orchestration | n8n encryption key (generate once, never rotate) |
| `ANTHROPIC_API_KEY` | cognitive | LLM API key |
| `FILTER_PORT` | orchestration | Filter port (default: 3000) |
| `N8N_BASE_URL` | orchestration | Internal URL for n8n webhooks |
| `DASHBOARD_PORT` | dashboard | Dashboard port (default: 4000) |
| `TELEGRAM_BOT_TOKEN` | cognitive | Telegram bot token |
| `TELEGRAM_OPERATOR_CHAT_ID` | cognitive | Operator chat for HITL notifications |
### Running the Stack
```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, ANTHROPIC_API_KEY, N8N_ENCRYPTION_KEY
docker compose up -d
```
Services:
- n8n: http://localhost:5678
- Filter: http://localhost:3000/health
- Dashboard: http://localhost:4000
## Design Principles
- **Separation of decision and execution** — cognitive decides, orchestration executes
- **Security by architecture** — agent is not trusted, filter enforces permissions
- **Observable and auditable** — every signal, decision, and action is recorded
- **Modular and replaceable** — cognitive core is swappable, LLM provider changeable
- **Domain language over technical language** — use signals, plans, actions, stages
- **Explainability over magic** — trace every output back to its cause
## Full Roadmap
### Phase 1 — Hardening (now)
**Goal:** Close technical debt before any client touches the system
| Track | Item | Description |
|---|---|---|
| A1 | Export working workflows | Version-control W1/W2/W3 in source control |
| B1 | HITL queue implementation | Approval flow, dashboard integration |
| C1 | Allowlist manager UI | Enable/disable actions from dashboard |
### Phase 2 — Journey Expansion
**Goal:** SUP and RET workflows — where the money is (support escalation, churn prevention)
| Track | Item | Description |
|---|---|---|
| A2 | SUP + RET workflows | Ticket escalation, churn winback |
| B2 | Expand agent toolset | SUP + RET tools, stage-aware routing |
| C2 | Journey health map | CX health per stage, visual overview |
### Phase 3 — Intelligence Deepening
**Goal:** Complete remaining journey stages + domain knowledge grounding
| Track | Item | Description |
|---|---|---|
| A3 | ONB + PRD workflows | Onboarding drop-off, product friction |
| B3 | MCP context grounding | NotebookLM, domain knowledge base |
| C3 | Memory browser | Contact history, semantic search UI |
### Phase 4 — Multi-Operator
**Goal:** Role-based access + multi-agent coordination for client handoff
| Track | Item | Description |
|---|---|---|
| A4 | COM + EXP workflows | Engagement, upsell, expansion |
| B4 | Multi-agent coordination | Specialist agents per stage |
| C4 | Role-based access | Operator roles, client views |
### Phase 5 — Portability + Productization
**Goal:** Commercial distribution — one-command deploy, client isolation
| Item | Description |
|---|---|
| Instance templating | One-command deploy, env templates, client isolation |
| Multi-env deployment guides | VPS, edge device, local dev runbooks |
### Key Dependencies
- **A2 unlocks B2** — agent can only call tools that have filter entries + n8n workflows
- **B3 (MCP)** unlocks deeper agent reasoning via domain knowledge grounding
- **C1 (allowlist UI)** unblocks client handoff
- **Phase 4 requires Phase 3 complete**
- **A1 must ship before B2** — execution layer must exist before toolset expansion
### Dependency Chain
Phase 1 (A1, B1, C1)
  └── Phase 2 (A2 → B2, C2)
        └── Phase 3 (A3, B3, C3)
              └── Phase 4 (A4, B4, C4)
                    └── Phase 5 (Instance templating, Deployment guides)
