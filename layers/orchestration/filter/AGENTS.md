# AGENTS.md — Filter Service

**Location:** `layers/orchestration/filter/`
**Role:** Security boundary — allowlist enforcement, audit logging, n8n dispatch

## Tech Stack

- **Runtime:** Node.js + TypeScript (ES2020, CommonJS)
- **Framework:** Express
- **Database:** Postgres
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
├── index.ts              # Express: POST /filter/execute, GET /health, CRUD endpoints
├── allowlist/
│   └── allowlist.ts      # DB allowlist lookup + CRUD operations
├── audit/
│   └── log.ts            # Immutable audit log writer
├── execution/
│   └── dispatch.ts       # n8n webhook dispatcher
├── hitl/
│   ├── hitl.ts           # HITL queue management (approve/reject)
│   └── telegram.ts       # Operator notifications
├── shared/
│   └── types.ts          # JourneyStage, FilterStatus, FilterAction, FilterRequest, FilterResponse
db/
└── migrations/
    ├── 001_create_filter_tables.sql  # Canonical schema (squash of 001–025)
    ├── 002_squash_marker.sql         # No-op marker (squash date: 2026-07-30)
    └── init.sh                       # Docker entrypoint runner
```

## API Endpoints

### Core

| Method | Path              | Description                            |
| ------ | ----------------- | -------------------------------------- |
| `GET`  | `/health`         | Health check                           |
| `GET`  | `/filter/health`  | Aggregated per-stage metrics (Phase 2) |
| `POST` | `/filter/execute` | Execute an action (main entry point)   |

### Allowlist CRUD

| Method   | Path                    | Description      |
| -------- | ----------------------- | ---------------- |
| `GET`    | `/filter/allowlist`     | List all actions |
| `POST`   | `/filter/allowlist`     | Add new action   |
| `PATCH`  | `/filter/allowlist/:id` | Update action    |
| `DELETE` | `/filter/allowlist/:id` | Delete action    |

### HITL

| Method | Path                       | Description            |
| ------ | -------------------------- | ---------------------- |
| `POST` | `/filter/hitl/:id/approve` | Approve pending action |
| `POST` | `/filter/hitl/:id/reject`  | Reject pending action  |
| `GET`  | `/filter/hitl/pending`     | List pending approvals |

## POST /filter/execute Flow

1. **Validate** required fields: `action_id`, `stage`, `session_id`, `payload`
2. **Allowlist check** via `lookupAction()`:
   - Query `filter_action` table by `action_id`
   - Reject if not found → `ACTION_NOT_IN_ALLOWLIST`
   - Reject if stage mismatch → `STAGE_MISMATCH`
   - Reject if disabled → `ACTION_DISABLED`
3. **HITL gate** — if `requires_hitl = true`:
   - Write `pending_hitl` log
   - Notify operator via Telegram
   - Return `202 Accepted` with status `pending_hitl`
4. **Dispatch** to n8n via `dispatchToN8n()`:
   - POST to `http://n8n:5678/webhook/{n8n_workflow_id}`
   - Return `200 OK` with status `executed`
5. **Error handling** — if n8n unreachable:
   - Return `502` with status `error`, code `WORKFLOW_UNREACHABLE`
6. **Every outcome** written to immutable `filter_log`

## Rejection Codes

| Code                      | Meaning                                    |
| ------------------------- | ------------------------------------------ |
| `ACTION_NOT_IN_ALLOWLIST` | action_id not found in filter_action table |
| `STAGE_MISMATCH`          | action stage doesn't match request stage   |
| `ACTION_DISABLED`         | action exists but enabled=false            |
| `HITL_REJECTED`           | human rejected the action                  |
| `WORKFLOW_UNREACHABLE`    | n8n dispatch failed                        |

## Database Schema

Canonical schema defined in `db/migrations/001_create_filter_tables.sql` (squashed 2026-07-30).
New migrations should be numbered `003_*` onwards (002 is the squash marker).

### filter_action

