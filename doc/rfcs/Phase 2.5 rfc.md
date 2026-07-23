# RFC: Phase 2.5 — Workflow Integration & Full Stage Coverage

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** Integrate existing CX Engine workflows into the filter architecture, achieve at least one registered action per journey stage, and establish placeholder stubs for PRD and EXP ahead of their dedicated phases.

---

## Executive Summary

This phase bridges the gap between the existing n8n workflow library and the Exnoria filter architecture. Eight workflows are being adapted and registered. Two workflows are deferred to Phase 4. Two new stages (ONB, COM) become active. Two stages (PRD, EXP) receive minimal placeholder registrations for type completeness. By the end of this phase, all eight journey stages have at least one entry in `filter_action` and the `JourneyStage` type is complete.

---

## Architectural Principles to Enforce Across All Workflows

Before touching any individual workflow, the subagent must apply these rules universally:

1. **Remove all inline compliance gates.** Every workflow that calls `WF_Compliance_Guardrails_v1` internally must have that call removed. The filter's allowlist check is the compliance gate. Doing it twice creates conflicting rejection paths and breaks the audit log.

2. **Remove all inline routing logic.** Any `IF` node that makes a behavioral decision (e.g. IsOutOfHours, IsAllowed) must be removed. The cognitive layer decides which action to call. The workflow executes one path only.

3. **Replace self-triggers with filter webhook receivers.** Workflows triggered by their own webhook must be refactored to receive the standard filter dispatch payload. The entry point is always the filter's `dispatchToN8n()` call.

4. **Read contact identity from filter payload.** Any workflow that generates or guesses a `contact_id` / `lead_id` must instead read it from the incoming filter payload field `contact_id`.

5. **Fix dead-end nodes.** Any node that sets a variable but has no downstream write to CRM or comms must be extended to actually execute that write.

6. **n8n logging is secondary.** Calls to `cxEngine_Analytics_Metrics_v1` can stay as supplementary logging, but the filter audit log (`filter_log`) is the authoritative record. Do not treat n8n logging as a substitute.

---

## Deferred Workflows (Phase 4)

The following two workflows are **not touched in this phase** and should not be registered in `filter_action`:

| Workflow | Reason |
|---|---|
| `WhatsApp_Decision_Engine` | Contains inline Gemini decision agent — violates cognitive/orchestration separation. Deferred to Phase 4 multi-agent coordination scope where the architecture for conversational agents will be properly defined. |
| `OutOfHours_Engine` (as-is) | Will be split into two actions (see below), but the split produces one SAL action (`sal.lead.handoff`) that overlaps with existing SAL coverage. The nurture path (`acq.lead.nurture`) is included. The handoff path is deferred until `sal.lead.handoff` can be properly wired to a CRM write — the current node is a dead end. |

---

## Stage Coverage Plan

| Stage | Actions After This Phase | Source |
|---|---|---|
| ACQ | `acq.lead.engage`, `acq.lead.nurture`, `acq.contact.outreach` | Existing workflows adapted |
| SAL | `sal.sequence.enroll`, `sal.contact.prioritize`, `sal.contact.message` | Existing + WhatsApp send stub |
| ONB | `onb.document.request`, `onb.document.validate` | Existing workflows adapted |
| PRD | `prd.friction.flag`, `prd.adoption.nudge` | New placeholders |
| SUP | `sup.ticket.escalate`, `sup.contact.notify` | Phase 2 |
| COM | `com.content.publish` | Existing workflow adapted |
| RET | `ret.contact.winback`, `ret.account.flag` | Phase 2 |
| EXP | `exp.account.flag` | New placeholder |

---

## Track 1: Workflow Adaptations

### W-ACQ-1: `acq.lead.engage` (from SpeedToLead_Engine)

**What it does:** Receives a new inbound opt-in lead and sends an immediate WhatsApp acknowledgment via Meta API.

**Changes required:**
- Remove `ComplianceCheck` node and `IsAllowed` IF gate entirely
- Remove `NormalizedLead` fallback `lead_id` generation — replace with `contact_id` from filter payload
- Entry point becomes the standard filter webhook receiver (no self-webhook trigger)
- Keep `LogTrigger` and `LogAcked` calls to `cxEngine_Analytics_Metrics_v1` as secondary logging
- Keep `AckDelivery` WhatsApp send node — this is the action

**Filter registration:**
```sql
('acq.lead.engage', 'ACQ', '<w-acq-1-webhook-id>', false, true, 'Send immediate WhatsApp acknowledgment to new inbound lead')
```

