# RFC: Phase 3 — A3 Workflow Expansion (ONB + PRD)

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** Replace ONB placeholder coverage with full signal-grounded workflows, activate PRD placeholders with real n8n workflows, and extend the cognitive layer toolset for both stages. CRM: HubSpot only.

---

## Executive Summary

ONB currently has two actions registered (`onb.document.request`, `onb.document.validate`) that cover only one narrow cause: document collection friction. The Compass framework defines 7 ONB signals across 3 causes (FRC, CLR, CAP). PRD has two disabled placeholders covering friction and adoption — the framework defines 8 PRD signals across 3 causes (FRC, CAP, CST).

This RFC grounds both stages in the full Compass signal vocabulary, defines new workflows for the high-severity signals that warrant automated intervention, and extends the cognitive layer so the agent can reason across the full ONB and PRD cause landscape.

---

## Signal Analysis: Which Signals Warrant Automated Action

Not every Compass signal should produce an automated workflow. The filter architecture executes actions on individual contacts — signals that are structural/product-level (e.g. `PRD_CST_02` bugs, `PRD_CAP_02` feature requests) belong to a product feedback loop, not a per-contact intervention engine. The selection criterion is: **does acting on this signal for a specific contact produce a measurable outcome?**

### ONB Signals — Severity and Actionability

| Signal ID    | Name                      | Severity | Cause | Automated? | Reasoning                                                                       |
| ------------ | ------------------------- | -------- | ----- | ---------- | ------------------------------------------------------------------------------- |
| `ONB_FRC_01` | abandoned setup           | 0.7      | FRC   | ✅ Yes     | Detectable via HubSpot lifecycle stage stall; per-contact intervention possible |
| `ONB_FRC_02` | complaints about effort   | 0.8      | FRC   | ✅ Yes     | High severity; warrants direct CSM outreach                                     |
| `ONB_CLR_01` | confused about next steps | 0.7      | CLR   | ✅ Yes     | Detectable via help article views spike; checklist nudge is a concrete action   |
| `ONB_CAP_01` | unable to complete setup  | 0.6      | CAP   | ✅ Yes     | Warrants white-glove or technical assist flag                                   |
| `ONB_CAP_02` | technical blockers        | 0.7      | CAP   | ✅ Yes     | High severity; escalate to technical team                                       |

The existing `onb.document.request` and `onb.document.validate` cover a subset of `ONB_FRC` (process friction). They remain registered and are not replaced — they are complemented by the new actions below.

### PRD Signals — Severity and Actionability

| Signal ID    | Name                       | Severity | Cause | Automated? | Reasoning                                                 |
| ------------ | -------------------------- | -------- | ----- | ---------- | --------------------------------------------------------- |
| `PRD_FRC_01` | task abandonment           | 0.8      | FRC   | ✅ Yes     | High severity; per-contact nudge or CSM flag              |
| `PRD_FRC_02` | low usage of core features | 0.9      | FRC   | ✅ Yes     | Critical severity; adoption campaign trigger              |
| `PRD_CAP_01` | workarounds used           | 0.7      | CAP   | ✅ Yes     | Detectable; in-app feature highlight or CSM education     |
| `PRD_CAP_02` | feature requests           | 0.8      | CAP   | ⚠️ Partial | Log to HubSpot for product team; no direct contact action |
| `PRD_CST_01` | variable performance       | 0.5      | CST   | ❌ No      | System-level, not contact-level                           |
| `PRD_CST_02` | bugs                       | 0.6      | CST   | ❌ No      | Engineering concern, not a per-contact action             |

`PRD_CAP_02` (feature requests) is a special case — the action is to log the signal enriched with context to HubSpot for the product team, not to intervene with the contact directly.

---

## New Action IDs

Following the `stage.resource.verb` convention:

### ONB Actions

| Action ID             | Stage | Signal(s)              | Description                                                                               | requires_hitl |
| --------------------- | ----- | ---------------------- | ----------------------------------------------------------------------------------------- | ------------- |
| `onb.contact.nudge`   | ONB   | ONB_FRC_01, ONB_CLR_01 | Send a re-engagement nudge to contact who abandoned setup or is confused about next steps | false         |
| `onb.contact.assist`  | ONB   | ONB_FRC_02, ONB_CAP_01 | Send white-glove assist offer — CSM-authored message offering direct help                 | true          |
| `onb.ticket.escalate` | ONB   | ONB_CAP_02             | Escalate technical blocker to technical support queue in HubSpot                          | false         |

**HITL rationale:**

