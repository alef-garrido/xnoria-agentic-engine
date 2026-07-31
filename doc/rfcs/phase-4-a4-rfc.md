# RFC: Phase 4 — A4 COM + EXP Workflows + Memory Browser Fix

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** COM and EXP workflow expansion, memory browser dashboard fix, and foundation items for C4 role-based access. B4 multi-agent coordination is scoped separately.

---

## Executive Summary

Phase 4 A4 has three parallel tracks:

1. **COM + EXP workflows** — complete the two remaining journey stages with signal-grounded n8n workflows and cognitive layer tool definitions
2. **Memory browser fix** — resolve the `failed to fetch memory` error on the dashboard `/memory` page when searching by contact ID
3. **C4 foundation** — operator identity model update required before role-based access can be built in C4

---

## Track 1: Memory Browser Debug

### Current state

The dashboard `/memory` page was partially built during Phase 3 C3 but deferred before completion. The page exists and renders, but entering a contact ID returns `failed to fetch memory`. This must be resolved before Phase 4 ships — the memory browser is the operator's primary window into what the agent has done per contact.

### Diagnosis checklist

The subagent must run through these in order before writing any fix code:

**1. Verify the API route exists and is reachable:**
```bash
curl -b <auth-cookie> http://localhost:4000/api/memory?contact_id=TEST_CID_001
```
If 404 → the proxy route was removed during MemPalace cleanup and not reinstated for Engram.
If 401 → auth middleware is blocking the route.
If 500 → the route exists but the backend call is failing.

**2. Verify the proxy target:**
The dashboard API route should proxy to a memory search endpoint. After the MemPalace → Engram migration, this proxy target changed. Confirm `layers/dashboard/src/app/api/memory/route.ts` is calling the correct endpoint — it should be calling the cognitive layer's internal Engram search, not a MemPalace HTTP endpoint that no longer exists.

**3. Verify Engram is reachable from the dashboard:**
Engram runs as a stdio subprocess inside the cognitive container — it has no HTTP port. The dashboard cannot call Engram directly. The correct architecture is:

```
Dashboard → GET /api/memory?contact_id=X
  → proxies to Filter or Cognitive HTTP endpoint
    → that endpoint calls engram search internally
      → returns results to dashboard
```

If the dashboard is trying to call Engram directly over HTTP, that is the root cause. Engram has no HTTP server in the default MCP mode.

### Correct fix architecture

Add a memory search endpoint to the **filter service** (or cognitive layer if it exposes HTTP):

```
GET /filter/memory/search?contact_id={id}&stage={stage?}
  → calls engram CLI: engram search "{contact_id} {stage}"
  → parses output
  → returns JSON array of memory entries
```

This endpoint executes `engram search` as a shell command inside the filter container — but Engram is installed in the cognitive container, not the filter container. The cleaner path is to add the endpoint to the cognitive layer if it exposes any HTTP surface, or to the filter service with a proxy call to cognitive.

**Recommended:** Add `GET /cognitive/memory/search` to the cognitive layer's HTTP server (if one exists alongside the Telegram channel), then proxy from the dashboard through the filter or directly to cognitive on the internal Docker network.

**If cognitive has no HTTP server:** Add a minimal Express endpoint alongside the existing filter service that shells out to `engram search`. This is a two-file change — one route handler, one dashboard proxy update.

### Dashboard component fix

Once the API is returning data, the `MemoryBrowser` component needs to:

- Accept `contact_id` input (search field)
- Call `GET /api/memory?contact_id={input}` on submit
- Render results as a timeline — each entry shows: date, stage, signal_id, action_id, status
- Handle empty results gracefully: "No memory found for this contact"
- Handle API errors gracefully: show the actual error message, not a generic "failed to fetch"

The generic error message is what operators see now — replace it with the actual response status and message so debugging is easier in production.

### Files to fix

| File | Change |
|---|---|
| `layers/dashboard/src/app/api/memory/route.ts` | Fix proxy target to correct internal endpoint |
| `layers/dashboard/src/components/MemoryBrowser.tsx` | Fix error handling, render timeline from Engram results |
| `layers/cognitive/src/index.ts` OR `layers/orchestration/filter/src/index.ts` | Add `GET /memory/search` endpoint that shells to `engram search` |

