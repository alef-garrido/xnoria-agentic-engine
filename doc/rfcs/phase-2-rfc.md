Exnoria# RFC: Phase 2 — Journey Expansion

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** SUP + RET workflow coverage, agent toolset expansion, and journey health dashboard

---

## Executive Summary

Phase 2 extends Exnoria from a 3-action SAL/ACQ engine into a system that covers the two highest-value post-acquisition stages: Support (`SUP`) and Retention (`RET`). It also delivers the first operational visibility layer — the Journey Health Map — which gives operators a live view of CX signal activity across all active stages.

Three parallel tracks:

1. **A2 — SUP + RET n8n Workflows** — The execution layer for escalation and churn winback actions
2. **B2 — Agent Toolset Expansion** — New tool definitions and signal vocabulary bridge so the cognitive layer can reason about SUP/RET events (unlocked by A2)
3. **C2 — Journey Health Map** — Dashboard page showing per-stage action volume, signal severity distribution, and agent decision quality

---

## Architectural Context: The Signal Vocabulary Bridge

The most important new concept in Phase 2 is the **signal vocabulary bridge** — the mechanism that connects the CX Diagnostic Compass framework to Exnoria's event model.

### Current State

The MVP `CXEvent` was built independently of the Compass framework. The three SAL workflows operate on ad-hoc event fields. There is no formal mapping between Compass signal IDs (e.g. `RET_SAT_02`, `SUP_RES_01`) and the events the cognitive layer processes.

### What Needs to Exist

The Compass framework defines signals with:
- A structured ID: `{DOMAIN}_{CAUSE}_{SEQUENCE}` (e.g. `SUP_RES_01`)
- A severity score: `0–1`
- A cause code: `{DOMAIN}-{CAUSE}` (e.g. `SUP-RES`)
- Intervention IDs: `INT_{DOMAIN}_{CAUSE}_{SIGNAL}_{OPTION}`

Exnoria needs to treat these as first-class citizens in `CXEvent`. The cognitive layer should receive a signal ID, look up its severity and interventions, and reason about which action to take — rather than receiving vague event metadata and guessing.

### The Bridge

Extend `CXEvent` in `layers/cognitive/src/shared/types.ts` with:

```typescript
interface CXEvent {
  // existing fields
  session_id: string;
  contact_id: string;
  stage: JourneyStage;

  // NEW: Compass signal vocabulary
  signal_id?: string;         // e.g. "SUP_RES_01" — Compass signal ID
  signal_severity?: number;   // 0–1 from Compass signal.severity
  cause_code?: string;        // e.g. "SUP-RES" — Compass cause code
  interventions?: string[];   // e.g. ["INT_SUP_RES_01_A", "INT_SUP_RES_01_B"]

  // existing
  payload: Record<string, unknown>;
  meta?: Record<string, unknown>;
}
```

This is **additive and optional** — the `?` fields mean existing SAL events continue to work unchanged. SUP and RET events populate these fields; the agent uses them to reason about severity and available interventions.

**This bridge is a prerequisite for B2.** The tool definitions are only meaningful if the agent receives signal context to reason from.

---

## Track A2 — SUP + RET Workflows

### Objective

Build the n8n workflow execution layer for four new actions across two stages. These are the "execution stubs" — the cognitive layer will call them via the filter; they execute in external systems (CRM, comms).

### New Action IDs

Following the `stage.resource.verb` convention:

| Action ID | Stage | Description | requires_hitl |
|---|---|---|---|
| `sup.ticket.escalate` | SUP | Flag ticket for senior support review | false |
| `sup.contact.notify` | SUP | Send resolution update to contact | true |
| `ret.contact.winback` | RET | Enroll contact in winback sequence | true |
| `ret.account.flag` | RET | Flag account for CSM immediate review | false |

**HITL rationale:**
- `sup.contact.notify` — sends external communication, irreversible
- `ret.contact.winback` — enrolls in sequence, triggers external messages, irreversible
- `sup.ticket.escalate` and `ret.account.flag` — internal CRM operations, fully reversible

