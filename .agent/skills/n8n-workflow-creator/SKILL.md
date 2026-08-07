---
name: n8n-workflow-creator
description: >
  Use this skill whenever creating, modifying, or exporting n8n workflow JSON files for the Exnoria CX Intelligence Engine.
  Trigger: When user asks to build a new workflow, add a journey stage, register an action in the filter allowlist, or generate a workflow JSON for import into n8n.
license: Private — Exnoria / Oscar Armando Perez Garrido
metadata:
  author: aleflemat
  version: "1.1"
  scope: [workflows/n8n]
  auto_invoke: "Creating n8n workflows"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, n8n_mcp
---

## n8n MCP Integration

When working with n8n workflows, use the n8n MCP tools to manage the full lifecycle:

### Workflow Creation Flow

1. **Create workflow in n8n** — Use `n8n_workflow_create` to create a new workflow
2. **Add nodes programmatically** — Use `n8n_workflow_add_node` to add each node
3. **Connect nodes** — Use `n8n_workflow_connect_nodes` to wire connections
4. **Activate when ready** — Use `n8n_workflow_activate` only when fully tested

### MCP Tools Available

| Tool                      | Purpose                       | Use When                     |
| ------------------------- | ----------------------------- | ---------------------------- |
| `n8n_workflow_create`     | Create new workflow with name | Starting a new workflow      |
| `n8n_workflow_get`        | Get workflow by ID            | Retrieving existing workflow |
| `n8n_workflow_list`       | List all workflows            | Finding workflow IDs         |
| `n8n_workflow_update`     | Update workflow JSON          | Modifying existing workflow  |
| `n8n_workflow_delete`     | Delete workflow               | Removing deprecated workflow |
| `n8n_workflow_activate`   | Activate workflow             | Workflow is tested and ready |
| `n8n_workflow_deactivate` | Deactivate workflow           | Disabling for maintenance    |
| `n8n_workflow_execute`    | Execute workflow manually     | One-off test runs            |

### Activation Policy

**Only activate workflows when:**

- Workflow has been tested end-to-end (direct webhook + filter)
- filter_action entry exists and is enabled
- Tool definition exists in cognitive layer
- Response contract returns valid JSON

**Keep inactive when:**

- Still in development
- Pending filter registration
- Awaiting tool definition
- Placeholder stub (Phase 2.5 PRD/EXP)

### Publishing Pattern

```typescript
// 1. Create workflow (inactive)
const workflowId = await n8n_workflow_create({
  name: "W{N} - {ActionId}",
  active: false,
});

// 2. Add nodes
await n8n_workflow_add_node({
  workflow_id: workflowId,
  node: {/* node JSON */},
});

// 3. Connect
await n8n_workflow_connect_nodes({
  workflow_id: workflowId,
  connections: [/* connections JSON */],
});

// 4. Test thoroughly, then activate
await n8n_workflow_activate({ workflow_id: workflowId });
```

## When to Use

- Creating a new n8n workflow for a new action
- Exporting workflow JSON from n8n UI to source control
- Registering an action in the filter allowlist
- Adding a new journey stage (SUP, RET, ONB, PRD, COM, EXP)
- Modifying existing workflow contracts

## Critical Patterns

### Architecture Contract

```
Cognitive layer → POST /filter/execute → Filter service → n8n webhook → Workflow → filter_log
```

- Every workflow starts with a Webhook trigger node
- Every workflow ends with a Respond to Webhook node
- No workflow makes autonomous decisions — cognitive layer decides, n8n executes
- All date fields written to HubSpot use midnight UTC milliseconds, not ISO strings

### Filter API Endpoints (Phase 2)

| Method | Path                       | Description                  |
| ------ | -------------------------- | ---------------------------- |
| `GET`  | `/health`                  | Health check                 |
| `GET`  | `/filter/health`           | Aggregated per-stage metrics |
| `POST` | `/filter/execute`          | Execute an action            |
| `GET`  | `/filter/allowlist`        | List all actions             |
| `POST` | `/filter/hitl/:id/approve` | Approve HITL action          |
| `GET`  | `/filter/hitl/pending`     | List pending approvals       |