---

## Track 2: COM Workflows

### Signal analysis

COM domain: 8 signals across 3 causes (REL, RES, CST).

| Signal ID | Name | Severity | Automated? | Reasoning |
|---|---|---|---|---|
| `COM_REL_01` | unsubscribed emails | 0.9 | ✅ Yes | Critical — re-engagement campaign trigger |
| `COM_REL_02` | low engagement | 0.4 | ✅ Yes | Personalized content nudge |
| `COM_RES_01` | ignored feedback | 0.4 | ✅ Yes | Automate triggered follow-up |
| `COM_RES_02` | one-way communication | 0.5 | ⚠️ Partial | Flag for comms team review — no direct contact action |
| `COM_CST_01` | mixed messaging | 0.4 | ❌ No | Brand/editorial concern — not per-contact |
| `COM_CST_02` | off-brand interactions | 0.5 | ❌ No | Brand/editorial concern — not per-contact |

`COM_CST_01` and `COM_CST_02` are brand-level signals — they apply to the company's communication posture, not to individual contacts. No per-contact action is appropriate.

### New COM action IDs

| Action ID | Stage | Signal(s) | Description | requires_hitl |
|---|---|---|---|---|
| `com.contact.reengage` | COM | COM_REL_01, COM_REL_02 | Enroll contact in re-engagement sequence or send personalized content nudge | true |
| `com.feedback.request` | COM | COM_RES_01 | Send feedback request follow-up to contact whose feedback was ignored | false |
| `com.channel.flag` | COM | COM_RES_02 | Flag contact for comms team review — one-way communication pattern detected | false |

**HITL rationale:**
- `com.contact.reengage` — sequence enrollment is irreversible, unsubscribed contacts are legally sensitive
- `com.feedback.request` — templated message, low-risk
- `com.channel.flag` — internal CRM flag only

### Workflow contracts

#### W-COM-2: `com.contact.reengage`

**Signals:** `COM_REL_01` (unsubscribed, severity 0.9), `COM_REL_02` (low engagement, severity 0.4)

**Logic (executes after HITL approval):**
1. Read `contact_id`, `signal_id`, `cause_code` from filter payload
2. Branch on `signal_id`:
   - `COM_REL_01`: enroll in re-engagement sequence in HubSpot — tag `com-reengagement-active`
   - `COM_REL_02`: send personalized content nudge via WhatsApp based on contact's stage history
3. Update HubSpot contact: log `last_com_reengage_at`
4. Return `200 OK`

**Note:** `COM_REL_01` (unsubscribed emails) is legally sensitive in many jurisdictions. The HITL gate is mandatory. The operator must confirm the re-engagement approach is compliant before dispatch.

#### W-COM-3: `com.feedback.request`

**Signal:** `COM_RES_01` (ignored feedback, severity 0.4)

**Logic:**
1. Read `contact_id`, `signal_id` from filter payload
2. Send feedback follow-up via WhatsApp: "We noticed your feedback hasn't received a response — we'd like to make it right."
3. Create HubSpot task: "Follow up on unacknowledged feedback from [contact_id]" — assigned to CSM
4. Return `200 OK`

#### W-COM-4: `com.channel.flag`

**Signal:** `COM_RES_02` (one-way communication, severity 0.5)

**Logic:**
1. Read `contact_id`, `signal_id` from filter payload
2. Update HubSpot contact: tag `com-channel-review`, set property `communication_pattern: one_way`
3. Create HubSpot task: "Review communication approach for [contact_id]" — assigned to comms owner
4. Return `200 OK`

---

## Track 3: EXP Workflows

### Signal analysis

EXP domain: 6 signals across 3 causes (GRW, VAL, REL).

