Here's the recovery sequence. The goal is to get back to the exact state the system was in at the end of Phase 3, then proceed to A4.

---

## Step 1: Verify source control is clean first

Before starting anything, confirm the folder cleanup from the previous message is done:

```bash
ls layers/
# Must show: cognitive  orchestration  dashboard

ls layers/orchestration/
# Must show: filter  (nothing else)

ls workflows/n8n/
# Must show all workflow JSON files including the four moved from layers/orchestration/workflows/

grep -r "mempalace" layers/
# Must return nothing
```

Do not proceed until these pass.

---

## Step 2: Bring the stack up clean

```bash
# Start all services — no -v flag ever
make up
# or if Makefile not yet created:
docker compose up -d

# Verify all containers are healthy
docker compose ps
# Expected: cognitive, filter, dashboard, postgres, n8n all Up
```

---

## Step 3: Apply all migrations in sequence

The Postgres volume was wiped so the database is empty. Run every migration in order:

```bash
docker exec exnoria_postgres psql -U postgres -d exnoria -f /dev/stdin < layers/orchestration/filter/db/seed.sql

for migration in layers/orchestration/filter/db/migrations/*.sql; do
  echo "Applying $migration..."
  docker exec exnoria_postgres psql -U postgres -d exnoria -f /dev/stdin < "$migration"
done
```

Then verify the filter_action table is populated:

```bash
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "SELECT action_id, stage, enabled FROM filter_action ORDER BY stage, action_id;"
```

Expected: 20+ rows across all 8 stages. Confirm `exp.account.flag` is disabled, all others enabled except placeholders.

---

## Step 4: Reimport n8n workflows

The n8n database was wiped — all workflows need to be reimported from source control.

```bash
# Open n8n UI
open http://localhost:5678
```

Import each workflow JSON from `workflows/n8n/` via Settings → Import Workflow. Import order matters — shared utility workflows first, then the CX engine workflows:

**Import first (utilities referenced by others):**
- Any compliance or analytics utility workflows if present

**Import second (CX Engine workflows in stage order):**
- `acq.lead.engage.json`
- `acq.lead.nurture.json`
- `acq.contact.outreach.json`
- `sal.contact.message.json`
- `onb.document.request.json`
- `onb.document.validate.json`
- `onb.contact.nudge.json`
- `onb.contact.assist.json`
- `onb.ticket.escalate.json`
- `prd.contact.nudge.json` (stored as `prd.friction.flag.json`)
- `prd.contact.educate.json` (stored as `prd.adoption.nudge.json`)
- `prd.feedback.log.json`
- `sup.ticket.escalate.json`
- `sup.contact.notify.json`
- `ret.contact.winback.json`
- `ret.account.flag.json`
- `com.content.publish.json`

After importing each workflow, activate it and note the new webhook ID assigned by n8n.

---

## Step 5: Update webhook IDs in the database

Every workflow import generates a new webhook ID. Run migration 010 with the real IDs:

```bash
# Fill in 010_update_workflow_ids.sql with the actual webhook IDs from Step 4
# Then apply:
docker exec exnoria_postgres psql -U postgres -d exnoria -f /dev/stdin < \
  layers/orchestration/filter/db/migrations/010_update_workflow_ids.sql
```

Verify each enabled action has a real (non-placeholder) webhook ID:

```bash
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "SELECT action_id, n8n_workflow_id FROM filter_action WHERE enabled = true;"
# No PLACEHOLDER_ strings should appear
```

---

## Step 6: Verify cognitive layer is running the correct code

```bash
# Confirm compiled code is current
docker exec exnoria_cognitive grep -r "selectToolsForStage" /app/dist/
# Must return results — confirms stage-aware tool selection is compiled in

# Confirm Engram binary is present
docker exec exnoria_cognitive engram --version

# Confirm Engram MCP tools are accessible
docker exec exnoria_cognitive engram mcp
# Should respond with MCP initialization including mem_save and mem_search
```

If `selectToolsForStage` is not found, the dist/ volume mount is not working — run `docker compose up -d --force-recreate cognitive`.

---

## Step 7: Smoke test the full pipeline

Inject a test event through the Telegram channel:

```
Test message: contact CID_RECOVERY_TEST, stage ONB, signal ONB_FRC_01, severity 0.7
```

Expected log sequence:

```
[reason] stage=ONB active_tools=5
[memory] fetching contact history... (returns empty — fresh start)
[compass] signal_context fetched: ONB_FRC_01
[reason] tokens used: prompt=~2800
[filter] dispatching onb.contact.nudge → executed
[memory] session recorded
```

Verify the memory record was written:

```bash
docker exec exnoria_cognitive engram search "CID_RECOVERY_TEST"
# Must return one result
```

Verify the filter_log has the audit entry:

```bash
docker exec exnoria_postgres psql -U postgres -d exnoria -c \
  "SELECT action_id, status, created_at FROM filter_log ORDER BY created_at DESC LIMIT 5;"
```

---

su