### Naming Conventions

| Type          | Pattern                       | Example                    |
| ------------- | ----------------------------- | -------------------------- |
| Action ID     | `{stage}.{resource}.{verb}`   | `sup.ticket.escalate`      |
| Webhook path  | action_id with dots → hyphens | `sup-ticket-escalate`      |
| Workflow name | `W{N} - {ActionId}`           | `W4 - Sup.ticket.escalate` |

Stage codes: `acq`, `sal`, `onb`, `prd`, `sup`, `com`, `ret`, `exp`

### HubSpot API Pattern

HubSpot v1 API returns properties as objects `{ value: "..." }`. Always use `.value` when reading:

```javascript
// WRONG
contact.properties?.email;

// CORRECT
contact.properties?.email?.value;
```

### Date Field Rules

HubSpot date picker fields require midnight UTC milliseconds:

```javascript
// CORRECT
new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();
```

### Filter Allowlist Registration

Every workflow must be registered in the filter_action table before execution:

```sql
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES ('sup.ticket.escalate', 'SUP', 'sup-ticket-escalate', false, true, 'Description')
ON CONFLICT (action_id) DO UPDATE SET ...;
```

### Database Schema (filter_action)

| Column            | Type        | Description                      |
| ----------------- | ----------- | -------------------------------- |
| `id`              | UUID        | Primary key                      |
| `action_id`       | TEXT UNIQUE | e.g. `acq.lead.score`            |
| `stage`           | TEXT        | Journey stage (ACQ, SAL, etc.)   |
| `n8n_workflow_id` | TEXT        | Webhook path suffix              |
| `requires_hitl`   | BOOLEAN     | Whether human approval is needed |
| `enabled`         | BOOLEAN     | Whether action is live           |
| `description`     | TEXT        | Human-readable description       |

### requires_hitl Guidelines

| Action type                         | requires_hitl |
| ----------------------------------- | ------------- |
| Read-only or reversible CRM updates | false         |
| Sequence enrollment                 | false         |
| WhatsApp/SMS/email to contact       | true          |
| SDR notification                    | true          |
| Task creation                       | false         |
| Discount or offer trigger           | true          |

### HITL Flow (Phase 2)

1. Action with `requires_hitl = true` hits filter
2. `pending_hitl` status written to `filter_log`
3. Telegram notification sent to operator
4. Dashboard `/hitl` polls `GET /filter/hitl/pending` every 10s
5. Operator approves/rejects via dashboard
6. `approveAction()` dispatches to n8n on approval

---

## Code Examples

### Minimum Workflow JSON Structure

```json
{
  "name": "W{N} - {ActionId}",
  "nodes": [...],
  "connections": {...},
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "saveExecutionProgress": true
  },
  "tags": ["exnoria", "{stage}"]
}
```

### Webhook Trigger Node

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "{webhook-path}",
    "responseMode": "responseNode"
  },
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2
}
```

### Respond to Webhook Node

```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ JSON.stringify({ status: 'executed', action_id: '...', contact_id: '...' }) }}"
  },
  "name": "Respond",
  "type": "n8n-nodes-base.respondToWebhook"
}
```

### Simulation Node

```javascript
return [
  {
    json: {
      enrolled: true,
      sequence_id: "seq_mock_001",
      simulated: true,
    },
  },
];
```

---

## Commands

```bash
# Test workflow directly against n8n
curl -X POST http://localhost:5678/webhook/{webhook-path} \
  -H "Content-Type: application/json" \
  -d '{ "contact_id": "123", ... }'

# Test through filter service
curl -X POST http://localhost:3000/filter/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "sup.ticket.escalate",
    "stage": "SUP",
    "session_id": "test-001",
    "payload": { ... }
  }'

# Check filter health metrics (Phase 2)
curl http://localhost:3000/filter/health?days=30