### Workflow Contracts

Each n8n workflow receives a webhook payload from the filter service in this shape:

```json
{
  "action_id": "sup.ticket.escalate",
  "stage": "SUP",
  "session_id": "sess_abc123",
  "contact_id": "CID_12345",
  "signal_id": "SUP_RES_01",
  "signal_severity": 0.82,
  "cause_code": "SUP-RES",
  "payload": {
    "ticket_id": "TKT_789",
    "subject": "...",
    "open_days": 5
  },
  "meta": {
    "triggered_by": "Agent reasoning: high severity unresolved ticket"
  }
}
```

### Workflow Definitions

#### W4 — `sup.ticket.escalate`

**Trigger:** Webhook from filter  
**Logic:**
1. Read `contact_id`, `payload.ticket_id` from webhook body
2. Update ticket in CRM: set priority = high, assign to escalation queue
3. Add CRM note: "Escalated by Exnoria agent — signal `{{signal_id}}`, severity `{{signal_severity}}`"
4. Return `200 OK` with `{ executed: true, ticket_id }`

**No external comms.** Internal CRM operation only.

#### W5 — `sup.contact.notify`

**Trigger:** Webhook from filter (after HITL approval)  
**Logic:**
1. Read `contact_id`, `payload` from webhook body
2. Send resolution update via comms channel (WhatsApp / email — operator-configured)
3. Log delivery status to CRM
4. Return `200 OK` with `{ executed: true, channel, delivered_at }`

**Requires HITL** before dispatch.

#### W6 — `ret.contact.winback`

**Trigger:** Webhook from filter (after HITL approval)  
**Logic:**
1. Read `contact_id`, `signal_id`, `cause_code` from webhook body
2. Enroll contact in winback sequence (CRM sequences module)
3. Tag contact: `ret-winback-active`, `cause:{cause_code}`
4. Return `200 OK` with `{ executed: true, sequence_id }`

**Requires HITL** before dispatch.

#### W7 — `ret.account.flag`

**Trigger:** Webhook from filter  
**Logic:**
1. Read `contact_id`, `signal_severity` from webhook body
2. Update account in CRM: set churn_risk = true, assign to CSM
3. Add note: "Churn risk flagged by Exnoria — signal `{{signal_id}}`, severity `{{signal_severity}}`"
4. Return `200 OK` with `{ executed: true, account_id }`

**No external comms.** Internal CRM operation only.

### Deliverables

- [ ] Build W4 in n8n UI, export JSON to `workflows/n8n/sup.ticket.escalate.json`
- [ ] Build W5 in n8n UI, export JSON to `workflows/n8n/sup.contact.notify.json`
- [ ] Build W6 in n8n UI, export JSON to `workflows/n8n/ret.contact.winback.json`
- [ ] Build W7 in n8n UI, export JSON to `workflows/n8n/ret.account.flag.json`
- [ ] New migration: `layers/orchestration/filter/db/migrations/004_sup_ret_actions.sql` — INSERT four new `filter_action` rows with correct `n8n_workflow_id`, `requires_hitl`, `stage`

### Migration Template

```sql
-- 004_sup_ret_actions.sql
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('sup.ticket.escalate', 'SUP', '<w4-webhook-id>', false, true, 'Escalate ticket to senior support'),
  ('sup.contact.notify',  'SUP', '<w5-webhook-id>', true,  true, 'Send resolution update to contact'),
  ('ret.contact.winback', 'RET', '<w6-webhook-id>', true,  true, 'Enroll contact in winback sequence'),
  ('ret.account.flag',    'RET', '<w7-webhook-id>', false, true, 'Flag account for CSM review');
```

Replace `<w4-webhook-id>` etc. with actual n8n webhook IDs after workflows are built.

---

## Track B2 — Agent Toolset Expansion

**Dependency: A2 must be complete before B2 begins.** Tool definitions are only meaningful once filter entries and n8n workflows exist to back them.

