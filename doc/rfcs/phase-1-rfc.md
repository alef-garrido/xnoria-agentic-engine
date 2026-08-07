# RFC: Phase 1 — Xnoria Safety & Foundation Hardening

**Status:** In Planning  
**Date:** April 2026  
**Scope:** Three foundational items that must ship before any client touches the system

---

## Executive Summary

Phase 1 closes technical debt and establishes safety properties before expanding workflow coverage. The three items are:

1. **Export working workflows to source control** — Make agent reasoning and tool definitions version-controllable
2. **Implement HITL (Human-in-the-Loop) properly** — Complete the approval surface for high-risk actions
3. **Add allowlist manager to dashboard** — Give operators real-time control over action eligibility

All three are prerequisites for production readiness. HITL in particular is a safety property, not a feature.

---

## Item 1: Export Working Workflows to Source Control

### Objective

Version-control all configured workflows, tool definitions, and agent reasoning rules so that:

- Configuration changes are auditable (git history)
- Deployments are deterministic (config from git, not runtime state)
- Rollback is simple (git revert → redeploy)

### Current State

- Workflows exist in the cognitive layer (`src/agent/reason.ts`, `src/tools/definitions.ts`)
- Filter configuration exists in the database (`filter_action` schema)
- n8n workflows are stored in n8n's database, not in source control

### Requirements

- Cognitive layer tool definitions must be git-tracked (likely already true)
- Filter action definitions must be exported to `.sql` and checked into `layers/orchestration/filter/db/migrations/`
- n8n workflows must be exported and tracked (e.g., as JSON in a `/workflows` directory)
- Deployment process must apply migrations and sync configurations deterministically

### Deliverables

- [ ] Audit current tool definitions in cognitive layer — confirm they're in source control
- [ ] Export filter actions from database to SQL migration file
- [ ] Export n8n workflows to JSON and add to source control
- [ ] Document synchronization procedure for future deployments

### Success Criteria

- All workflows and configurations can be recovered from git
- No manual intervention required during deployment to set up tools and actions
- Configuration changes produce git diff records

---

## Item 2: Implement HITL (Human-in-the-Loop) Approval Surface

### Objective

Complete the end-to-end HITL flow so that when an action is flagged `requires_hitl = true`, a human can review the pending action, approve or reject it, and the system continues accordingly.

### Current State

**What exists:**

- Filter service writes `pending_hitl` status to `filter_log` and returns `queue_id`
- `filter_action` table has `requires_hitl` boolean per action
- Database schema is designed for queuing

**What's missing:**

- API endpoints to query pending HITL actions
- Dashboard UI to display pending actions and accept approval/rejection decisions
- Telegram notification to alert operator immediately

### Three Missing Pieces

#### 2.1 Queue API in Filter Service

Add three endpoints to the filter service:

```
GET  /filter/hitl/pending
  → List all pending_hitl actions awaiting approval
  → Response: Array of {log_id, action_id, stage, contact_id, payload_in, meta, created_at}

POST /filter/hitl/:log_id/approve
  → Human approves the action
  → Filter re-reads payload_in from filter_log, dispatches to n8n as if execute path ran
  → Updates filter_log.status from 'pending_hitl' to 'executed'
  → Response: {log_id, status, dispatched_at}

POST /filter/hitl/:log_id/reject
  → Human rejects the action
  → Updates filter_log.status from 'pending_hitl' to 'rejected'
  → Sets rejected_at timestamp and rejection_code: 'HITL_REJECTED'
  → Response: {log_id, status, rejected_at}
```

**Implementation notes:**

- Endpoints should authenticate with the same credentials used for the filter's execute endpoint
- Approve must be idempotent (calling twice with same log_id should not dispatch twice)
- Both endpoints should update `filter_log.reviewed_at` and `filter_log.reviewed_by` (operator identifier)

**Files to modify:**

- `layers/orchestration/filter/src/index.ts` — add route handlers
- `layers/orchestration/filter/db/migrations/002_*.sql` — ensure `filter_log` schema has `reviewed_at`, `reviewed_by`, `rejection_code` columns

#### 2.2 HITL Queue Page in Dashboard

New page at `/dashboard/hitl` (or `/(dashboard)/hitl/page.tsx`):

**Features:**

- Polls `GET /filter/hitl/pending` every 10 seconds
- Displays each pending action as a card showing:
  - Action ID and stage (e.g., `sal.contact.prioritize`)
  - Contact/entity being acted upon (e.g., contact name, account name)
  - Full payload that the agent sent
  - Agent's reasoning (from `meta.triggered_by` if available)
  - Timestamp of when action was flagged