| Column            | Type        | Description                                   |
| ----------------- | ----------- | --------------------------------------------- |
| `id`              | UUID        | Primary key                                   |
| `action_id`       | TEXT UNIQUE | e.g. `acq.lead.score`                         |
| `stage`           | TEXT        | Journey stage (ACQ, SAL, etc.)                |
| `n8n_workflow_id` | TEXT        | Webhook path suffix                           |
| `requires_hitl`   | BOOLEAN     | Whether human approval is needed              |
| `manual_action`   | BOOLEAN     | Operator completes manually — no n8n dispatch |
| `enabled`         | BOOLEAN     | Whether action is live                        |
| `description`     | TEXT        | Human-readable description                    |

### filter_log

Immutable audit log — every action attempt is recorded with status, rejection code, and timestamp.

| Column                    | Type        | Description                                       |
| ------------------------- | ----------- | ------------------------------------------------- |
| `id`                      | UUID        | Primary key                                       |
| `action_id`               | TEXT        | Action that was attempted                         |
| `status`                  | TEXT        | executed, pending_hitl, rejected, error           |
| `rejection_code`          | TEXT        | Null unless rejected/errored                      |
| `payload_in`              | JSONB       | What the agent sent                               |
| `payload_out`             | JSONB       | What n8n returned (if executed)                   |
| `payload_reviewed`        | JSONB       | Operator-edited payload (HITL override, nullable) |
| `reviewed_at`             | TIMESTAMPTZ | When HITL action was reviewed (nullable)          |
| `reviewed_by`             | TEXT        | Operator handle who reviewed (nullable)           |
| `reviewed_by_operator_id` | UUID        | FK → operators(id) (nullable)                     |
| `created_at`              | TIMESTAMPTZ | When action was logged                            |

Partial index on `status = 'pending_hitl'` for fast queue queries.

### operators

Dashboard operator identities and RBAC.

| Column            | Type        | Description                                   |
| ----------------- | ----------- | --------------------------------------------- |
| `id`              | UUID        | Primary key                                   |
| `handle`          | TEXT UNIQUE | Login username                                |
| `role`            | TEXT        | admin \| operator \| viewer                   |
| `password_hash`   | TEXT        | bcrypt(12) — set via init.sh or bootstrap API |
| `failed_attempts` | INTEGER     | Lockout counter                               |
| `locked_until`    | TIMESTAMPTZ | Lockout expiry (nullable)                     |

### operator_sessions

Active sessions with token hash. TTL: 8-hour sliding window.

| Column         | Type        | Description                                    |
| -------------- | ----------- | ---------------------------------------------- |
| `id`           | UUID        | Primary key                                    |
| `operator_id`  | UUID        | FK → operators(id) CASCADE DELETE              |
| `token_hash`   | TEXT UNIQUE | bcrypt(session_token) — raw token never stored |
| `expires_at`   | TIMESTAMPTZ | Session expiry (8h from creation)              |
| `last_seen_at` | TIMESTAMPTZ | Updated on each authenticated request          |

## Domain Language

| Term          | Meaning                                                           |
| ------------- | ----------------------------------------------------------------- |
| **Action**    | A single permitted operation, identified as `stage.resource.verb` |
| **Stage**     | Customer journey phase: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP    |
| **Session**   | One reasoning cycle from the cognitive layer                      |
| **Allowlist** | Actions currently permitted to execute (filter_action table)      |
| **HITL**      | Human-in-the-loop — action requiring human approval               |

## Critical Rules

1. **The filter is the security boundary** — the cognitive layer is not trusted.
2. **Every action is logged** — whether executed, rejected, or pending.
3. **The allowlist is managed at runtime** via the database, not by redeploying code.
4. **The canonical schema is `001_create_filter_tables.sql`** — do NOT alter it. Add new migrations as `003_*`, `004_*`, etc.
5. **Action seed data lives in `config/seeds/*.sql`** — never in migration files. The migration/seed split is intentional.
6. **`manual_action = true` actions** reuse HITL infrastructure but skip n8n dispatch — operator completes the action manually in HubSpot.