### Objective

Give the cognitive layer the ability to reason about SUP and RET signals and select the correct action. This involves two work items: implementing the signal vocabulary bridge, and adding four new tool definitions.

### B2.1 — Signal Vocabulary Bridge

**File to modify:** `layers/cognitive/src/shared/types.ts`

Extend `CXEvent` as specified in the Architectural Context section above. No breaking changes — all new fields are optional.

**Verification:** Existing SAL event tests must pass unchanged after this modification.

### B2.2 — SUP + RET Tool Definitions

**File to modify:** `layers/cognitive/src/tools/definitions.ts`

Add four tool definitions following the existing pattern. Each tool definition must include:
- `name`: matches `action_id` exactly (e.g. `sup__ticket__escalate` or however the existing tools are named — follow the existing convention)
- `description`: tells the LLM when to use this tool, referencing signal severity thresholds
- `parameters`: required fields the agent must supply, including `signal_id`, `signal_severity`, `cause_code` where relevant

#### Tool: `sup.ticket.escalate`

```
Description: Escalate an unresolved support ticket to the senior support queue.
Use when: signal_id is in the SUP domain AND signal_severity > 0.6 AND ticket has been open more than 48 hours without resolution.
Parameters: contact_id, ticket_id, signal_id, signal_severity, open_days
```

#### Tool: `sup.contact.notify`

```
Description: Send a resolution status update directly to the contact.
Use when: signal_id is in the SUP domain AND operator has context on resolution status to communicate.
Requires HITL: true — always route through human approval before sending external communication.
Parameters: contact_id, ticket_id, signal_id, message_context
```

#### Tool: `ret.contact.winback`

```
Description: Enroll a contact in the winback sequence for churn prevention.
Use when: signal_id is in the RET domain AND signal_severity > 0.7.
Requires HITL: true — external sequence enrollment is irreversible.
Parameters: contact_id, signal_id, signal_severity, cause_code
```

#### Tool: `ret.account.flag`

```
Description: Flag an account for immediate CSM review due to churn risk.
Use when: signal_id is in the RET domain AND signal_severity > 0.5. Use as a lower-threshold first step before enrolling in winback.
Parameters: contact_id, account_id, signal_id, signal_severity
```

### B2.3 — Stage-Aware Routing

**File to modify:** `layers/cognitive/src/agent/reason.ts`

The agent's reasoning cycle currently operates on SAL/ACQ events. Add stage-aware routing so the agent selects tools from the correct stage toolset based on `CXEvent.stage`.

**Architectural note:** Do not add conditional logic that lists stages explicitly — instead, the tool descriptions carry their own applicability criteria (signal domain, severity threshold). The agent should select tools based on the signal context it receives, not a hardcoded stage→tool map. The stage field on `CXEvent` provides the routing hint; the tool descriptions provide the selection logic.

### Deliverables

- [ ] Extend `CXEvent` in `layers/cognitive/src/shared/types.ts` with signal vocabulary fields
- [ ] Add four tool definitions to `layers/cognitive/src/tools/definitions.ts`
- [ ] Review `layers/cognitive/src/agent/reason.ts` for any SAL-specific hardcoding that would prevent SUP/RET events from routing correctly
- [ ] Test: send a synthetic `CXEvent` with `stage: "SUP"`, `signal_id: "SUP_RES_01"`, `signal_severity: 0.82` through the cognitive layer and verify it selects `sup.ticket.escalate`
- [ ] Test: send a synthetic `CXEvent` with `stage: "RET"`, `signal_id: "RET_SAT_02"`, `signal_severity: 0.75` and verify it selects `ret.contact.winback` (and routes through HITL)

---

## Track C2 — Journey Health Map

### Objective

Give operators a live view of CX signal activity across all active journey stages. The health map answers three questions:
1. **What is the system doing?** — action volume and execution rate per stage
2. **Where is the pain concentrated?** — signal severity distribution per stage
3. **How well is the agent deciding?** — decision quality metrics (HITL approval rate, rejection rate)

