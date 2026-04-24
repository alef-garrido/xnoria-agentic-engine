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
## Layer-Specific AGENTS.md Files
Each layer has its own AGENTS.md with detailed implementation guidance. Reference these when working on layer-specific tasks:
- **Cognitive Layer:** [layers/cognitive/AGENTS.md](layers/cognitive/AGENTS.md) — Agentic core, LLM reasoning, tool definitions
- **Filter Service:** [layers/orchestration/filter/AGENTS.md](layers/orchestration/filter/AGENTS.md) — Allowlist, audit, n8n dispatch
- **Dashboard:** [layers/dashboard/AGENTS.md](layers/dashboard/AGENTS.md) — Next.js UI, HITL interface, reporting

## Directory Structure
```
xnoria-agentic-engine/
├── layers/
│   ├── cognitive/                    # Agentic core
│   │   ├── AGENTS.md                 # Layer-specific guidance
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
│   │       ├── AGENTS.md             # Layer-specific guidance
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
│       ├── AGENTS.md                 # Layer-specific guidance
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
## Current Scope (Phase 3 Complete)

Phase 3 delivers:
- ✅ All 8 journey stages with n8n workflows
- ✅ Engram persistent memory via MCP stdio transport
- ✅ Token optimization (~3.5k tokens vs 15k+)
- ✅ Stage-aware tool filtering (8 tools instead of 19+)
- ✅ Memory persistence across container restarts

Eight journey stages with registered actions:
| Action ID | Stage | Description |
|---|---|---|
| `acq.lead.engage` | ACQ | Send immediate WhatsApp acknowledgment to inbound lead |
| `acq.lead.nurture` | ACQ | AI nurture conversation for out-of-hours contacts |
| `acq.contact.outreach` | ACQ | Cold outreach via WhatsApp + email, sync to HubSpot |
| `sal.sequence.enroll` | SAL | Enroll contact in sales sequence |
| `sal.contact.prioritize` | SAL | Flag contact for immediate SDR follow-up |
| `sal.contact.message` | SAL | Send pre-composed WhatsApp message to contact |
| `onb.document.request` | ONB | Initiate document collection request |
| `onb.document.validate` | ONB | Validate submitted document, update CRM |
| `onb.contact.nudge` | ONB | Send re-engagement nudge to stalled onboarding contact |
| `onb.contact.assist` | ONB | Offer white-glove CSM assist to blocked onboarding contact (HITL) |
| `onb.ticket.escalate` | ONB | Escalate technical onboarding blocker to support queue |
| `sup.ticket.escalate` | SUP | Escalate ticket to senior support |
| `sup.contact.notify` | SUP | Send resolution update to contact (HITL) |
| `com.content.publish` | COM | Publish scheduled content to social media |
| `prd.friction.flag` | PRD | Send adoption nudge to low-engagement contact (supersedes placeholder) |
| `prd.adoption.nudge` | PRD | Send feature education message to workaround-using contact (supersedes placeholder) |
| `prd.feedback.log` | PRD | Log enriched feature request to HubSpot product pipeline |
| `ret.contact.winback` | RET | Enroll contact in winback sequence (HITL) |
| `ret.account.flag` | RET | Flag account for CSM review |
| `acq.contact.upsert` | ACQ | Create or update contact in HubSpot CRM, returns `contact_id` for chaining (migration 013) |

Placeholder actions (disabled):
| Action ID | Stage | Description |
|---|---|---|
| `exp.account.flag` | EXP | Placeholder: Flag expansion-ready account |
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
- **Post-MVP actions go in numbered migrations** — `seed.sql` is for MVP bootstrap only. Never add new actions to seed.sql.
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
### Sequential Tool Execution (ReAct)

The AcqSal specialist supports sequential filter dispatches for chained operations
(e.g. upsert contact → prioritize contact). Constraints:
- **Max 3 filter dispatches per session** (`MAX_FILTER_DISPATCHES = 3`) — separate from the loop iteration cap (`MAX_LOOP_ITERATIONS = 5`). Context retrieval does not count toward this limit.
- **Parallel tool calls rejected** — if the LLM attempts context + action in the same batch, the batch is rejected and the loop halts.
- **Each dispatch result is injected back as a `tool` role message** for the next LLM turn, enabling chaining.
- **n8n workflows in sequential chains MUST use `Respond to Webhook: Return JSON`** with the fields needed by the next tool call.
  - Example: `acq.contact.upsert` must return `{ "contact_id": "..." }` so `sal.contact.prioritize` can use the real HubSpot ID.
- **Verification test for chained actions:** inject a Telegram message with email + name but no existing contact ID, confirm logs show two sequential dispatches with `dispatch 1/3` and `dispatch 2/3`, and confirm the second payload carries the `contact_id` returned by the first.
### Environment Variables
| Variable | Service | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | orchestration | Postgres password |
| `POSTGRES_DB` | orchestration | Database name (default: exnoria) |
| `N8N_ENCRYPTION_KEY` | orchestration | n8n encryption key (generate once, never rotate) |
| `LLM_API_KEY` | cognitive | LLM API key |
| `FILTER_PORT` | orchestration | Filter port (default: 3000) |
| `N8N_BASE_URL` | orchestration | Internal URL for n8n webhooks |
| `DASHBOARD_PORT` | dashboard | Dashboard port (default: 4000) |
| `TELEGRAM_BOT_TOKEN` | cognitive | Telegram bot token |
| `TELEGRAM_OPERATOR_CHAT_ID` | cognitive | Operator chat for HITL notifications |
| `COM_CONTENT_SHEET_ID` | orchestration | Google Sheets ID for content calendar (COM workflow) |
### Running the Stack
```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, LLM_API_KEY, N8N_ENCRYPTION_KEY
make up
```

Services:
- n8n: http://localhost:5678
- Filter: http://localhost:3000/health
- Dashboard: http://localhost:4000

**Important:** Use `make` targets only — never run `docker compose down -v` directly. See "Critical Docker Safety Procedures" section below.
## Design Principles
- **Separation of decision and execution** — cognitive decides, orchestration executes
- **Security by architecture** — agent is not trusted, filter enforces permissions
- **Observable and auditable** — every signal, decision, and action is recorded
- **Modular and replaceable** — cognitive core is swappable, LLM provider changeable
- **Domain language over technical language** — use signals, plans, actions, stages
- **Explainability over magic** — trace every output back to its cause

## Critical Docker Safety Procedures
**🚨 NEVER use `docker compose down -v` directly — DATA LOSS IS PERMANENT**

After incident 2026-04-10 where `docker compose down -v` destroyed all volumes including:
- All filter_log audit history
- All n8n workflows built in UI but not exported
- All Engram contact memory and session history

### Mandatory Command Wrapper
Use `Makefile` targets ONLY — never raw `docker compose` commands:

```bash
# Safe operations (preserve data)
make up        # Start services
make down      # Stop services (SAFE — preserves volumes)
make restart   # Restart services
make rebuild   # Rebuild and restart