| Signal ID | Name | Severity | Automated? | Reasoning |
|---|---|---|---|---|
| `EXP_GRW_01` | using competitors for other needs | 0.6 | ✅ Yes | Flag for AE — expansion opportunity |
| `EXP_GRW_02` | stagnant usage | 0.7 | ✅ Yes | Usage-based alert + awareness campaign |
| `EXP_VAL_01` | unwillingness to pay more | 0.5 | ✅ Yes | Present upgrade prompt — lower risk |
| `EXP_VAL_02` | low ROI perception | 0.6 | ✅ Yes | Co-create business case — CSM task |
| `EXP_REL_01` | blockers at executive level | 0.5 | ⚠️ Partial | Assign success manager — HITL warranted |
| `EXP_REL_02` | lack of champions | 0.6 | ✅ Yes | Launch champion identification task |

### New EXP action IDs

| Action ID | Stage | Signal(s) | Description | requires_hitl |
|---|---|---|---|---|
| `exp.account.expand` | EXP | EXP_GRW_01, EXP_GRW_02 | Flag account for AE expansion review or trigger awareness campaign | false |
| `exp.contact.upgrade` | EXP | EXP_VAL_01, EXP_VAL_02 | Send upgrade prompt or initiate ROI business case task | true |
| `exp.relationship.build` | EXP | EXP_REL_01, EXP_REL_02 | Assign success manager or create champion identification task | true |

**Note on `exp.account.flag` placeholder:** This was registered in migration 006 as a disabled placeholder. Migration 009 should update it via `ON CONFLICT DO UPDATE` to enable it and point to the correct workflow, or register the new action IDs and disable the placeholder — do not leave two overlapping EXP actions enabled simultaneously.

**HITL rationale:**
- `exp.account.expand` — internal CRM flag + awareness, reversible
- `exp.contact.upgrade` — sends upgrade prompt or commits CSM time to ROI case, warrants approval
- `exp.relationship.build` — assigns human resources (success manager), warrants approval

### Workflow contracts

#### W-EXP-1: `exp.account.expand`

**Signals:** `EXP_GRW_01` (competitors used, severity 0.6), `EXP_GRW_02` (stagnant usage, severity 0.7)

**Logic:**
1. Read `contact_id`, `signal_id`, `signal_severity` from filter payload
2. Branch on `signal_id`:
   - `EXP_GRW_01`: flag account in HubSpot as expansion opportunity — assign to AE, tag `exp-competitor-risk`
   - `EXP_GRW_02`: trigger usage awareness campaign — enroll in HubSpot sequence `exp-usage-activation`
3. Update HubSpot: log `last_exp_expand_at`
4. Return `200 OK`

#### W-EXP-2: `exp.contact.upgrade`

**Signals:** `EXP_VAL_01` (unwilling to pay more, severity 0.5), `EXP_VAL_02` (low ROI perception, severity 0.6)

**Logic (executes after HITL approval):**
1. Read `contact_id`, `signal_id` from filter payload
2. Branch on `signal_id`:
   - `EXP_VAL_01`: send upgrade prompt via WhatsApp with tier comparison link
   - `EXP_VAL_02`: create HubSpot task for CSM — "Co-create ROI business case with [contact_id]"
3. Tag contact: `exp-upgrade-initiated`
4. Return `200 OK`

#### W-EXP-3: `exp.relationship.build`

**Signals:** `EXP_REL_01` (executive blockers, severity 0.5), `EXP_REL_02` (lack of champions, severity 0.6)

**Logic (executes after HITL approval):**
1. Read `contact_id`, `signal_id` from filter payload
2. Branch on `signal_id`:
   - `EXP_REL_01`: assign success manager in HubSpot — create high-priority task "Executive relationship strategy for [contact_id]"
   - `EXP_REL_02`: create champion identification task — "Identify and activate internal champion at [contact_id account]"
3. Tag contact: `exp-relationship-active`
4. Return `200 OK`

---

## Cognitive Layer: New Tool Definitions

Add 6 new tools to `layers/cognitive/src/tools/definitions.ts`. All follow the established pattern.

### COM tools