# Verify audit log
docker exec -i xnoria_postgres psql -U exnoria -d exnoria \
  -c "SELECT action_id, status, payload_out FROM filter_log WHERE session_id = 'test-001';"
```

---

## Resources

- **Templates**: See [assets/](assets/) for workflow JSON templates
- **Filter AGENTS.md**: See [layers/orchestration/filter/AGENTS.md](../../layers/orchestration/filter/AGENTS.md) for filter integration details
- **Cognitive tools**: See [layers/cognitive/src/tools/definitions.ts](../../layers/cognitive/src/tools/definitions.ts) for tool definitions
- **Database migrations**: See [layers/orchestration/filter/db/migrations/](../../layers/orchestration/filter/db/migrations/) for migration patterns

---

## Architecture contract

```
Cognitive layer (OpenClaw)
    |
    |  POST /filter/execute  { action_id, stage, session_id, payload, meta }
    v
Filter service (Express)
    |  checks allowlist -> dispatches to n8n webhook
    |
    |  POST http://n8n:5678/webhook/{workflow-id}  { ...payload }
    v
n8n workflow
    |  executes CX action (HubSpot, WhatsApp, email, etc.)
    |
    |  returns JSON response
    v
Filter service
    |  writes to filter_log { status, payload_out }
    v
Cognitive layer receives result
```

**Rule 1:** Every workflow starts with a Webhook trigger node.
**Rule 2:** Every workflow ends with a Respond to Webhook node.
**Rule 3:** No workflow calls external systems that are not in its declared scope.
**Rule 4:** Every workflow must return a structured JSON response — never empty.
**Rule 5:** All date fields written to HubSpot use midnight UTC milliseconds, not ISO strings.

---

## Naming conventions

### Action ID format

All action IDs follow `{stage}.{resource}.{verb}`:

```
acq.lead.score
acq.lead.tag
sal.sequence.enroll
sal.contact.prioritize
onb.account.flag_at_risk
onb.sequence.activate
sup.ticket.escalate
sup.response.suggest
ret.account.trigger_winback
ret.churn.flag
com.email.send
com.segment.update
exp.opportunity.create
exp.upsell.trigger
```

Stage codes:

- `acq` — Acquisition
- `sal` — Sales
- `onb` — Onboarding
- `prd` — Product experience
- `sup` — Support
- `com` — Communication/engagement
- `ret` — Retention
- `exp` — Expansion

### Webhook path format

Webhook paths are the action ID with dots replaced by hyphens:

```
acq.lead.score              ->  acq-lead-score
sal.sequence.enroll         ->  sal-sequence-enroll
ret.account.trigger_winback ->  ret-account-trigger-winback
```

### Workflow name format

```
W{N} - {ActionId}
```

Examples: `W1 - Acq.lead.score`, `W4 - Sup.ticket.escalate`

### n8n node name format

Descriptive, prefixed by service:

```
HubSpot -- get contact
HubSpot -- update contact
HubSpot -- create task
Meta WA -- notify SDR
HTTP -- call external API
Simulate -- mock response
Code -- score logic
Code -- build message
Respond
```

---

## Workflow JSON structure

Every workflow JSON must follow this structure exactly:

```json
{
  "name": "W{N} - {ActionId}",
  "nodes": [ ...nodes ],
  "connections": { ...connections },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "saveExecutionProgress": true,
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all"
  },
  "tags": ["exnoria", "{stage}", "mvp"]
}
```

Tags must always include `"exnoria"` and the relevant stage code. Add `"hitl"` for workflows behind a HITL gate.

---

## Node templates

### Webhook trigger (always first)

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "{webhook-path}",
    "responseMode": "responseNode",
    "options": {}
  },
  "id": "webhook-{action-id-dashes}",
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [240, 300],
  "webhookId": "{webhook-path}"
}
```

### Respond to Webhook (always last)