# Data protection
make export-all      # Backup filter_log and critical data
make verify-workflows # Check all enabled workflows are exported

# ⚠️  DESTRUCTIVE operations (LAST RESORT ONLY)
make down-hard # ⚠️  NUCLEAR OPTION — completely wipes system
```

### Before Any Shutdown (Mandatory Checklist)
1. **Export all n8n workflows:** Open n8n at `localhost:5678` → Settings → Export All Workflows → JSON → Save each to `workflows/n8n/{action_id}.json`
2. **Verify exports:** Run `make verify-workflows` — must return all green
3. **Backup audit log:** Run `make export-all` to backup filter_log
4. **Only then:** Use `make down` (safe) or `make down-hard` (destructive — requires DESTROY confirmation)

### The Rule: If It's Not In Source Control, It Doesn't Exist
- Workflows built in n8n UI but never exported = LOST FOREVER on `docker compose down -v`
- Audit log entries in filter_log = LOST FOREVER unless backed up
- Engram contact memory = LOST FOREVER (recoverable context from filter_log but loses session state)

### Volume Classification
| Volume | Criticality | Content | Recovery |
|---|---|---|---|
| `postgres_data` | 🔴 CRITICAL | filter_log, CRM data | Manual backup only |
| `n8n_data` | 🟡 MANAGED | Workflow configs | Must be exported to source control |
| `engram_data` | 🟠 EPHEMERAL | Contact memory | Regeneratable but loses context |
## Full Roadmap
### Phase 1 — Hardening ✅ COMPLETE
**Goal:** Close technical debt before any client touches the system
| Track | Item | Description | Status |
|---|---|---|---|
| A1 | Export working workflows | Version-control W1/W2/W3 in source control | ✅ Done |
| B1 | HITL queue implementation | Approval flow, dashboard integration | ✅ Done |
| C1 | Allowlist manager UI | Enable/disable actions from dashboard | ✅ Done |
### Phase 2 — Journey Expansion ✅ COMPLETE
**Goal:** SUP and RET workflows — where the money is (support escalation, churn prevention)
| Track | Item | Description | Status |
|---|---|---|---|
| A2 | SUP + RET workflows | Ticket escalation, churn winback | ✅ Done |
| B2 | Expand agent toolset | SUP + RET tools, stage-aware routing | ✅ Done |
| C2 | Journey health map | CX health per stage, visual overview | ✅ Done |
### Phase 2.5 — Workflow Integration ✅ COMPLETE
**Goal:** Integrate existing CX Engine workflows into filter architecture, full stage coverage
| Track | Item | Description | Status |
|---|---|---|---|
| A2.5 | ACQ workflows | engage, nurture, outreach | ✅ Done |
| B2.5 | SAL + ONB + COM | Additional stage coverage | ✅ Done |
| C2.5 | PRD + EXP placeholders | Placeholder stubs for future phases | ✅ Done |
### Phase 3 — Intelligence Deepening
**Goal:** Complete remaining journey stages + domain knowledge grounding
| Track | Item | Description | Status |
|---|---|---|---|
| A3 | ONB + PRD workflows | Onboarding drop-off, product friction | ✅ Done |
| B3 | MCP context grounding | PostHog, domain knowledge integration | ✅ Done |
| C3 | Engram memory | Contact history, semantic search, cooldown logic | ✅ Done |

**Phase 3 Summary:**
- ✅ Full Stage Coverage: All 8 journey stages with n8n workflows
- ✅ Engram Memory: Persistent contact memory via MCP stdio transport
- ✅ Token Optimization: Reasoning reduced from ~15k to ~3.5k tokens
- ✅ Stage-Aware Tool Filtering: Only 8 tools shown instead of 19+
- ✅ Memory Persistence: Engram survives container restarts
- ✅ Cooldown Logic: Avoids retrying same action within 48 hours

#### B3 Tool Recommendations (for evaluation before scoping B3)

The following tools are recommended for evaluation before PRD and ONB signal detection becomes more sophisticated. These are not required for A3 — HubSpot is sufficient. They are candidates for B3 (MCP context grounding) and the signal monitoring infrastructure.

**Onboarding platforms:**
- **Appcues** — in-app onboarding flows, step completion tracking, maps directly to `ONB_FRC` and `ONB_CLR` indicators (`time_to_first_value`, `drop_off_rate`, `help_article_views_in_onboarding`). Native HubSpot integration.
- **Userflow** — lighter alternative to Appcues, better suited for smaller teams; webhooks on step abandonment map cleanly to `ONB_FRC_01` trigger conditions.

**Product analytics:**
- **PostHog** — open-source, self-hostable, tracks `feature_adoption_rate` and task completion directly. Maps to `PRD_FRC_01`, `PRD_FRC_02`, `PRD_CAP_01` indicators. Self-hosted option fits the architecture's control philosophy.
- **Mixpanel** — stronger for `feature_request_volume` and funnel analysis (`PRD_CAP_02`). Better reporting than PostHog but hosted-only.

**Why these matter for B3:** When MCP context grounding is scoped, these tools are the natural signal sources that would feed structured `CXEvent` payloads into the cognitive layer — replacing the current pattern where signals must be manually constructed or inferred from CRM tags alone. Choosing a tool before B3 is scoped will determine the shape of the MCP integration.

#### PostHog Signal Data Prerequisites (Product-Side Work)

**This is a product engineering task — not an Xnoria engine task.** Until these are instrumented in the product, `posthog_get_contact_events` returns empty results for all contacts.

The PostHog MCP integration is operational in the cognitive layer, but it can only return data for contacts if the product instruments PostHog tracking. Until then, the lifecycle specialist falls back to Engram memory + Compass context.

| Prerequisite | Description | Product Team Must Implement |
|---|---|---|
| `posthog.identify(hubspot_contact_id)` | Maps HubSpot contact to PostHog `distinct_id` at user login | ✅ **Required** — without this, queries return empty/nonexistent data |
| `posthog.capture('feature_used', { feature_name, contact_id })` | Tracks core feature interactions | For PRD_FRC_01/02 (feature adoption failure signals) |
| `posthog.capture('onboarding_step_completed', { step, contact_id })` | Tracks each ONB step completion | For ONB_FRC_01/02 (onboarding drop-off signals) |
| `posthog.capture('task_abandoned', { task, contact_id })` | Tracks session exit without completion | For PRD_FRC_01 (adoption regression) |

##### Dependency Chain for PostHog to Be Useful
```
1. ✅ PostHog instance running (cloud instance configured)
2. ❌ Product instrumented with tracking calls (feature_updated, onboarding_step, task_abandoned)
3. ❌ Identity resolved: posthog.identify(contact_id) called at login
4. ✅ PostHog MCP server added to cognitive MCP client (completed)
5. ✅ POSTHOG_* environment variables set (completed)
6. ⏳ Cognitive layer pre-processing calls posthog_get_contact_events (ready, waiting for data)
```

##### What Happens If Instrumentation Is Missing?
- `posthog_get_contact_events(contact_id)` returns empty array
- Cognitive layer gracefully degrades to Engram memory + Compass context
- Lifecycle specialist continues working with reduced context (still functional)
- No errors, no fallback failures — just less rich signal data

##### How to Verify PostHog Is Working (After Instrumentation)
```bash
# 1. Check PostHog API access
curl -s "https://app.posthog.com/api/projects/375314" \
  -H "Authorization: Bearer phx_..." | jq '.name'

