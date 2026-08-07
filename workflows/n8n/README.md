# n8n Workflow Exports

This directory contains version-controlled JSON exports of all n8n workflows used by the Exnoria CX Intelligence Engine.

## Naming Convention

Each file is named after its `action_id` with dots replaced by hyphens:

```
acq-lead-score.json
sal-sequence-enroll.json
sal-contact-prioritize.json
```

## Exporting Workflows from n8n

1. Open n8n at `http://localhost:5678`
2. Navigate to the workflow you want to export
3. Click the **⋮** menu (top-right) → **Download**
4. Save the JSON file to this directory using the naming convention above
5. Commit the file to source control

### Bulk Export

To export all workflows at once:

1. Go to **Settings** → **n8n API** → Enable API
2. Use the n8n API to list and download workflows:

```bash
# List all workflows
curl -s http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: <your-api-key>" | jq '.data[].name'

# Export a specific workflow by ID
curl -s http://localhost:5678/api/v1/workflows/<workflow-id> \
  -H "X-N8N-API-KEY: <your-api-key>" | jq . > <action-id>.json
```

## Importing Workflows to n8n

1. Open n8n at `http://localhost:5678`
2. Click **Add workflow** → **Import from File**
3. Select the JSON file from this directory
4. Update any credential references (credentials are not exported for security)
5. Activate the workflow

### Automated Import (CI/CD)

```bash
# Import a workflow via API
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d @acq-lead-score.json
```

## MVP Workflows

| File                          | Action ID                | Stage | Description                               |
| ----------------------------- | ------------------------ | ----- | ----------------------------------------- |
| `acq-lead-score.json`         | `acq.lead.score`         | ACQ   | Score lead, apply CRM tags                |
| `sal-sequence-enroll.json`    | `sal.sequence.enroll`    | SAL   | Enroll contact in sales sequence          |
| `sal-contact-prioritize.json` | `sal.contact.prioritize` | SAL   | Flag contact for SDR follow-up + WhatsApp |

## Related Source-Controlled Configurations

| Config           | Location                                     | Purpose                                   |
| ---------------- | -------------------------------------------- | ----------------------------------------- |
| Tool definitions | `layers/cognitive/src/tools/definitions.ts`  | LLM tool schema exposed to agent          |
| Action registry  | `layers/orchestration/filter/db/seed.sql`    | Filter allowlist seed data                |
| DB schema        | `layers/orchestration/filter/db/migrations/` | Filter tables (filter_action, filter_log) |