```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": "={ ... }",
    "options": { "responseCode": 200 }
  },
  "id": "respond-{workflow-id}",
  "name": "Respond",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1,
  "position": [last_x, 300]
}
```

The responseBody must always include at minimum:

```json
{
  "status": "executed",
  "action_id": "{action.id}",
  "contact_id": "{{ $('Code node or Webhook').item.json.contact_id }}"
}
```

### HubSpot -- get contact

```json
{
  "parameters": {
    "resource": "contact",
    "operation": "get",
    "contactId": "={{ $json.body.contact_id }}",
    "additionalFields": {
      "properties": "email,firstname,lastname,company,phone,hubspot_owner_id,lifecyclestage,hs_lead_status,xnoria_lead_score,xnoria_lead_tier"
    }
  },
  "id": "hubspot-get-contact",
  "name": "HubSpot -- get contact",
  "type": "n8n-nodes-base.hubspot",
  "typeVersion": 2,
  "position": [480, 300],
  "credentials": {
    "hubspotPrivateAppApi": { "name": "HubSpot Private App" }
  }
}
```

CRITICAL: HubSpot v1 API returns properties as objects { value: "..." }. Always use .value when reading properties from a get node:

```javascript
// WRONG
contact.properties?.email;

// CORRECT
contact.properties?.email?.value;
```

### HubSpot -- upsert contact (create or update)

```json
{
  "parameters": {
    "resource": "contact",
    "operation": "upsert",
    "email": "={{ $('HubSpot -- get contact').item.json.properties.email.value }}",
    "additionalFields": {
      "customProperties": [{ "name": "property_name", "value": "={{ expression }}" }]
    }
  },
  "id": "hubspot-upsert-contact",
  "name": "HubSpot -- update contact",
  "type": "n8n-nodes-base.hubspot",
  "typeVersion": 2,
  "position": [720, 300],
  "credentials": {
    "hubspotPrivateAppApi": { "name": "HubSpot Private App" }
  }
}
```

Note: The operation is `upsert`, not `update`. HubSpot identifies the contact by email.

### Code node

```json
{
  "parameters": {
    "jsCode": "// Exnoria · {ActionId}\n// {description}\n\n..."
  },
  "id": "code-{purpose}",
  "name": "Code -- {purpose}",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [x, 300]
}
```

All Code nodes must return an array of objects:

```javascript
return [{ json: { key: value } }];
```

### HTTP Request -- Meta WhatsApp

```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://graph.facebook.com/v19.0/{{ $env.META_PHONE_NUMBER_ID }}/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [{ "name": "Content-Type", "value": "application/json" }]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify($('Code -- build message').item.json.whatsapp_payload) }}",
    "options": {}
  },
  "id": "http-meta-whatsapp",
  "name": "Meta WA -- notify SDR",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [x, 300],
  "credentials": {
    "httpHeaderAuth": { "name": "Meta WhatsApp Token" }
  }
}
```

The whatsapp_payload must be assembled in the preceding Code node and passed via JSON.stringify. Never build the WhatsApp payload inline in the HTTP node — it causes encoding errors.

Correct payload structure in Code node:

```javascript
const whatsapp_payload = {
  messaging_product: "whatsapp",
  to: $env.SDR_WHATSAPP_NUMBER, // no + prefix, e.g. 524497390338
  type: "text",
  text: { body: message },
};
```

---

## HubSpot property reference

### Standard properties (always available)

| Property        | Internal name    | Type |
| --------------- | ---------------- | ---- |
| Email           | email            | Text |
| First name      | firstname        | Text |
| Last name       | lastname         | Text |
| Company         | company          | Text |
| Phone           | phone            | Text |
| Owner ID        | hubspot_owner_id | Text |
| Lifecycle stage | lifecyclestage   | Enum |
| Lead status     | hs_lead_status   | Enum |

### hs_lead_status enum values

Use internal values, not display labels:

| Display              | Internal value       |
| -------------------- | -------------------- |
| New                  | NEW                  |
| Open                 | OPEN                 |
| In progress          | IN_PROGRESS          |
| Open deal            | OPEN_DEAL            |
| Unqualified          | UNQUALIFIED          |
| Attempted to contact | ATTEMPTED_TO_CONTACT |
| Connected            | CONNECTED            |
| Bad timing           | BAD_TIMING           |

### Exnoria custom properties

All custom properties were created in HubSpot with these exact internal names. Do not create duplicates.

| Internal name               | Type             | Written by |
| --------------------------- | ---------------- | ---------- |
| xnoria_lead_score           | Number           | W1         |
| xnoria_lead_tier            | Single-line text | W1         |
| xnoria_scored_at            | Date picker      | W1         |
| xnoria_sequence_id          | Single-line text | W2         |
| xnoria_sequence_enrolled_at | Date picker      | W2         |
| xnoria_priority             | Single-line text | W3         |
| xnoria_priority_reason      | Single-line text | W3         |
| xnoria_prioritized_at       | Date picker      | W3         |

When adding new Exnoria custom properties for new workflows, follow this naming pattern: `xnoria_{stage}_{property}` or `xnoria_{descriptor}`. Always create them in HubSpot before referencing them in a workflow.

### Date field rules

HubSpot date picker fields require midnight UTC milliseconds. Never use ISO strings.

```javascript
// WRONG -- HubSpot rejects these
new Date().toISOString();
$now.toISO();
Date.now(); // rejected: "not midnight"

// CORRECT
new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime(); // e.g. 1775260800000
```

If precise time (not just date) must be stored, use a Single-line text property and store the ISO string there.

---

## Simulation nodes

When a real integration is not yet available, use a Code node labeled `Simulate -- {name}` that returns a mock response shaped exactly like the real integration would return. Always include `"simulated": true` in the response.

```javascript
// Simulate -- sequence enroll
return [
  {
    json: {
      enrolled: true,
      sequence_id: sequence_id || "seq_mock_001",
      sequence_name: "Exnoria SAL -- Mock Outreach",
      contact_id,
      first_step_scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      simulated: true,
    },
  },
];
```

When replacing a simulation node with a real integration, remove `"simulated": true` from the response.

---

## Scoring logic reference

W1 uses rule-based scoring. When adding new signals, use this baseline:

| Signal                                                     | Points    |
| ---------------------------------------------------------- | --------- |
| Source: organic                                            | +30       |
| Source: referral                                           | +25       |
| Source: paid                                               | +15       |
| Source: unknown                                            | +0        |
| Business email domain                                      | +20       |
| Free email domain (gmail, hotmail, yahoo, outlook, icloud) | +0        |
| meta.confidence x 20                                       | up to +20 |
| meta.job_title present                                     | +10       |
| meta.company present                                       | +10       |
| Max score (clamped)                                        | 100       |

Tier thresholds:

| Score | Tier | HubSpot tag |
| ----- | ---- | ----------- |
| >= 80 | hot  | xnoria_hot  |
| 50-79 | warm | xnoria_warm |
| < 50  | cold | xnoria_cold |

---

## Filter allowlist registration

Every workflow must be registered before it will execute. Add to `layers/orchestration/filter/db/migrations/`:

```sql
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES (
  'sup.ticket.escalate',
  'SUP',
  'sup-ticket-escalate',
  false,
  true,
  'Escalate a support ticket to senior agent and notify supervisor'
)
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    updated_at      = now();
```

### requires_hitl guidelines

| Action type                         | requires_hitl |
| ----------------------------------- | ------------- |
| Read-only or reversible CRM updates | false         |
| Sequence enrollment                 | false         |
| WhatsApp/SMS/email to contact       | true          |
| SDR notification                    | true          |
| Task creation                       | false         |
| Discount or offer trigger           | true          |
| Account deletion or data removal    | true          |

Also register the tool definition in `layers/cognitive/src/tools/definitions.ts`:

```typescript
{
  type: 'function',
  function: {
    name: 'sup_ticket_escalate',
    description: 'Escalate a support ticket to a senior agent. Use when a ticket has been open more than 24 hours without resolution or when the customer expresses urgency.',
    parameters: {
      type: 'object',
      properties: {
        contact_id: { type: 'string', description: 'HubSpot contact ID' },
        ticket_id:  { type: 'string', description: 'HubSpot ticket ID' },
        reason:     { type: 'string', description: 'Why this ticket needs escalation' }
      },
      required: ['contact_id', 'reason']
    }
  }
}
```

And add the mapping in TOOL_TO_ACTION:

```typescript
sup_ticket_escalate: { action_id: 'sup.ticket.escalate', stage: 'SUP' },
```

---

## Response shape contract

Every workflow Respond node must return JSON the filter can write to filter_log.payload_out.

Minimum required fields:

```json
{
  "status": "executed",
  "action_id": "sup.ticket.escalate",
  "contact_id": "206132950666"
}
```

Recommended additional fields by workflow type:

CRM update workflows:

```json
{
  "status": "executed",
  "action_id": "acq.lead.score",
  "contact_id": "...",
  "score": 85,
  "tier": "hot",
  "tag_applied": "xnoria_hot",
  "scored_at": 1775260800000
}
```

Notification workflows:

```json
{
  "status": "executed",
  "action_id": "sal.contact.prioritize",
  "contact_id": "...",
  "flagged": true,
  "notified": true,
  "notification_channel": "whatsapp"
}
```

Enrollment workflows:

```json
{
  "status": "executed",
  "action_id": "sal.sequence.enroll",
  "contact_id": "...",
  "enrolled": true,
  "sequence_id": "seq_sal_01",
  "simulated": true
}
```

---

## Environment variables

Workflows read configuration from $env. These variables are set in .env and passed to the n8n container via docker-compose.yml.

| Variable                  | Used in           | Purpose                        |
| ------------------------- | ----------------- | ------------------------------ |
| N8N_API_KEY               | n8n credential    | REST API authentication        |
| HUBSPOT_PRIVATE_APP_TOKEN | n8n credential    | HubSpot API auth               |
| HUBSPOT_PORTAL_ID         | Code nodes        | Contact URL construction       |
| META_WA_TOKEN             | n8n credential    | Meta WhatsApp auth             |
| META_PHONE_NUMBER_ID      | HTTP node URL     | Sender phone number ID         |
| SDR_WHATSAPP_NUMBER       | Code node payload | Recipient number (no + prefix) |

Never hardcode credentials or IDs in workflow nodes. Always reference via $env.VARIABLE_NAME.

For the n8n container to read $env variables, `docker-compose.yml` must include:

```yaml
N8N_BLOCK_ENV_ACCESS_IN_NODE: false
```

And each variable must be passed to the n8n environment block:

```yaml
HUBSPOT_PORTAL_ID: ${HUBSPOT_PORTAL_ID}
META_PHONE_NUMBER_ID: ${META_PHONE_NUMBER_ID}
SDR_WHATSAPP_NUMBER: ${SDR_WHATSAPP_NUMBER}
```

---

## Workflow testing sequence

Test each workflow independently before registering it in the filter:

```bash
# 1. Test directly against n8n webhook (bypasses filter)
curl -X POST http://localhost:5678/webhook/{webhook-path} \
  -H "Content-Type: application/json" \
  -d '{ ...test payload }'

# 2. Verify HubSpot was updated
# Check HubSpot contact record for updated properties

# 3. Test through the filter
curl -X POST http://localhost:3000/filter/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "{action_id}",
    "stage": "{STAGE}",
    "session_id": "test-{workflow-name}-001",
    "payload": { ...same test payload }
  }'

# 4. Verify audit log entry
docker exec -i xnoria_postgres psql -U exnoria -d exnoria \
  -c "SELECT action_id, status, payload_out, created_at FROM filter_log WHERE session_id = 'test-{workflow-name}-001';"
```

A workflow is only complete when step 4 shows status: executed with non-empty payload_out.