# 2. Verify PostHog MCP connection in cognitive logs
docker logs exnoria_cognitive | grep "PostHog MCP"
# Should show: [mcp-client] PostHog MCP connected (stdio)

# 3. After product instrumentation, test with a real contact
# The contact must have been logged in with posthog.identify(contact_id)
# and have events tracked (posthog.capture(...))
```

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

### Architecture Guardrails — Safety by Design

The following measures are in place to prevent catastrophic data loss like 2026-04-10:

| Layer | Measure | Purpose |
|---|---|---|
| **Layer 1** | Makefile wrapper | Prevents bare `docker compose down -v` usage, forces safe commands |
| **Layer 2** | Volume classification | CRITICAL vs RECOVERABLE labels in docker-compose.yml |
| **Layer 3** | Pre-flight checks | `make verify-workflows` ensures all workflows exported before shutdown |
| **Layer 4** | Nightly backups | n8n scheduled workflow backs up filter_log to bind-mounted `./backups/` |
| **Layer 5** | Source control rule | "If it's not in source control, it doesn't exist" enforced by process |

See "Critical Docker Safety Procedures" section for detailed usage instructions.

### Dependency Chain
Phase 1 (A1, B1, C1) ✅
  └── Phase 2 (A2 → B2, C2) ✅
        └── Phase 2.5 (A2.5 → B2.5, C2.5) ✅
              └── Phase 3 (A3, B3, C3) ✅
                    └── Phase 4 (A4, B4, C4)
                          └── Phase 5 (Instance templating, Deployment guides)
