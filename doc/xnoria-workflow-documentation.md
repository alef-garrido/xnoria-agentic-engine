# Xnoria — Workflow Layer Documentation
## How the Engine Acts Across the Customer Journey

**Audience:** Operators, implementation partners, and technical stakeholders who need to understand what Xnoria does, when, and why.

**Last updated:** April 2026 | **Engine version:** Phase 3 complete

---

## What the Workflow Layer Is

Xnoria's workflow layer is the execution arm of the engine. When the cognitive layer decides that a contact needs an intervention — a nudge, an escalation, a message, a CRM update — it doesn't act directly. It passes the decision to a filter that checks permissions, then dispatches to a specific n8n workflow that carries out the action.

Each workflow is a discrete, auditable unit. It receives a structured payload from the engine, executes exactly one action, updates the CRM, and returns a status. Nothing more.

The workflows are organized by customer journey stage — from first awareness through acquisition, sales, onboarding, product adoption, support, communication, and retention. Together they form the engine's complete action repertoire across the customer lifecycle.

---

## Requirements

### Infrastructure

| Component | Purpose | Where it runs |
|---|---|---|
| n8n | Workflow execution engine | `localhost:5678` (Docker container) |
| HubSpot | CRM — contacts, tasks, sequences, tickets | Cloud (HubSpot API) |
| Meta WhatsApp API | Outbound messaging channel | Cloud (Graph API) |
| Gmail | Cold outreach email channel | Cloud (Gmail API) |
| Google Sheets | Content calendar for COM publishing | Cloud (Sheets API) |
| LinkedIn / Instagram / Threads | Social media publishing | Cloud (respective APIs) |
| Xnoria Filter Service | Allowlist gate and audit log | `localhost:3000` (Docker container) |

### Credentials required in n8n

- **Meta WhatsApp API** — `httpHeaderAuth` with Bearer token, Phone Number ID in env
- **HubSpot** — OAuth or Private App token
- **Gmail** — OAuth credentials
- **Google Sheets** — Service Account or OAuth
- **LinkedIn** — OAuth
- **Instagram / Threads** — Meta Graph API token

### Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | All WhatsApp workflows | Identifies the sending number |
| `COM_CONTENT_SHEET_ID` | `com.content.publish` | Google Sheets content calendar ID |
| `N8N_BASE_URL` | Filter service | Internal URL for webhook dispatch |

---

## How a Workflow Gets Triggered

Every workflow (except `com.content.publish`) follows the same trigger pattern:

```
1. A signal is detected for a contact
   (from HubSpot, PostHog, Telegram, or manual injection)

2. The cognitive layer reasons about the signal
   → selects the appropriate action
   → checks contact memory for prior interventions

3. The filter service validates the action
   → confirms it's on the allowlist
   → checks if human approval is required (HITL)
   → dispatches to the n8n webhook URL

4. The n8n workflow executes
   → reads contact data from the payload
   → performs the action (CRM update, message, task, etc.)
   → returns 200 OK or error to the filter

5. The filter logs the outcome
   → every attempt is written to filter_log regardless of result

6. The cognitive layer records the session
   → written to Engram contact memory for future reasoning
```

Workflows that require human approval pause at step 3 — the filter queues them as `pending_hitl`, sends a Telegram notification to the operator, and waits. The operator approves or rejects from the dashboard `/hitl` page. Approved actions continue from step 4.

---

## The Journey

---

### Stage 1 — ACQ: Acquisition

*The contact has just discovered the business and taken a first action. Speed and clarity matter most here.*

---

#### `acq.lead.engage` — Immediate Lead Acknowledgment

**What it does:** The moment a new contact opts in, this workflow sends an immediate WhatsApp acknowledgment. It's the engine's "we see you" signal — establishing presence before any human follow-up.

**Triggered by:** New inbound opt-in event. Compass signals: `ACQ_VIS_*`, `ACQ_CLR_*`, `ACQ_TRU_*` (severity varies).

**Requires human approval:** No

**Apps involved:**
- Meta WhatsApp API — sends acknowledgment message
- HubSpot — reads contact phone number from payload

**Input payload:**
```json
{
  "contact_id": "CID_12345",
  "stage": "ACQ",
  "signal_id": "ACQ_VIS_01",
  "payload": {
    "phone": "+521234567890",
    "name": "Juan Pérez"
  }
}
```