---

### W-ACQ-2: `acq.lead.nurture` (from OutOfHours_Engine — nurture path only)

**What it does:** Engages an inbound contact outside business hours with an AI nurture conversation (Gemini).

**Changes required:**
- Extract only the `AINurtureBot` + `GeminiModel` + `SimpleMemory` subgraph into a new standalone workflow
- Remove `InboundTrigger` self-webhook, `ComplianceCheck`, and `IsOutOfHours` gate entirely
- Remove `SalesHandoff` branch — that path is deferred
- Remove `LogOOH` call (or keep as secondary logging — operator's choice)
- Entry point: filter webhook receiver
- Contact identity from filter payload

**Filter registration:**
```sql
('acq.lead.nurture', 'ACQ', '<w-acq-2-webhook-id>', false, true, 'Engage out-of-hours inbound contact with AI nurture conversation')
```

---

### W-ACQ-3: `acq.contact.outreach` (from WF_Unified_Cold_Outreach)

**What it does:** Sends coordinated cold outreach to a contact via WhatsApp + Gmail, then syncs to HubSpot.

**Architectural note:** This workflow was batch/schedule-driven (reads a Sheets list). In the filter architecture it must become contact-level — the cognitive layer generates one `CXEvent` per contact, the filter dispatches one action per contact. The Sheets list becomes a signal source upstream of Exnoria, not a data source inside the workflow.

**Changes required:**
- Remove `ScheduleTrigger` and `ReadLeads` Google Sheets nodes
- Entry point: filter webhook receiver carrying `contact_id`, `phone`, `email`, `name` in payload
- Keep `WhatsAppOutbound`, `WaitShort`, `GmailOutbound`, `HubSpotSync`, `UpdateLeadStatus`, `LogMetrics`
- `UpdateLeadStatus` Sheets write: replace with HubSpot status update to keep CRM as single source of truth (Sheets dependency removed)
- `SPREADSHEET_ID` references removed

**Filter registration:**
```sql
('acq.contact.outreach', 'ACQ', '<w-acq-3-webhook-id>', true, true, 'Send cold outreach via WhatsApp and email, sync to HubSpot')
```

`requires_hitl: true` — sends external messages to cold contacts, irreversible.

---

### W-SAL-1: `sal.contact.message` (from WhatsApp_Decision_Engine — execution stub only)

**What it does:** Sends a pre-composed WhatsApp message to a contact. Message content is provided by the cognitive layer in the filter payload.

**Changes required:**
- Remove `CoreDecision` agent node and `GeminiModel` entirely — decision logic does not belong here
- Remove `LogInbound` and `Normalization` nodes — normalization happens in the cognitive layer
- Keep only `SendWhatsApp` HTTP node
- Entry point: filter webhook receiver with `contact_id`, `phone`, `message_content` in payload
- `SendWhatsApp` reads `message_content` from filter payload instead of agent output
- Activate the workflow (currently inactive)

**Filter registration:**
```sql
('sal.contact.message', 'SAL', '<w-sal-1-webhook-id>', false, true, 'Send pre-composed WhatsApp message to SAL stage contact')
```

---

### W-ONB-1: `onb.document.request` (from DocumentCollection_Engine_Triggers)

**What it does:** Detects contacts with pending document submissions and initiates the collection flow.

**Architectural note:** The current workflow uses a schedule trigger polling a CRM endpoint. In the filter architecture this must become event-driven. The CRM should fire a webhook when a contact reaches document-pending state, which generates a `CXEvent` into the cognitive layer, which then dispatches this action.

**Changes required:**
- Remove `ScheduleTrigger` and `CheckSubmissionStatus` HTTP poll nodes entirely
- Entry point: filter webhook receiver with `contact_id` and `document_type` in payload
- Add a single downstream node: HTTP POST to CRM to initiate document request for the contact
- The CRM endpoint (`https://api.crm.example.com/...`) is a placeholder — replace with actual HubSpot API call consistent with the rest of the stack

**Filter registration:**
```sql
('onb.document.request', 'ONB', '<w-onb-1-webhook-id>', false, true, 'Initiate document collection request for onboarding contact')
```

---

### W-ONB-2: `onb.document.validate` (from DocumentCollection_Engine_Validation)

**What it does:** Receives a document submission, validates it, and updates CRM with result.

**Changes required:**
- Remove `ComplianceCheck`, `AllowedToMessage` IF gate — filter handles this
- Remove `SubmissionWebhook` self-trigger — entry point becomes filter webhook receiver
- Keep `NormalizeSubmission`, `ValidateDoc` IF, `LogSubmission`, `LogSuccess`
- Fix `CRMUpdateFailure` dead end: replace the `Set` node with an actual HubSpot API call that writes `document_status: rejected` to the contact record
- Add a parallel success path: when `ValidateDoc` passes, write `document_status: approved` to HubSpot (currently only logs success, no CRM write)

**Filter registration:**
```sql
('onb.document.validate', 'ONB', '<w-onb-2-webhook-id>', false, true, 'Validate submitted document and update contact record in CRM')
```

---

### W-COM-1: `com.content.publish` (from WF_Social_Media_Scheduler)

**What it does:** Publishes scheduled content from a Google Sheets calendar to LinkedIn, Instagram, and Threads.

**Architectural note:** This is the one workflow that legitimately remains schedule-driven — content publishing is time-based, not contact-event-based. It is registered in `filter_action` as an autonomous action that the cognitive layer can also trigger on demand, but it runs on its own schedule regardless. This is an exception to the event-driven rule and should be documented as such in the filter action description.

**Changes required:**
- Replace `SPREADSHEET_ID_HERE` with environment variable `COM_CONTENT_SHEET_ID`
- Add `COM_CONTENT_SHEET_ID` to `.env.example` and `docker-compose.yml` filter service environment
- Keep schedule trigger — this workflow retains its autonomous schedule
- Keep all posting nodes (LinkedIn, Instagram, Threads) and `Mark as Posted` Sheets update
- Add a secondary filter webhook receiver as an alternative entry point so the cognitive layer can trigger a publish run on demand (two trigger paths: schedule OR filter dispatch)

**Filter registration:**
```sql
('com.content.publish', 'COM', '<w-com-1-webhook-id>', true, true, 'Publish scheduled content to LinkedIn, Instagram, and Threads — autonomous schedule + on-demand')
```

`requires_hitl: true` — external brand publishing, irreversible, high-visibility.

---

## Track 2: Placeholder Registrations

Placeholders are registered in `filter_action` with `enabled = false`. They have no n8n workflow yet. Their purpose is to complete the `JourneyStage` type and signal future intent. The subagent creates stub JSON files in `workflows/n8n/` marked clearly as placeholders.

### PRD Stage

**`prd.friction.flag`**
- Intent: Flag a contact experiencing product friction for CSM or product team review
- Compass signal domain: PRD
- `requires_hitl`: false (internal flag, reversible)
- Status: placeholder, `enabled = false`

**`prd.adoption.nudge`**
- Intent: Send a targeted adoption nudge (tip, tutorial, or check-in) to a contact showing low product engagement
- Compass signal domain: PRD
- `requires_hitl`: true (external comms)
- Status: placeholder, `enabled = false`

### EXP Stage

**`exp.account.flag`**
- Intent: Flag an account as expansion-ready for AE or CSM review based on usage signals
- Compass signal domain: EXP
- `requires_hitl`: false (internal flag, reversible)
- Status: placeholder, `enabled = false`

---

## Database Migration

### `005_workflow_integration.sql`

```sql
-- New stages: ONB, COM, PRD, EXP
-- (SUP and RET added in 004 — verify before running)

-- ACQ new actions
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('acq.lead.engage',      'ACQ', '<w-acq-1-webhook-id>', false, true,  'Send immediate WhatsApp acknowledgment to new inbound lead'),
  ('acq.lead.nurture',     'ACQ', '<w-acq-2-webhook-id>', false, true,  'Engage out-of-hours inbound contact with AI nurture conversation'),
  ('acq.contact.outreach', 'ACQ', '<w-acq-3-webhook-id>', true,  true,  'Send cold outreach via WhatsApp and email, sync to HubSpot');

-- SAL new action
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('sal.contact.message',  'SAL', '<w-sal-1-webhook-id>', false, true,  'Send pre-composed WhatsApp message to SAL stage contact');

-- ONB actions
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('onb.document.request', 'ONB', '<w-onb-1-webhook-id>', false, true,  'Initiate document collection request for onboarding contact'),
  ('onb.document.validate','ONB', '<w-onb-2-webhook-id>', false, true,  'Validate submitted document and update contact record in CRM');

-- COM action
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('com.content.publish',  'COM', '<w-com-1-webhook-id>', true,  true,  'Publish scheduled content to LinkedIn, Instagram, Threads');

-- PRD placeholders (disabled)
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('prd.friction.flag',    'PRD', 'PLACEHOLDER_WEBHOOK_PRD_01', false, false, 'PLACEHOLDER: Flag contact experiencing product friction for review'),
  ('prd.adoption.nudge',   'PRD', 'PLACEHOLDER_WEBHOOK_PRD_02', true,  false, 'PLACEHOLDER: Send adoption nudge to low-engagement contact');

-- EXP placeholder (disabled)
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('exp.account.flag',     'EXP', 'PLACEHOLDER_WEBHOOK_EXP_01', false, false, 'PLACEHOLDER: Flag account as expansion-ready for AE/CSM review');
```

Replace all `<w-xxx-webhook-id>` values with actual n8n webhook IDs after workflows are built and activated.

---

## Type System Updates

### `layers/orchestration/filter/src/shared/types.ts`

Add to `JourneyStage` union type:

```typescript
type JourneyStage = 'ACQ' | 'SAL' | 'ONB' | 'PRD' | 'SUP' | 'COM' | 'RET' | 'EXP';
```

This must be done before migration 005 is applied. If SUP and RET were already added in Phase 2, only ONB, PRD, COM, and EXP are new.

---

## Environment Variables

Add to `docker-compose.yml` filter service environment and `.env.example`:

```
COM_CONTENT_SHEET_ID=<google-sheets-id-for-content-calendar>
```

---

## Workflow Source Control

Export all adapted workflows from n8n UI after building and activating them. Follow naming convention from `workflows/n8n/README.md`:

| File | Status |
|---|---|
| `workflows/n8n/acq.lead.engage.json` | Export after build |
| `workflows/n8n/acq.lead.nurture.json` | Export after build |
| `workflows/n8n/acq.contact.outreach.json` | Export after build |
| `workflows/n8n/sal.contact.message.json` | Export after build |
| `workflows/n8n/onb.document.request.json` | Export after build |
| `workflows/n8n/onb.document.validate.json` | Export after build |
| `workflows/n8n/com.content.publish.json` | Export after build |
| `workflows/n8n/prd.friction.flag.json` | Stub file — mark as PLACEHOLDER |
| `workflows/n8n/prd.adoption.nudge.json` | Stub file — mark as PLACEHOLDER |
| `workflows/n8n/exp.account.flag.json` | Stub file — mark as PLACEHOLDER |

Placeholder stub files must include a top-level `"status": "placeholder — no workflow built"` field and use the exact placeholder webhook ID strings from migration 005 so they can be traced.

---

## Deferred Workflow Tracking

Add the following to `workflows/n8n/DEFERRED.md` (new file) so deferred workflows are not forgotten:

| Workflow | Original File | Deferred To | Reason |
|---|---|---|---|
| WhatsApp Decision Engine | `CX_ENGINE_WhatsApp_Decision_Engine_v1.json` | Phase 4 | Contains inline decision agent — violates cognitive/orchestration separation |
| OutOfHours Handoff path | `CX_ENGINE_OutOfHours_Engine_v1.json` (SAL branch) | Phase 2.5 follow-up | `SalesHandoff` node is a dead end — needs CRM write before activation |

---

## Implementation Sequence

```
1. Update JourneyStage type (types.ts)            ← no dependencies
2. Build and adapt workflows in n8n (W-ACQ-1 through W-COM-1)
3. Apply migration 005 (after all webhook IDs are known)
4. Create placeholder stub JSON files
5. Create DEFERRED.md
6. Export all live workflows to source control
7. Add COM_CONTENT_SHEET_ID to env
8. Verify: each active stage has at least one enabled action in filter_action
9. Verify: PRD and EXP are present but disabled
10. Verify: JourneyStage type matches all stages in filter_action
```

---

## Acceptance Criteria

- [ ] `JourneyStage` type includes all 8 stages: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP
- [ ] Migration 005 applied — all 10 new actions present in `filter_action`
- [ ] PRD and EXP actions present with `enabled = false`
- [ ] All 7 live workflows exported to `workflows/n8n/` with correct naming
- [ ] 3 placeholder stub JSON files present with PLACEHOLDER webhook IDs
- [ ] `DEFERRED.md` created and documents both deferred workflows
- [ ] `acq.contact.outreach` and `com.content.publish` route through HITL correctly
- [ ] No workflow in `filter_action` retains inline compliance gate logic
- [ ] TypeScript compilation passes with no errors after type update
- [ ] `COM_CONTENT_SHEET_ID` documented in `.env.example`