### Data Sources

The health map queries two sources:

**Source 1: `filter_log` (Postgres)** — what the system has done
- Action volume per stage (count by `stage`, grouped by `created_at` date)
- Execution rate: `executed` vs `rejected` vs `pending_hitl` per stage
- HITL approval rate: approved / (approved + rejected) per stage
- Average latency from `created_at` to `reviewed_at` for HITL actions

**Source 2: Signal severity (static, from Compass framework)** — what the domain looks like
- Per-stage average severity: computed from the Compass `FlatSignal[]` data
- The diagnostic app's `wheelDataEn.ts` is the source of truth — do not duplicate this data in Exnoria's database
- Import or vendor the `getAllSignals()` processing function and the English wheel data into the dashboard as a read-only reference

**Important:** The Compass app stays separate. The dashboard does not call the Compass app at runtime. It vendors the static signal data (a JSON snapshot or a copy of `wheelDataEn.ts`) for local computation only.

### Page: `/dashboard/health`

#### Layout

Three sections:

**1. Stage Summary Strip** — top of page
A horizontal row of stage cards, one per active stage (ACQ, SAL, SUP, RET — expand as phases add stages). Each card shows:
- Stage code and name
- Total actions (last 7 days)
- Execution rate (% executed)
- Average signal severity for that stage (from Compass data)
- Status indicator: healthy / warning / critical based on combined thresholds

**2. Action Volume Chart** — center
A bar or line chart showing daily action volume per stage over the last 30 days. Grouped by stage, colored by the stage's domain color from the Compass color system (reuse the hex values already defined in `wheelDataEn.ts`).

**3. Decision Quality Panel** — bottom
A table with one row per active stage showing:
- HITL actions in period
- Approval rate
- Rejection rate
- Most common rejection reason (`rejection_code`)
- Avg time to review

#### Thresholds for Status Indicators

| Indicator | Healthy | Warning | Critical |
|---|---|---|---|
| Execution rate | > 85% | 60–85% | < 60% |
| Avg signal severity | < 0.5 | 0.5–0.7 | > 0.7 |
| HITL approval rate | > 80% | 60–80% | < 60% |

These thresholds are initial values. Expose them as constants in the component so they can be adjusted without a code change.

### New Files

| File | Purpose |
|---|---|
| `layers/dashboard/src/app/(dashboard)/health/page.tsx` | Health map page shell |
| `layers/dashboard/src/components/JourneyHealthMap.tsx` | Main health map component |
| `layers/dashboard/src/app/api/filter/health/route.ts` | Proxy: queries filter_log for health metrics |
| `layers/dashboard/src/lib/compass.ts` | Vendored Compass signal data + `getStageAverageSeverity()` helper |

### Filter Service: Health Metrics Endpoint

Add one new endpoint to the filter service:

```
GET /filter/health
  → Aggregated metrics from filter_log
  → Query params: ?days=30 (default 30)
  → Response: Array of per-stage metrics
```

Response shape:

```typescript
interface StageHealthMetrics {
  stage: JourneyStage;
  period_days: number;
  total_actions: number;
  executed: number;
  rejected: number;
  pending_hitl: number;
  execution_rate: number;        // executed / total_actions
  hitl_total: number;
  hitl_approved: number;
  hitl_rejected: number;
  hitl_approval_rate: number;
  avg_review_minutes: number | null;
  top_rejection_code: string | null;
}
```

**File to modify:** `layers/orchestration/filter/src/index.ts` — add `GET /filter/health` route handler with the aggregation query.

### Deliverables

- [ ] Filter service: implement `GET /filter/health` endpoint with aggregation query
- [ ] Dashboard: vendor Compass signal data into `lib/compass.ts` (static copy of English wheel data + `getStageAverageSeverity(stage)` helper)
- [ ] Dashboard: create `/health` page with three-section layout
- [ ] Dashboard: create `JourneyHealthMap` component
- [ ] Dashboard: create proxy route `api/filter/health/route.ts`
- [ ] Sidebar: add "Health" nav item (`Activity` icon from lucide-react) positioned before Approvals
- [ ] Test: verify health map shows correct stage data after manually inserting test `filter_log` rows