**What happens inside n8n:**
1. Reads `contact_id`, `phone`, `name` from filter payload
2. Sends WhatsApp acknowledgment: "Hi [name], thanks for reaching out — we'll be with you shortly."
3. Logs to `cxEngine_Analytics_Metrics_v1`

**Output:** WhatsApp message delivered. Contact tagged in HubSpot.

**What this means for the operator:** The contact receives a response in seconds, not hours. First-response time is one of the strongest predictors of conversion in high-intent inbound contexts.

---

#### `acq.lead.nurture` — Out-of-Hours AI Conversation

**What it does:** When a contact reaches out outside business hours, this workflow engages them with an AI-powered conversation — asking for their name, understanding their need, keeping them warm until the team is available.

**Triggered by:** Inbound contact outside business hours. The cognitive layer detects the timing context and selects this action over `sal.lead.handoff`.

**Requires human approval:** No

**Apps involved:**
- Gemini (via n8n LangChain node) — AI nurture conversation
- Meta WhatsApp API — bidirectional messaging

**Input payload:**
```json
{
  "contact_id": "CID_12345",
  "stage": "ACQ",
  "payload": {
    "message": "Hola, quiero información sobre sus servicios",
    "phone": "+521234567890"
  }
}
```

**What happens inside n8n:**
1. Receives inbound message from filter payload
2. Initializes Gemini agent with nurture prompt: "Hola, gracias por escribirnos fuera de horario..."
3. Maintains conversation memory via `memoryBufferWindow`
4. Responds via WhatsApp

**Output:** Active AI conversation with the contact until business hours resume.

**What this means for the operator:** No lead goes cold overnight. The AI collects context (name, need, urgency) so the sales team starts the next morning with qualified, warm contacts.

---

#### `acq.contact.outreach` — Cold Outreach Sequence

**What it does:** For contacts identified as cold outreach targets, this workflow sends a coordinated first touch — WhatsApp message followed by email — then syncs the contact to HubSpot as a CRM record.

**Triggered by:** Outreach signal for a contact in the ACQ stage. Compass signals: `ACQ_TRU_01`, `ACQ_TRU_02`.

**Requires human approval:** Yes — external messages to cold contacts are irreversible

**Apps involved:**
- Meta WhatsApp API — first touch message
- Gmail — follow-up email
- HubSpot — contact creation/sync with `cxengine_source: cold_outreach` tag

**Input payload:**
```json
{
  "contact_id": "CID_12345",
  "stage": "ACQ",
  "signal_id": "ACQ_TRU_02",
  "signal_severity": 0.6,
  "payload": {
    "phone": "+521234567890",
    "email": "juan@empresa.com",
    "name": "Juan Pérez"
  }
}
```

**What happens inside n8n:**
1. Sends WhatsApp template message to contact
2. Waits 5 seconds
3. Sends Gmail introduction email
4. Upserts contact in HubSpot with outreach metadata
5. Logs metrics to `cxEngine_Analytics_Metrics_v1`

**Output:** Contact receives WhatsApp + email. HubSpot record created with source tag.

**What this means for the operator:** Multi-channel first contact executed consistently without manual effort. Every outreach is logged and traceable.

---

### Stage 2 — SAL: Sales Experience

*The contact is evaluating the offer. Clarity, trust, and speed of follow-up determine the outcome.*

---

#### `sal.sequence.enroll` — Sales Sequence Enrollment

**What it does:** Enrolls a qualified contact into a predefined HubSpot sales sequence — a series of timed touchpoints that nurture the contact toward a decision.

**Triggered by:** Lead scoring complete, contact ready for sales follow-up. Compass signals: `SAL_CLR_*`, `SAL_VAL_*`.

**Requires human approval:** No

**Apps involved:**
- HubSpot — sequence enrollment API

**Input payload:**
```json
{
  "contact_id": "CID_12345",
  "stage": "SAL",
  "payload": {
    "sequence_id": "SEQ_001",
    "reason": "High lead score, organic source"
  }
}
```

**Output:** Contact enrolled in HubSpot sequence. Sequence begins on its configured schedule.

---

#### `sal.contact.prioritize` — SDR Priority Flag