```typescript
{
  name: 'com_contact_reengage',
  description: 'Enroll contact in re-engagement sequence or send personalized nudge. ' +
    'Use when signal_id is COM_REL_01 (unsubscribed, severity 0.9) or COM_REL_02 (low engagement). ' +
    'COM_REL_01 requires HITL — legally sensitive. Always verify compliance before approving.',
  parameters: { contact_id, signal_id, cause_code, interventions }
}

{
  name: 'com_feedback_request',
  description: 'Send feedback follow-up to contact whose feedback was ignored. ' +
    'Use when signal_id is COM_RES_01, signal_severity >= 0.4.',
  parameters: { contact_id, signal_id }
}

{
  name: 'com_channel_flag',
  description: 'Flag contact for comms team review — one-way communication pattern. ' +
    'Use when signal_id is COM_RES_02. Internal CRM flag only — no contact-facing action.',
  parameters: { contact_id, signal_id, signal_severity }
}
```

### EXP tools

```typescript
{
  name: 'exp_account_expand',
  description: 'Flag account for AE expansion review or trigger usage awareness campaign. ' +
    'Use when signal_id is EXP_GRW_01 (competitor risk) or EXP_GRW_02 (stagnant usage), severity >= 0.5.',
  parameters: { contact_id, signal_id, signal_severity, cause_code }
}

{
  name: 'exp_contact_upgrade',
  description: 'Send upgrade prompt or initiate ROI business case task. ' +
    'Use when signal_id is EXP_VAL_01 or EXP_VAL_02, severity >= 0.5. Requires HITL.',
  parameters: { contact_id, signal_id, signal_severity }
}

{
  name: 'exp_relationship_build',
  description: 'Assign success manager or create champion identification task. ' +
    'Use when signal_id is EXP_REL_01 or EXP_REL_02, severity >= 0.5. Requires HITL.',
  parameters: { contact_id, signal_id, signal_severity, cause_code }
}
```

### TOOL_TO_ACTION additions

```typescript
com_contact_reengage:   { action_id: 'com.contact.reengage',   stage: 'COM' },
com_feedback_request:   { action_id: 'com.feedback.request',   stage: 'COM' },
com_channel_flag:       { action_id: 'com.channel.flag',       stage: 'COM' },
exp_account_expand:     { action_id: 'exp.account.expand',     stage: 'EXP' },
exp_contact_upgrade:    { action_id: 'exp.contact.upgrade',    stage: 'EXP' },
exp_relationship_build: { action_id: 'exp.relationship.build', stage: 'EXP' },
```

---

## Database Migration

### `009_com_exp_actions.sql`

```sql
-- COM actions
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('com.contact.reengage',   'COM', 'PLACEHOLDER_WEBHOOK_COM_02', true,  true, 'Re-engage contact via sequence or personalized nudge'),
  ('com.feedback.request',   'COM', 'PLACEHOLDER_WEBHOOK_COM_03', false, true, 'Send feedback follow-up to contact with ignored feedback'),
  ('com.channel.flag',       'COM', 'PLACEHOLDER_WEBHOOK_COM_04', false, true, 'Flag contact for comms team review — one-way pattern')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description;

-- EXP actions (also updates exp.account.flag placeholder)
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('exp.account.expand',     'EXP', 'PLACEHOLDER_WEBHOOK_EXP_02', false, true,  'Flag account for AE expansion or trigger usage campaign'),
  ('exp.contact.upgrade',    'EXP', 'PLACEHOLDER_WEBHOOK_EXP_03', true,  true,  'Send upgrade prompt or initiate ROI business case'),
  ('exp.relationship.build', 'EXP', 'PLACEHOLDER_WEBHOOK_EXP_04', true,  true,  'Assign success manager or create champion task')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description;

-- Disable exp.account.flag placeholder now that real EXP actions are registered
UPDATE filter_action SET enabled = false WHERE action_id = 'exp.account.flag';
```

Follow-up migration `010_update_workflow_ids.sql` — stub file, same pattern as 008. Replace placeholder IDs with real n8n webhook IDs after workflows are built and activated.

---

## C4 Foundation: Operator Identity

This is not a full C4 implementation — it is the one schema change that must happen in Phase 4 before C4 role-based access can be built.

Currently `filter_log.reviewed_by` stores `"admin"` — a single-user string with no structure. C4 requires an operator identity model. The foundation is a simple `operators` table:

```sql
-- 011_operators_foundation.sql
CREATE TABLE IF NOT EXISTS operators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      TEXT UNIQUE NOT NULL,   -- e.g. "oscar", "admin"
  display_name TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'operator',  -- operator | admin | viewer
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled    BOOLEAN NOT NULL DEFAULT false
);

-- Seed the current single operator
INSERT INTO operators (handle, display_name, role)
VALUES ('admin', 'Admin', 'admin')
ON CONFLICT (handle) DO NOTHING;
```

No application code changes required yet — `filter_log.reviewed_by` continues to store the handle string. C4 will add the foreign key relationship and the UI for operator management. This migration just establishes the table so C4 has a foundation to build on.

---

## New and Modified Files

### New Files

| # | File | Purpose |
|---|---|---|
| 1 | `workflows/n8n/com.contact.reengage.json` | COM re-engagement workflow |
| 2 | `workflows/n8n/com.feedback.request.json` | COM feedback follow-up workflow |
| 3 | `workflows/n8n/com.channel.flag.json` | COM channel flag workflow |
| 4 | `workflows/n8n/exp.account.expand.json` | EXP expansion flag workflow |
| 5 | `workflows/n8n/exp.contact.upgrade.json` | EXP upgrade prompt workflow |
| 6 | `workflows/n8n/exp.relationship.build.json` | EXP relationship build workflow |
| 7 | `filter/db/migrations/009_com_exp_actions.sql` | Register COM + EXP actions |
| 8 | `filter/db/migrations/010_update_workflow_ids.sql` | Stub for real webhook IDs |
| 9 | `filter/db/migrations/011_operators_foundation.sql` | Operators table foundation |

### Modified Files

| # | File | Change |
|---|---|---|
| 1 | `cognitive/src/tools/definitions.ts` | Add 6 COM + EXP tool definitions |
| 2 | `dashboard/src/app/api/memory/route.ts` | Fix proxy target for Engram search |
| 3 | `dashboard/src/components/MemoryBrowser.tsx` | Fix error handling + timeline render |
| 4 | `cognitive/src/index.ts` OR `filter/src/index.ts` | Add GET /memory/search endpoint |

---

## Implementation Sequence

```
Memory browser fix (unblocks operator visibility)
  1. Diagnose failed fetch — run curl test against /api/memory
  2. Identify whether proxy target is wrong or endpoint is missing
  3. Add /memory/search endpoint to cognitive or filter HTTP server
  4. Fix dashboard proxy route
  5. Fix MemoryBrowser error handling
  6. Verify: search TEST_CID_001 returns prior Phase 3 test records

COM + EXP workflows (parallel with memory fix)
  7. Build W-COM-2, W-COM-3, W-COM-4 in n8n
  8. Build W-EXP-1, W-EXP-2, W-EXP-3 in n8n
  9. Add 6 tool definitions to definitions.ts
  10. Apply migration 009 (after webhook IDs confirmed)
  11. Create stub migration 010
  12. Export all 6 workflows to workflows/n8n/

C4 foundation
  13. Apply migration 011 (operators table)

Final
  14. Apply migration 010 with real webhook IDs
  15. TypeScript compilation verification
  16. Force-recreate cognitive container
  17. Update AGENTS.md
```

---

## Acceptance Criteria

- [ ] Memory browser: entering `TEST_CID_001` returns timeline of Phase 3 test records
- [ ] Memory browser: API errors show actual error message, not generic "failed to fetch"
- [ ] 6 COM + EXP workflows built in n8n and exported to source control
- [ ] Migration 009 applied — 6 new actions in `filter_action`, `exp.account.flag` disabled
- [ ] 6 new tool definitions added, TypeScript compilation passes
- [ ] Stage-aware tool filtering: `COM` events show 4 tools, `EXP` events show 4 tools
- [ ] Token count remains below 4,000 with new tool additions
- [ ] `com.contact.reengage` and `exp.contact.upgrade` route through HITL correctly
- [ ] Migration 011 applied — `operators` table exists with admin seed row
- [ ] `grep -r "mempalace" layers/` returns nothing (confirms cleanup is complete)