- Two buttons per card: **Approve** and **Reject**
- On Approve/Reject, calls corresponding endpoint and removes card from list
- Shows toast notification confirming action was approved/rejected
- If queue is empty, shows "No pending actions" message with refresh button

**Styling:**

- Use existing dashboard design system (TenacitOS components)
- Treat as high-priority: cards should be visually distinct (consider warning/caution color)
- Include filter or sort options (by stage, by recency)

**Files to create/modify:**

- `layers/dashboard/src/app/(dashboard)/hitl/page.tsx` — main page component
- `layers/dashboard/src/app/api/filter/pending/route.ts` — proxy endpoint to filter service (if dashboard can't call filter directly)
- `layers/dashboard/src/components/HITLQueue.tsx` — component for the approval list

#### 2.3 Telegram Notification to Operator

When filter service detects `requires_hitl = true` and queues an action, send immediate Telegram notification:

**Trigger:**

- In filter's dispatch logic, when `action.requires_hitl === true` and status is set to `pending_hitl`

**Notification content:**

```
⚠️ HITL Review Required

Action: sal.contact.prioritize
Contact: John Doe (CID_12345)
Stage: sal
Triggered: Agent reasoning: "High engagement, low engagement score"

👉 [Review & Approve](https://dashboard-url/hitl)
```

**Implementation:**

- Use existing Telegram Bot API pattern from cognitive layer (Telegram token from env var)
- Operator chat ID from environment variable (e.g., `TELEGRAM_OPERATOR_CHAT_ID`)
- Send synchronously but don't block the filter's response to the agent
- Log send success/failure to filter service logs

**Files to modify:**

- `layers/orchestration/filter/src/index.ts` — add Telegram notification call in dispatch/queue logic
- `.env.example` — document new env var `TELEGRAM_OPERATOR_CHAT_ID`

### HITL Configuration: Which Actions Require Approval

Not all actions need human approval. Use the `requires_hitl` flag per-action. Recommended initial configuration for the three MVP workflows:

| Action                   | requires_hitl | Reasoning                                                            |
| ------------------------ | ------------- | -------------------------------------------------------------------- |
| `acq.lead.score`         | false         | Read + tag — low risk, fully reversible                              |
| `sal.sequence.enroll`    | false         | Enrollment is reversible, agent decision quality is measurable       |
| `sal.contact.prioritize` | true          | Sends WhatsApp to external contact — irreversible, warrants approval |

Update these in the filter migrations (`002_create_filter_tables.sql` or a new migration).

### Deliverables

- [ ] Filter API: implement `/filter/hitl/pending`, `/filter/hitl/:log_id/approve`, `/filter/hitl/:log_id/reject`
- [ ] Filter database: add missing columns to `filter_log` where needed
- [ ] Update filter `filter_action` seed with `requires_hitl` flags for MVP actions
- [ ] Dashboard: create `/hitl` page with polling component and approval cards
- [ ] Dashboard: create/update proxy route to filter service if needed
- [ ] Filter: add Telegram notification on HITL queue
- [ ] Environment: document new `TELEGRAM_OPERATOR_CHAT_ID` variable
- [ ] Test: manual approval/rejection flow end-to-end

### Success Criteria

- Operator receives Telegram notification when action requires HITL
- Operator navigates to dashboard `/hitl` and sees pending action card
- Operator clicks Approve → card disappears, action executes in n8n, `filter_log.status` updates to `executed`
- Operator clicks Reject → card disappears, action is not executed, `filter_log.status` updates to `rejected`
- Approve endpoint is idempotent (pressing Approve twice does not execute action twice)

---

## Item 3: Add Allowlist Manager to Dashboard

### Objective

Give operators real-time control over which contacts/accounts are eligible for automated actions. Currently eligibility is hardcoded or manual; it should be dashboard-driven.

### Current State

- Allowlist logic exists in orchestration layer (`layers/orchestration/filter/src/allowlist/allowlist.ts`)
- Database schema exists (`allowlist` and `allowlist_entry` tables)
- No UI to manage the allowlist

### Requirements

#### 3.1 Allowlist API Endpoints in Filter Service

Add endpoints for CRUD operations:

```
GET /filter/allowlist
  → List all allowlist entries
  → Response: Array of {id, entity_id, entity_type, stage, status, created_at, expires_at}

POST /filter/allowlist
  → Create a new allowlist entry
  → Body: {entity_id, entity_type, stage, expires_in_days?}
  → Response: {id, entity_id, status, created_at, expires_at}

DELETE /filter/allowlist/:id
  → Remove an allowlist entry
  → Response: {id, status, deleted_at}

PATCH /filter/allowlist/:id
  → Update allowlist entry (e.g., extend expiration)
  → Body: {expires_at?}
  → Response: {id, expires_at}
```

#### 3.2 Allowlist Manager Page in Dashboard

New page at `/dashboard/allowlist` (or `/(dashboard)/allowlist/page.tsx`):

**Features:**

- Table view of current allowlist entries showing:
  - Entity ID and type (contact, account, etc.)
  - Stage it applies to
  - Status (active, expired, disabled)
  - Created date and expiration date
  - Action column: Edit, Delete, Extend buttons
- Button to add new allowlist entry:
  - Form inputs: Entity ID, Entity Type (dropdown), Stage (dropdown), Expiration (optional)
  - Submit creates entry via API
- Search/filter by entity ID or type
- Show expired entries with visual indicator (strikethrough, gray)
- Bulk operations: delete multiple, extend multiple

**Styling:**

- Use existing dashboard design system
- Include confirmations for destructive actions (delete)

**Files to create/modify:**

- `layers/dashboard/src/app/(dashboard)/allowlist/page.tsx` — main page component
- `layers/dashboard/src/app/api/filter/allowlist/route.ts` — proxy endpoints (if dashboard can't call filter directly)
- `layers/dashboard/src/components/AllowlistManager.tsx` — table and form components

#### 3.3 Filter Service CRUD Implementation

Implement the allowlist endpoints in the filter service with:

- Input validation (entity_id, entity_type, stage are required)
- Expiration date handling (default to 30 days if not specified)
- Logging of all allowlist changes
- Authorization checks (operator role required)

**Files to modify:**

- `layers/orchestration/filter/src/allowlist/allowlist.ts` — add CRUD functions if not present
- `layers/orchestration/filter/src/index.ts` — add route handlers

### Deliverables

- [ ] Filter API: implement `/filter/allowlist` CRUD endpoints
- [ ] Dashboard: create `/allowlist` page with table and add form
- [ ] Dashboard: create/update proxy routes to filter service if needed
- [ ] Database: ensure `allowlist` and `allowlist_entry` schemas have necessary columns
- [ ] Test: manual CRUD operations, expiration behavior, filtering

### Success Criteria

- Operator navigates to `/allowlist` page
- Operator sees current allowlist entries in a table
- Operator adds a new allowlist entry via form → appears in table, filters are applied immediately
- Operator extends expiration → updates in table
- Operator deletes entry → removed from table, filtering respects deletion

---

## Implementation Sequence

**Dependency chain:** Item 1 (source control) is independent. Items 2 and 3 have no hard dependencies on each other, but Item 2 (HITL) is higher priority because it's a safety property.

**Recommended order:**

1. **Item 1** — Export workflows (foundation work, can happen in parallel)
2. **Item 2.1** — Filter API for HITL queue (backend, no UI dependencies)
3. **Item 2.2** — Dashboard HITL page (builds on 2.1)
4. **Item 2.3** — Telegram notifications (polish on 2.1)
5. **Item 3** — Allowlist manager (backend + frontend, can run in parallel with 2.2 and 2.3)

---

## Acceptance Criteria for Phase 1 Completion

- [ ] All Phase 1 code is merged to `main`
- [ ] Workflows and configurations are version-controlled in git
- [ ] HITL approval flow works end-to-end: pending action → Telegram alert → operator approval/rejection → execution or cancellation
- [ ] Allowlist manager allows operators to add/edit/delete entries via dashboard
- [ ] No workflow or configuration requires manual database intervention after deployment
- [ ] All changes are documented in the repo (README updates, deployment guide updates)

---

## Risk & Mitigation

| Risk                                                           | Mitigation                                                                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| HITL queue fills up faster than operator can approve           | Dashboard shows queue depth; Telegram notifications can be batched or rate-limited; consider auto-reject after timeout |
| Operator forgets to approve → actions are delayed indefinitely | Add optional auto-expiration timer (e.g., auto-reject after 4 hours); log pending actions for review                   |
| Telegram notification is sent but operator never sees it       | Dashboard polling ensures visibility; consider adding in-app banner or browser notification                            |
| Allowlist changes don't apply immediately                      | Ensure filter service re-reads allowlist for each dispatch (no stale caching); log all changes                         |

---

## Open Questions for Clarification

1. What should be the default expiration for allowlist entries? (Currently assuming 30 days)
2. Should HITL actions auto-expire after a timeout, or stay pending indefinitely?
3. Should the operator identifier in `filter_log.reviewed_by` be a user ID, email, or Telegram handle?
4. Are there other actions beyond `sal.contact.prioritize` that should require HITL initially?
5. Should allowlist entries be scoped per-stage, or can a single entry cover multiple stages?