**What it does:** Flags a contact for immediate SDR (Sales Development Representative) follow-up and sends a WhatsApp notification directly to the contact signaling high intent recognition.

**Triggered by:** Strong buying signal detected. Compass signals: `SAL_TRU_01` (skepticism), `SAL_VAL_02` (weak conversion risk).

**Requires human approval:** Yes — sends external WhatsApp message and commits SDR time

**Apps involved:**
- HubSpot — priority flag and task creation
- Meta WhatsApp API — direct contact notification

**Output:** Contact flagged in HubSpot as high-priority. SDR assigned. Contact receives WhatsApp.

**What this means for the operator:** High-intent contacts are never missed in a busy queue. The engine surfaces them before they go cold.

---

#### `sal.contact.message` — Pre-Composed WhatsApp Send

**What it does:** Sends a pre-composed WhatsApp message to a SAL-stage contact. The message content is determined by the cognitive layer and passed in the payload — this workflow is a pure execution stub.

**Triggered by:** Agent decision to send a specific message. Compass signals: any SAL signal requiring direct communication.

**Requires human approval:** No

**Apps involved:**
- Meta WhatsApp API — message delivery

**Input payload:**
```json
{
  "contact_id": "CID_12345",
  "stage": "SAL",
  "payload": {
    "phone": "+521234567890",
    "message_content": "Hi Juan, I wanted to follow up on your question about pricing..."
  }
}
```

**Output:** WhatsApp message delivered to contact.

---

### Stage 3 — ONB: Onboarding

*The contact has become a customer. The onboarding experience determines whether they reach first value — or churn before they start.*

---

#### `onb.document.request` — Document Collection Initiation

**What it does:** When a customer is in a document-pending state, this workflow initiates the collection request — creating a HubSpot task and notifying the contact that documents are needed.

**Triggered by:** CRM webhook fires when contact reaches document-pending lifecycle stage. Compass signals: `ONB_FRC_01`, `ONB_FRC_02`.

**Requires human approval:** No

**Apps involved:**
- HubSpot — task creation, contact status update

**Output:** HubSpot task created. Contact notified of document requirement.

---

#### `onb.document.validate` — Document Submission Validation

**What it does:** Receives a document submission, validates that the required fields are present, and updates HubSpot with the result — approved or rejected.

**Triggered by:** Contact submits a document via the submission webhook.

**Requires human approval:** No

**Apps involved:**
- HubSpot — contact property update (`document_status: approved` or `document_status: rejected`)
- `cxEngine_Analytics_Metrics_v1` — submission logging

**Input (webhook body):**
```json
{
  "lead_id": "CID_12345",
  "document_type": "id_verification",
  "media_url": "https://..."
}
```

**Output:** HubSpot contact updated with document status. Validation result logged.

---

#### `onb.contact.nudge` — Re-Engagement Nudge

**What it does:** Sends a targeted re-engagement message to a contact who has stalled in onboarding. The message template is selected based on the Compass cause code — friction-related stalls get a setup reminder, clarity-related stalls get a checklist nudge.

**Triggered by:** Compass signals `ONB_FRC_01` (abandoned setup, severity 0.7) or `ONB_CLR_01` (confused about next steps, severity 0.7).

**Requires human approval:** No

**Cooldown:** Will not trigger if a nudge was sent in the last 48 hours (checked via Engram contact memory).

**Apps involved:**
- Meta WhatsApp API — nudge message delivery
- HubSpot — tag `onb-nudge-sent`, log `last_nudge_at`

**Input payload:**
```json
{
  "contact_id": "CID_12345",
  "stage": "ONB",
  "signal_id": "ONB_FRC_01",
  "signal_severity": 0.7,
  "cause_code": "ONB-FRC",
  "interventions": ["INT_ONB_FRC_01_A", "INT_ONB_FRC_01_B", "INT_ONB_FRC_01_C"]
}
```

**Output:** WhatsApp nudge delivered. HubSpot updated.

**What this means for the operator:** Onboarding stalls are detected and addressed automatically — without the CSM team manually monitoring every account.

---

#### `onb.contact.assist` — White-Glove CSM Assist

**What it does:** Sends a personal CSM-authored message offering direct help to a contact who is blocked or expressing frustration. Creates a high-priority HubSpot task for the CSM to follow up.