- `onb.contact.nudge` — templated message, low-risk, reversible in effect
- `onb.contact.assist` — personalized CSM outreach, represents a commitment of human time, warrants approval
- `onb.ticket.escalate` — internal HubSpot operation, fully reversible

### PRD Actions

| Action ID             | Stage | Signal(s)              | Description                                                                                 | requires_hitl |
| --------------------- | ----- | ---------------------- | ------------------------------------------------------------------------------------------- | ------------- |
| `prd.contact.nudge`   | PRD   | PRD_FRC_01, PRD_FRC_02 | Send adoption nudge — targeted tip or tutorial based on signal cause code                   | false         |
| `prd.contact.educate` | PRD   | PRD_CAP_01             | Send feature education message — highlight underused feature relevant to contact's use case | false         |
| `prd.feedback.log`    | PRD   | PRD_CAP_02             | Log enriched feature request signal to HubSpot product feedback pipeline                    | false         |

**HITL rationale:**

- `prd.contact.nudge` and `prd.contact.educate` — templated, low-risk, no irreversible external action
- `prd.feedback.log` — internal CRM write only, no contact-facing action

**Replacing placeholders:** `prd.friction.flag` and `prd.adoption.nudge` registered in migration 006 are superseded by the above. Migration 007 should update these rows via `ON CONFLICT DO UPDATE` rather than inserting new ones, with the exception of `enabled` which must not be overwritten.

---

## Workflow Contracts

All workflows receive the standard filter dispatch payload:

```json
{
  "action_id": "onb.contact.nudge",
  "stage": "ONB",
  "session_id": "sess_abc123",
  "contact_id": "CID_12345",
  "signal_id": "ONB_FRC_01",
  "signal_severity": 0.7,
  "cause_code": "ONB-FRC",
  "interventions": ["INT_ONB_FRC_01_A", "INT_ONB_FRC_01_B", "INT_ONB_FRC_01_C"],
  "payload": { ... },
  "meta": { "triggered_by": "..." }
}
```

### W-ONB-3: `onb.contact.nudge`

**Signals:** `ONB_FRC_01` (abandoned setup, severity 0.7), `ONB_CLR_01` (confused about next steps, severity 0.7)

**Logic:**

1. Read `contact_id`, `signal_id`, `cause_code` from filter payload
2. Branch on `cause_code`:
   - `ONB-FRC`: send "We noticed you haven't completed your setup" re-engagement message via WhatsApp/email
   - `ONB-CLR`: send onboarding checklist reminder with direct link to next step
3. Update HubSpot contact: add tag `onb-nudge-sent`, set `last_nudge_at` to now
4. Return `200 OK`

**Note:** Message templates must be pre-defined per `cause_code`. The cognitive layer selects the action; the workflow selects the template based on cause. This is the correct division — template selection is execution logic, not reasoning.

### W-ONB-4: `onb.contact.assist`

**Signals:** `ONB_FRC_02` (complaints about effort, severity 0.8), `ONB_CAP_01` (unable to complete setup, severity 0.6)

**Logic (executes after HITL approval):**

1. Read `contact_id`, `signal_id`, `meta.triggered_by` from filter payload
2. Send CSM-authored direct message via WhatsApp: "Hi [name], I noticed you might need some help with your setup — I'd like to personally help you get started."
3. Update HubSpot: create task assigned to CSM owner — "Follow up: white-glove assist for [contact_id]", priority high
4. Tag contact: `onb-assist-offered`
5. Return `200 OK`

**Requires HITL** — sends a personalized message in the CSM's voice. Operator confirms before sending.

### W-ONB-5: `onb.ticket.escalate`

**Signal:** `ONB_CAP_02` (technical blockers, severity 0.7)

**Logic:**

1. Read `contact_id`, `signal_severity`, `payload.blocker_description` from filter payload
2. Create HubSpot ticket: title "Technical onboarding blocker — [contact_id]", pipeline = support, priority = high
3. Associate ticket to contact record
4. Add note: "Escalated by Xnoria — signal `ONB_CAP_02`, severity `{{signal_severity}}`"
5. Return `200 OK`

### W-PRD-1: `prd.contact.nudge`

**Signals:** `PRD_FRC_01` (task abandonment, severity 0.8), `PRD_FRC_02` (low usage of core features, severity 0.9)

**Logic:**

1. Read `contact_id`, `signal_id`, `cause_code`, `interventions` from filter payload
2. Branch on `signal_id`:
   - `PRD_FRC_01`: send "You left something unfinished" re-engagement tip with relevant feature link
   - `PRD_FRC_02`: send adoption campaign trigger — enroll in HubSpot email sequence `prd-adoption-series`