## Adding a New Action

1. Build n8n workflow, export JSON to `workflows/n8n/`
2. Add seed row to the appropriate `config/seeds/*.sql` file:
   ```sql
   INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
   VALUES ('stage.resource.verb', 'STAGE', 'n8n-webhook-id', false, true, 'Description');
   ```
3. Or use runtime CRUD: `POST /filter/allowlist`
4. Test:
   ```bash
   curl -X POST http://localhost:3000/filter/execute \
     -H "Content-Type: application/json" \
     -d '{"action_id": "stage.resource.verb", "stage": "STAGE", "session_id": "test-001", "payload": {}}'
   ```

## Adding a New Journey Stage

1. Add stage to `JourneyStage` type in `src/shared/types.ts`
2. Add seed rows to the appropriate `config/seeds/*.sql` file
3. Build n8n workflows for that stage

## Environment Variables

| Variable                    | Description                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `POSTGRES_PASSWORD`         | Postgres password                                                                    |
| `POSTGRES_DB`               | Database name (default: exnoria)                                                     |
| `FILTER_PORT`               | Filter port (default: 3000)                                                          |
| `N8N_BASE_URL`              | Internal URL for n8n webhooks                                                        |
| `TELEGRAM_BOT_TOKEN`        | Telegram bot token (for HITL notifications)                                          |
| `TELEGRAM_OPERATOR_CHAT_ID` | Operator chat ID for HITL notifications                                              |
| `DASHBOARD_URL`             | Dashboard URL for HITL deep links (default: `http://localhost:4000`)                 |
| `COM_CONTENT_SHEET_ID`      | Google Sheets ID for content calendar (COM workflow)                                 |
| `PROJECT_ID`                | Project namespace for service identity strings and Docker networks (default: xnoria) |

## Current Action Coverage (Phase 3 Complete)

All 8 journey stages have at least one active action:

| Stage | Active Actions                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| ACQ   | `acq.lead.engage`, `acq.lead.nurture`, `acq.contact.outreach`, `acq.contact.upsert`, `acq.contact.get`               |
| SAL   | `sal.sequence.enroll` ⚙️, `sal.contact.prioritize`, `sal.contact.message`                                            |
| ONB   | `onb.document.request` ⚙️, `onb.document.validate`, `onb.contact.nudge`, `onb.contact.assist`, `onb.ticket.escalate` |
| PRD   | `prd.friction.flag`, `prd.adoption.nudge`, `prd.feedback.log`                                                        |
| SUP   | `sup.ticket.escalate`, `sup.contact.notify`                                                                          |
| COM   | `com.content.publish`, `com.contact.reengage`, `com.feedback.request` ⚙️                                             |
| RET   | `ret.contact.winback`, `ret.account.flag`                                                                            |
| EXP   | (placeholder, disabled)                                                                                              |

⚙️ = `manual_action = true` (HITL flow, no n8n dispatch — operator completes manually in HubSpot)

## HITL Implementation Details

### Flow

1. Action with `requires_hitl = true` hits the filter
2. `pending_hitl` status written to `filter_log`
3. `notifyOperator()` sends formatted Markdown to Telegram (fire-and-forget, silently skipped if `TELEGRAM_OPERATOR_CHAT_ID` not set)
4. Dashboard `/hitl` page polls `GET /filter/hitl/pending` every 10s
5. Operator approves/rejects via dashboard or Telegram
6. `approveAction()` is idempotent — dispatches to n8n on approval
7. `rejectAction()` writes `HITL_REJECTED` to `filter_log`

### Key Functions

- `getPendingActions()` — returns all `pending_hitl` rows
- `approveAction(log_id)` — updates status, dispatches to n8n, writes audit log
- `rejectAction(log_id, reviewed_by)` — writes `HITL_REJECTED` status
- `notifyOperator(action)` — sends Telegram notification with approve/reject deep links