**Triggered by:** Compass signals `ONB_FRC_02` (complaints about effort, severity 0.8) or `ONB_CAP_01` (unable to complete setup, severity 0.6). Also triggered if a contact has already received a nudge and is still stuck.

**Requires human approval:** Yes — message is sent in the CSM's voice and commits human time

**Apps involved:**
- Meta WhatsApp API — personal outreach message
- HubSpot — high-priority CSM task, tag `onb-assist-offered`

**Output:** Contact receives personal message. CSM has a prioritized task.

**What this means for the operator:** The engine escalates appropriately. Low-severity stalls get automated nudges. High-severity blocks get human attention — but only after the engine has already identified and prioritized them.

---

#### `onb.ticket.escalate` — Technical Blocker Escalation

**What it does:** Creates a high-priority HubSpot support ticket for a contact experiencing a technical blocker during onboarding.

**Triggered by:** Compass signal `ONB_CAP_02` (technical blockers, severity 0.7).

**Requires human approval:** No

**Apps involved:**
- HubSpot — ticket creation in support pipeline, associated to contact record

**Output:** Support ticket created and assigned. Compass signal and severity logged in ticket notes.

---

### Stage 4 — PRD: Product Experience

*The customer is using the product. Adoption depth determines retention and expansion.*

---

#### `prd.friction.flag` → `prd.contact.nudge` — Adoption Nudge

**What it does:** Sends a targeted adoption nudge to a contact showing low product engagement. For task abandonment, the nudge is a re-engagement tip with a relevant feature link. For low core feature usage, the contact is enrolled in HubSpot's adoption email sequence.

**Triggered by:** Compass signals `PRD_FRC_01` (task abandonment, severity 0.8) or `PRD_FRC_02` (low usage of core features, severity 0.9 — always act).

**Requires human approval:** No

**Apps involved:**
- Meta WhatsApp API — re-engagement tip
- HubSpot — adoption sequence enrollment, tag `prd-nudge-sent`

**Output:** Contact receives adoption nudge or is enrolled in email sequence.

---

#### `prd.adoption.nudge` → `prd.contact.educate` — Feature Education

**What it does:** Sends a targeted feature education message to a contact who is using workarounds instead of native product features. Creates a 7-day CSM follow-up task to check on adoption.

**Triggered by:** Compass signal `PRD_CAP_01` (workarounds used, severity 0.7).

**Requires human approval:** No

**Apps involved:**
- Meta WhatsApp API — education message highlighting the relevant feature
- HubSpot — CSM task creation, tag `prd-education-sent`

**Output:** Contact learns about the feature they're working around. CSM follows up in 7 days.

---

#### `prd.feedback.log` — Feature Request Logging

**What it does:** Logs an enriched feature request signal to HubSpot's product feedback pipeline. No message is sent to the contact — this is an internal intelligence operation that ensures product feedback from customers reaches the product team with full context.

**Triggered by:** Compass signal `PRD_CAP_02` (feature requests, severity 0.7+).

**Requires human approval:** No

**Apps involved:**
- HubSpot — ticket/deal creation in product feedback pipeline

**Output:** Enriched feature request logged with signal ID, severity, Compass interventions, and contact context.

**What this means for the operator:** Product feedback is never lost in a chat log. Every signal the engine detects is captured with enough context for the product team to act on it.

---

### Stage 5 — SUP: Support & Service

*Something has gone wrong. Resolution speed and consistency determine whether the customer stays.*

---

#### `sup.ticket.escalate` — Support Ticket Escalation

**What it does:** Escalates an unresolved support ticket to the senior support queue. Updates the ticket priority, assigns it to the escalation queue, and adds a note with the triggering signal and severity.

**Triggered by:** Compass signals `SUP_RES_02` (escalations, severity 0.6) or `SUP_CAP_01` (unresolved issues, severity 0.7), when the ticket has been open more than 48 hours.

**Requires human approval:** No

**Apps involved:**
- HubSpot — ticket priority update, queue reassignment, note addition

**Output:** Ticket escalated. Escalation logged with signal context.

---

#### `sup.contact.notify` — Resolution Update to Contact

**What it does:** Sends a resolution status update directly to the contact via WhatsApp. The operator reviews the message before it goes out.

**Triggered by:** Compass signals `SUP_CAP_02` (repeated contacts, severity 0.8) or when the operator has a resolution to communicate.