3. Update HubSpot contact: tag `prd-nudge-sent`, log `last_prd_nudge_at`
4. Return `200 OK`

### W-PRD-2: `prd.contact.educate`

**Signal:** `PRD_CAP_01` (workarounds used, severity 0.7)

**Logic:**

1. Read `contact_id`, `signal_id`, `payload.feature_area` from filter payload
2. Send targeted education message: "Did you know [feature] can handle [use case]?" via WhatsApp
3. Update HubSpot: tag `prd-education-sent`, create task for CSM "Check in on feature adoption for [contact_id]" due in 7 days
4. Return `200 OK`

### W-PRD-3: `prd.feedback.log`

**Signal:** `PRD_CAP_02` (feature requests, severity 0.8)

**Logic:**

1. Read `contact_id`, `signal_id`, `payload.feature_request`, `signal_severity` from filter payload
2. Create HubSpot deal/ticket in product feedback pipeline: title = feature request summary, associate to contact
3. Add enriched note: signal ID, severity, interventions from Compass, contact context
4. Return `200 OK`

No contact-facing action. Internal logging only.

---

## Cognitive Layer: Tool Definitions

**File to modify:** `layers/cognitive/src/tools/definitions.ts`

Six new tool definitions. Each references the specific Compass signals that should trigger it and the severity thresholds the agent should apply.

### `onb.contact.nudge`

```
Description: Send a re-engagement nudge to a contact who has stalled in onboarding.
Use when: signal_id is ONB_FRC_01 OR ONB_CLR_01, signal_severity >= 0.6.
Do not use if: the contact has already received a nudge in the last 48 hours (check meta).
Parameters: contact_id, signal_id, cause_code, interventions
```

### `onb.contact.assist`

```
Description: Offer direct CSM white-glove assistance to a contact blocked in onboarding.
Use when: signal_id is ONB_FRC_02 OR ONB_CAP_01, signal_severity >= 0.6.
Prefer over nudge when: signal_severity >= 0.8 or contact has already received a nudge.
Requires HITL: true.
Parameters: contact_id, signal_id, signal_severity
```

### `onb.ticket.escalate`

```
Description: Escalate a technical onboarding blocker to the support queue.
Use when: signal_id is ONB_CAP_02, signal_severity >= 0.6.
Parameters: contact_id, signal_id, signal_severity, blocker_description (from payload)
```

### `prd.contact.nudge`

```
Description: Send an adoption nudge to a contact showing low product engagement.
Use when: signal_id is PRD_FRC_01 OR PRD_FRC_02, signal_severity >= 0.7.
Note: PRD_FRC_02 has critical severity (0.9) — always act on this signal.
Parameters: contact_id, signal_id, cause_code, interventions
```

### `prd.contact.educate`

```
Description: Send a targeted feature education message to a contact using workarounds.
Use when: signal_id is PRD_CAP_01, signal_severity >= 0.6.
Parameters: contact_id, signal_id, feature_area (from payload)
```

### `prd.feedback.log`

```
Description: Log an enriched feature request signal to the product feedback pipeline in HubSpot.
Use when: signal_id is PRD_CAP_02, signal_severity >= 0.7.
Note: No contact-facing action — this is a logging operation only.
Parameters: contact_id, signal_id, signal_severity, feature_request (from payload), interventions
```

---

## Database Migration

### `007_onb_prd_actions.sql`

```sql
-- ONB new actions
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('onb.contact.nudge',    'ONB', '<w-onb-3-webhook-id>', false, true, 'Send re-engagement nudge to stalled onboarding contact'),
  ('onb.contact.assist',   'ONB', '<w-onb-4-webhook-id>', true,  true, 'Offer white-glove CSM assist to blocked onboarding contact'),
  ('onb.ticket.escalate',  'ONB', '<w-onb-5-webhook-id>', false, true, 'Escalate technical onboarding blocker to support queue')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description;

-- PRD actions (replacing placeholders from migration 006)
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES
  ('prd.friction.flag',    'PRD', '<w-prd-1-webhook-id>', false, true, 'Send adoption nudge to low-engagement contact — replaces placeholder'),
  ('prd.adoption.nudge',   'PRD', '<w-prd-2-webhook-id>', false, true, 'Send feature education message to contact using workarounds — replaces placeholder'),
  ('prd.feedback.log',     'PRD', '<w-prd-3-webhook-id>', false, true, 'Log enriched feature request to HubSpot product pipeline')
ON CONFLICT (action_id) DO UPDATE SET
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  requires_hitl   = EXCLUDED.requires_hitl,
  description     = EXCLUDED.description;
```