---

## Export and Source Control

### MCP vs Source Control

The n8n MCP manages the **live instance** at `localhost:5678`. Source control (`workflows/n8n/`) stores the **JSON export** for version history and disaster recovery.

### Flow: MCP → Test → Export

1. Create and develop workflow via MCP (inactive)
2. Test thoroughly (direct webhook + filter)
3. Activate via MCP when ready
4. Export to source control for version control:
   - In n8n: open the workflow → three-dot menu → Download
   - Save to `workflows/n8n/{action-id}.json`
   - Verify valid JSON: `cat {file} | python3 -m json.tool > /dev/null`

### When to Update Source Control

- After activating a new workflow
- After any modifications to an active workflow
- Before major refactoring
- As part of the commit for any workflow-related change

Commit message format:

```
feat(workflows): add {action_id} -- {one line description}

Registers:
- n8n workflow: {webhook-path}
- filter_action: {action_id} (stage: {STAGE}, hitl: {true|false})
- tool definition: {tool_name}
```

### Disaster Recovery

If the n8n container is rebuilt, import workflows from source control:

1. In n8n: Import from file
2. Select the JSON from `workflows/n8n/`
3. Activate after confirming filter_action exists

---

## Common errors and fixes

| Error                                    | Cause                                     | Fix                                                                      |
| ---------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| Email address [object Object] is invalid | Reading HubSpot property without .value   | Add .value to property access                                            |
| was not a valid long (date field)        | ISO string sent to Date picker property   | Use new Date(new Date().setUTCHours(0,0,0,0)).getTime()                  |
| not midnight (date field)                | Date.now() sent to Date picker            | Same fix as above                                                        |
| access to env vars denied                | N8N_BLOCK_ENV_ACCESS_IN_NODE is true      | Add N8N_BLOCK_ENV_ACCESS_IN_NODE: false to n8n env in docker-compose.yml |
| (#100) Invalid parameter (Meta WA)       | Double-encoded JSON body                  | Build payload in Code node, pass via JSON.stringify                      |
| contact does not exist                   | Wrong contact ID (portal ID used instead) | Get contact ID from HubSpot URL path, not portal settings                |
| ACTION_NOT_IN_ALLOWLIST from filter      | Workflow not seeded in filter_action      | Run seed SQL, restart filter container                                   |
| WORKFLOW_UNREACHABLE from filter         | Workflow not activated in n8n             | Activate workflow in n8n UI (toggle to Active)                           |
| workflow_result is empty string          | Workflow was inactive when called         | Activate the workflow -- inactive webhooks return empty                  |

---

## Checklist -- New Workflow

Before marking a workflow as complete:

### MCP-Based Creation (preferred)

- [ ] Create workflow via `n8n_workflow_create` (inactive)
- [ ] Add all nodes via `n8n_workflow_add_node`
- [ ] Connect nodes via `n8n_workflow_connect_nodes`
- [ ] Test directly via `n8n_workflow_execute` or curl
- [ ] Test through filter service
- [ ] Verify filter_log shows status: executed with non-empty payload_out

### Integration Points

- [ ] Webhook trigger path matches action_id (dots → hyphens)
- [ ] Respond node returns structured JSON with status, action_id, contact_id
- [ ] All HubSpot property reads use .value
- [ ] All date fields use midnight UTC milliseconds
- [ ] No credentials hardcoded — all via $env
- [ ] WhatsApp payload built in Code node, not inline in HTTP node

### Registration

- [ ] Simulation nodes labeled "Simulate --" and include "simulated": true
- [ ] Migration added to layers/orchestration/filter/db/migrations/
- [ ] Tool definition added to layers/cognitive/src/tools/definitions.ts
- [ ] TOOL_TO_ACTION mapping added
- [ ] filter_action entry exists and is enabled

### Source Control

- [ ] Workflow exported and saved to workflows/n8n/
- [ ] Workflow activated via `n8n_workflow_activate` (only after all above complete)