**Requires human approval:** Yes — external communication about a support resolution must be verified before sending

**Apps involved:**
- Meta WhatsApp API — resolution update message
- HubSpot — delivery status logged

**Output:** Contact informed of resolution status. Delivery logged.

---

### Stage 6 — COM: Communication & Engagement

*Ongoing relationship maintenance. Consistency and relevance prevent disengagement.*

---

#### `com.content.publish` — Scheduled Social Media Publishing

**What it does:** Reads scheduled content from a Google Sheets content calendar and publishes to LinkedIn, Instagram, and Threads simultaneously. This is the only workflow in the engine that runs on an autonomous schedule — it also accepts on-demand dispatch from the cognitive layer.

**Triggered by:** Schedule (hourly check) OR cognitive layer dispatch for on-demand publishing.

**Requires human approval:** Yes — brand publishing is irreversible and high-visibility

**Apps involved:**
- Google Sheets — reads content calendar (`COM_CONTENT_SHEET_ID`)
- LinkedIn — post publication
- Instagram (Meta Graph API) — post publication
- Threads — post publication
- Google Sheets — marks published rows as `Posted`

**Input (from content calendar):**

| Column | Description |
|---|---|
| Content | Post text |
| ImageUrl | Optional image URL |
| Status | `Scheduled` → `Posted` after publish |

**Output:** Content published to all three platforms simultaneously. Calendar row status updated.

**What this means for the operator:** Consistent social presence without manual scheduling. The content calendar is the single source of truth — update it, and the engine handles distribution.

---

### Stage 7 — RET: Retention & Loyalty

*The customer is at risk of leaving. Early detection and the right intervention prevent churn.*

---

#### `ret.contact.winback` — Churn Prevention Sequence

**What it does:** Enrolls an at-risk contact in a winback sequence — a targeted re-engagement campaign designed to reinforce value and prevent cancellation. Tags the contact with the Compass cause code for personalization.

**Triggered by:** Compass signals `RET_VAL_01` (downgrades, severity 0.9), `RET_REL_01` (silent churners, severity 0.9), or `RET_TRU_01` (broken promises, severity 0.9). All critical severity.

**Requires human approval:** Yes — sequence enrollment is irreversible, high-stakes

**Apps involved:**
- HubSpot — winback sequence enrollment, tags `ret-winback-active` and `cause:{cause_code}`

**Output:** Contact enrolled in winback sequence. Cause-specific tags applied for personalization.

**What this means for the operator:** The engine detects churn risk before the customer cancels. The HITL gate ensures the operator confirms the intervention is appropriate for this specific contact before the sequence begins.

---

#### `ret.account.flag` — CSM Churn Risk Flag

**What it does:** Flags an account for immediate CSM review due to detected churn risk. Sets `churn_risk: true` in HubSpot, assigns to the CSM, and adds a note with signal context.

**Triggered by:** Compass signals `RET_VAL_02` (churn to cheaper option, severity 0.4+), `RET_REL_02` (no relationship with account manager, severity 0.4+), or `RET_TRU_02` (reputational damage, severity 0.4+). Lower threshold than winback — first step before enrolling in sequence.

**Requires human approval:** No

**Apps involved:**
- HubSpot — churn risk flag, CSM assignment, note with signal severity

**Output:** Account flagged. CSM alerted. Signal context preserved in CRM note.

---

## How Workflows Connect to Each Other

Most workflows are independent — one trigger, one action, one outcome. But several connect in logical escalation chains:

```
ACQ stage escalation path:
acq.lead.engage (immediate ack)
  → if out-of-hours: acq.lead.nurture (AI conversation)
  → if cold list: acq.contact.outreach (WhatsApp + email, HITL)

ONB stage escalation path:
onb.document.request → onb.document.validate (document loop)

onb.contact.nudge (first stall — automated)
  → if still stuck or severity >= 0.8: onb.contact.assist (HITL, personal)
  → if technical: onb.ticket.escalate (support queue)

PRD stage escalation path:
prd.friction.flag / prd.contact.nudge (low engagement — automated)
  → if workarounds: prd.adoption.nudge / prd.contact.educate (feature education)
  → if feature request: prd.feedback.log (product pipeline, no contact action)

RET stage escalation path:
ret.account.flag (lower threshold — CSM awareness, no HITL)
  → if critical severity: ret.contact.winback (sequence enrollment, HITL)
```