---

## Implementation Sequence

```
A2: Build W4, W5, W6, W7 in n8n          ← no dependencies
A2: Migration 004 (register actions)       ← after workflows built (need webhook IDs)
B2.1: Extend CXEvent type                  ← no dependencies, can run in parallel with A2
B2.2: Add tool definitions                 ← after A2 migration is applied
B2.3: Review reason.ts routing             ← after B2.2
C2: Filter health endpoint                 ← no dependencies, can run in parallel
C2: Dashboard health map                   ← after filter health endpoint
C2: Vendor Compass data                    ← no dependencies
Sidebar integration                        ← last
```

---

## New and Modified Files Summary

### New Files

| # | File | Purpose |
|---|---|---|
| 1 | `workflows/n8n/sup.ticket.escalate.json` | n8n workflow export |
| 2 | `workflows/n8n/sup.contact.notify.json` | n8n workflow export |
| 3 | `workflows/n8n/ret.contact.winback.json` | n8n workflow export |
| 4 | `workflows/n8n/ret.account.flag.json` | n8n workflow export |
| 5 | `filter/db/migrations/004_sup_ret_actions.sql` | Register 4 new actions |
| 6 | `filter/src/health/health.ts` | Health metrics aggregation logic |
| 7 | `dashboard/src/lib/compass.ts` | Vendored Compass data + severity helper |
| 8 | `dashboard/src/app/(dashboard)/health/page.tsx` | Health map page |
| 9 | `dashboard/src/components/JourneyHealthMap.tsx` | Health map component |
| 10 | `dashboard/src/app/api/filter/health/route.ts` | Proxy: health metrics |

### Modified Files

| # | File | Change |
|---|---|---|
| 1 | `cognitive/src/shared/types.ts` | Extend CXEvent with signal vocabulary fields |
| 2 | `cognitive/src/tools/definitions.ts` | Add 4 SUP + RET tool definitions |
| 3 | `cognitive/src/agent/reason.ts` | Review and fix any SAL-specific hardcoding |
| 4 | `filter/src/index.ts` | Add GET /filter/health route |
| 5 | `filter/src/shared/types.ts` | Add StageHealthMetrics interface, SUP/RET to JourneyStage if not present |
| 6 | `dashboard/src/components/Sidebar.tsx` | Add Health nav item |

---

## Open Questions

1. **Comms channel for `sup.contact.notify` and `ret.contact.winback`** — The RFC assumes WhatsApp or email, operator-configured in n8n. Confirm which channel(s) are available in the current CRM/comms setup before building W5 and W6.

2. **Compass data vendoring language** — The dashboard should vendor the English (`wheelDataEn`) data. Confirm whether Spanish data is needed in the health map at this phase.

3. **`JourneyStage` type completeness** — Confirm whether `SUP` and `RET` are already present in the `JourneyStage` union type in `layers/orchestration/filter/src/shared/types.ts`, or if migration 004 needs to be preceded by a type update.

4. **Health map period default** — 30 days is assumed. Should the dashboard offer a period selector (7 / 30 / 90 days) at launch, or is 30 days fixed for now?

---

## Acceptance Criteria for Phase 2 Completion

- [ ] All four SUP + RET workflows are built in n8n, exported to source control, and registered in `filter_action`
- [ ] A synthetic SUP event with `signal_severity > 0.6` triggers `sup.ticket.escalate` end-to-end
- [ ] A synthetic RET event with `signal_severity > 0.7` triggers `ret.contact.winback` and routes through HITL
- [ ] Journey health map renders correct stage metrics from live `filter_log` data
- [ ] All new code passes TypeScript compilation with no errors
- [ ] AGENTS.md updated to reflect Phase 2 complete and D3 stage-control entry added