**Note on PRD placeholder renaming:** `prd.friction.flag` and `prd.adoption.nudge` were registered as placeholders in migration 006. Rather than introducing new action IDs that would orphan those rows, this migration updates them in place. The `enabled` field is intentionally excluded from the update — if they were manually enabled or disabled, that state is preserved.

`prd.feedback.log` is a net-new action ID with no prior placeholder.

---

## Workflow Source Control

| File                                     | Status                                                |
| ---------------------------------------- | ----------------------------------------------------- |
| `workflows/n8n/onb.contact.nudge.json`   | Export after build                                    |
| `workflows/n8n/onb.contact.assist.json`  | Export after build                                    |
| `workflows/n8n/onb.ticket.escalate.json` | Export after build                                    |
| `workflows/n8n/prd.contact.nudge.json`   | Export after build — replaces prd.friction.flag stub  |
| `workflows/n8n/prd.contact.educate.json` | Export after build — replaces prd.adoption.nudge stub |
| `workflows/n8n/prd.feedback.log.json`    | Export after build                                    |

Update stub files `prd.friction.flag.json` and `prd.adoption.nudge.json` with a `"status": "superseded — see prd.contact.nudge and prd.contact.educate"` field rather than deleting them, so the git history is coherent.

---

## Tool Recommendation Notes (for future phase evaluation)

The following tools are recommended for evaluation before PRD and ONB signal detection becomes more sophisticated. These are not required for A3 — HubSpot is sufficient. They are candidates for B3 (MCP context grounding) and the signal monitoring infrastructure.

**Onboarding platforms:**

- **Appcues** — in-app onboarding flows, step completion tracking, maps directly to `ONB_FRC` and `ONB_CLR` indicators (`time_to_first_value`, `drop_off_rate`, `help_article_views_in_onboarding`). Native HubSpot integration.
- **Userflow** — lighter alternative to Appcues, better suited for smaller teams; webhooks on step abandonment map cleanly to `ONB_FRC_01` trigger conditions.

**Product analytics:**

- **PostHog** — open-source, self-hostable, tracks `feature_adoption_rate` and task completion directly. Maps to `PRD_FRC_01`, `PRD_FRC_02`, `PRD_CAP_01` indicators. Self-hosted option fits the architecture's control philosophy.
- **Mixpanel** — stronger for `feature_request_volume` and funnel analysis (`PRD_CAP_02`). Better reporting than PostHog but hosted-only.

**Why these matter for B3:** When MCP context grounding is scoped, these tools are the natural signal sources that would feed structured `CXEvent` payloads into the cognitive layer — replacing the current pattern where signals must be manually constructed or inferred from CRM tags alone. Choosing a tool before B3 is scoped will determine the shape of the MCP integration.

---

## Implementation Sequence

```
1. Add 6 tool definitions to cognitive/src/tools/definitions.ts   ← no dependencies
2. Build W-ONB-3 (onb.contact.nudge) in n8n
3. Build W-ONB-4 (onb.contact.assist) in n8n
4. Build W-ONB-5 (onb.ticket.escalate) in n8n
5. Build W-PRD-1 (prd.contact.nudge) in n8n
6. Build W-PRD-2 (prd.contact.educate) in n8n
7. Build W-PRD-3 (prd.feedback.log) in n8n
8. Apply migration 007 (after all 6 webhook IDs are known)
9. Update prd placeholder stub files to "superseded" status
10. Export all 6 workflows to workflows/n8n/
11. Test: synthetic ONB and PRD CXEvents end-to-end
```

---

## Acceptance Criteria

- [ ] 6 new tool definitions added to cognitive layer, TypeScript compilation passes
- [ ] 6 new workflows built in n8n and exported to source control
- [ ] Migration 007 applied — all new actions present in `filter_action` with correct `enabled` and `requires_hitl` values
- [ ] PRD placeholder stubs updated to "superseded" status in source control
- [ ] Synthetic test: `CXEvent` with `signal_id: ONB_FRC_02`, `signal_severity: 0.8` → agent selects `onb.contact.assist` → routes through HITL
- [ ] Synthetic test: `CXEvent` with `signal_id: PRD_FRC_02`, `signal_severity: 0.9` → agent selects `prd.contact.nudge` → executes directly
- [ ] Synthetic test: `CXEvent` with `signal_id: PRD_CAP_02` → agent selects `prd.feedback.log` → HubSpot ticket created, no contact message sent
- [ ] No workflow retains inline compliance gate logic
- [ ] Tool recommendation notes added to AGENTS.md under B3 roadmap item