The cognitive layer manages these escalation decisions using Engram contact memory — it knows what was already tried before selecting the next action.

---

## Shared Infrastructure Workflows

Two utility workflows are called internally by the CX engine workflows:

**`WF_Compliance_Guardrails_v1`** (`bitZo2xXZTixg08D`) — Checks whether a contact is allowed to receive messages based on opt-in status, time of day, and regional compliance rules. Returns `{ allowed: boolean, reason: string }`. Called by legacy workflows before the filter architecture was established — new workflows rely on the filter allowlist instead.

**`cxEngine_Analytics_Metrics_v1`** (`2fDEdMAcGDxxusMp`) — Secondary logging sink. Receives event metadata and logs to an analytics store. The filter's `filter_log` table is the authoritative audit record — this is supplementary.

---

## HITL — Actions That Require Human Approval

The following actions pause for operator review before executing. The operator receives a Telegram notification and approves or rejects from the dashboard `/hitl` page.

| Action | Why HITL is required |
|---|---|
| `acq.contact.outreach` | External messages to cold contacts — legally and reputationally irreversible |
| `sal.contact.prioritize` | Commits SDR time and sends external WhatsApp |
| `onb.contact.assist` | Sends message in CSM's voice — personal commitment |
| `sup.contact.notify` | External resolution communication — must be accurate |
| `com.content.publish` | Brand publishing — high-visibility, irreversible |
| `ret.contact.winback` | Sequence enrollment — irreversible, legally sensitive for some segments |
| `exp.contact.upgrade` | *(Phase 4)* Upgrade prompt or ROI case — commits commercial intent |
| `exp.relationship.build` | *(Phase 4)* Assigns human resources |

---

## Action Inventory by Stage

| Action ID | Stage | HITL | Description |
|---|---|---|---|
| `acq.lead.engage` | ACQ | No | Immediate WhatsApp acknowledgment |
| `acq.lead.nurture` | ACQ | No | AI nurture conversation (out-of-hours) |
| `acq.contact.outreach` | ACQ | Yes | Cold outreach — WhatsApp + email + HubSpot |
| `sal.sequence.enroll` | SAL | No | HubSpot sequence enrollment |
| `sal.contact.prioritize` | SAL | Yes | SDR priority flag + WhatsApp |
| `sal.contact.message` | SAL | No | Pre-composed WhatsApp send |
| `onb.document.request` | ONB | No | Document collection initiation |
| `onb.document.validate` | ONB | No | Document validation + CRM update |
| `onb.contact.nudge` | ONB | No | Re-engagement nudge (48h cooldown) |
| `onb.contact.assist` | ONB | Yes | White-glove CSM assist |
| `onb.ticket.escalate` | ONB | No | Technical blocker → support ticket |
| `prd.friction.flag` | PRD | No | Adoption nudge for low engagement |
| `prd.adoption.nudge` | PRD | No | Feature education for workaround users |
| `prd.feedback.log` | PRD | No | Feature request → product pipeline |
| `sup.ticket.escalate` | SUP | No | Ticket escalation to senior queue |
| `sup.contact.notify` | SUP | Yes | Resolution update to contact |
| `com.content.publish` | COM | Yes | Social media publishing (autonomous + on-demand) |
| `ret.contact.winback` | RET | Yes | Winback sequence enrollment |
| `ret.account.flag` | RET | No | Churn risk flag for CSM |

---

## What the Engine Does Not Do

Understanding the boundaries is as important as understanding the capabilities:

- **The engine does not make decisions inside workflows.** All reasoning happens in the cognitive layer before dispatch. n8n workflows execute one predetermined action — they do not branch on business logic or call LLMs.
- **The engine does not bypass the filter.** Every action goes through `POST /filter/execute`. If an action is disabled in the allowlist manager, the workflow never runs.
- **The engine does not act on structural signals.** Brand consistency issues (`COM_CST_*`), product bugs (`PRD_CST_02`), and performance problems (`PRD_CST_01`) are not automated — they require editorial or engineering responses, not per-contact interventions.
- **The engine does not replace the CRM.** HubSpot is the system of record. Xnoria writes tags, tasks, notes, and sequence enrollments — it does not own contact data.
