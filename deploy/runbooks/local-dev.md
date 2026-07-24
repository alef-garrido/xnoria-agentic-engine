# Xnoria — Local Development Deployment Guide

This guide walks you through deploying Xnoria on a local development machine. The stack runs entirely on localhost. No HTTPS, no public domain required.

---

## Prerequisites

| Requirement | Version | Install |
|---|---|---|
| Docker Engine | 24+ | [docs.docker.com](https://docs.docker.com/engine/install/) |
| Docker Compose | v2.x (plugin) | Included with Docker Desktop |
| Git | any | system package manager |
| `openssl` | any | Included on macOS and Linux |
| `curl` | any | Included on macOS and Linux |

Verify:

```bash
docker --version
docker compose version
git --version
openssl version
```

---

## 1. Clone and Initialize

```bash
git clone https://github.com/your-org/xnoria.git
cd xnoria
chmod +x deploy/init.sh deploy/health-check.sh deploy/backup.sh deploy/restore.sh
./deploy/init.sh local
```

The init script will:
1. Copy `deploy/environments/local/.env.template` to `.env`
2. Generate `N8N_ENCRYPTION_KEY` and `DASHBOARD_AUTH_SECRET` automatically
3. Prompt you for required credentials (Groq, HubSpot, Telegram, etc.)
4. Start Postgres and run database migrations
5. Start the full stack
6. Run the health check

**Non-interactive alternative:** Export all required variables before running:

```bash
export POSTGRES_PASSWORD=yourpassword
export LLM_API_KEY=gsk_...
export TELEGRAM_BOT_TOKEN=123:...
# ... all other required vars ...
./deploy/init.sh local
```

---

## 2. Verify Services

```bash
./deploy/health-check.sh
```

Expected output:
```
  ✓ Postgres (pg_isready)
  ✓ n8n (GET /healthz)
  ✓ Filter service (GET /health)
  ✓ Dashboard (GET /api/health)
  ✓ Cognitive container (running)
  ✓ Filter actions (>= 3 enabled)
  ✓ pgvector extension
  ✓ Telegram Bot (getMe)

All checks passed.
```

Service URLs:
- **n8n UI:** http://localhost:5678
- **Filter health:** http://localhost:3000/health
- **Dashboard:** http://localhost:4000

---

## 3. Development Workflow

### View logs for a single service

```bash
docker compose logs -f cognitive
docker compose logs -f filter
docker compose logs -f n8n
docker compose logs -f dashboard
```

### Rebuild a single service after code changes

```bash
docker compose up -d --build cognitive
docker compose up -d --build filter
docker compose up -d --build dashboard
```

### Run a SQL query against the database

```bash
docker compose exec postgres psql -U xnoria -d exnoria -c "SELECT * FROM filter_log ORDER BY created_at DESC LIMIT 10;"
```

### Apply a new migration manually

```bash
docker compose exec postgres psql -U xnoria -d exnoria < layers/orchestration/filter/db/migrations/NNN_description.sql
```

### Trigger the cognitive agent manually

```bash
curl -X POST http://localhost:3000/filter/execute \
  -H "Content-Type: application/json" \
  -d '{"action_id": "acq.lead.engage", "stage": "ACQ", "session_id": "test-001", "payload": {}}'
```

### n8n external webhooks during local dev

n8n's webhook URLs require a publicly accessible URL. For local testing with external services (Meta, HubSpot):

```bash
# Using cloudflared tunnel (recommended — free, no signup required for basic use)
cloudflared tunnel --url http://localhost:5678

# Using ngrok
ngrok http 5678
```

Update `N8N_WEBHOOK_URL` in `.env` with the tunnel URL, then restart n8n:

```bash
docker compose up -d n8n
```

---

## 4. Updating the Stack

```bash
git pull
docker compose up -d --build
```

If migrations were added:

```bash
git pull
# Apply new migration files
docker compose exec postgres psql -U xnoria -d exnoria < layers/orchestration/filter/db/migrations/NEW_migration.sql
docker compose up -d --build
```

---

## 5. Common Issues

### `WORKFLOW_UNREACHABLE` from filter service

**Cause:** n8n workflows are not imported or not activated.

**Fix:**
1. Open http://localhost:5678
2. Import workflow JSONs from `workflows/n8n/`
3. Activate each workflow
4. Update `n8n_workflow_id` in the database to match the webhook path

```bash
docker compose exec postgres psql -U xnoria -d exnoria -c \
  "UPDATE filter_action SET n8n_workflow_id = 'new-path' WHERE action_id = 'acq.lead.engage';"
```

### Cognitive container exits immediately

**Cause:** Missing required environment variables (`LLM_API_KEY`, `TELEGRAM_BOT_TOKEN`, etc.)

**Fix:** Check `.env` — all `[REQUIRED]` vars must be set:

```bash
docker compose logs cognitive
```

### Postgres migration fails with "already exists"

**Cause:** Migration was already applied. This is safe to ignore.

**Fix:** The `init.sh` is idempotent — migrations are applied via `IF NOT EXISTS` and duplicate entries are handled gracefully.

### n8n shows blank page or infinite spinner

**Fix:** Hard refresh (Ctrl+Shift+R) or clear browser cache. n8n's frontend can cache stale assets.

---

## 6. Teardown

**Safe — preserves all data:**
```bash
make down
```

**Nuclear — destroys all volumes (IRREVERSIBLE):**
```bash
make down-hard
```

> Before any teardown, export n8n workflows from the UI and run `./deploy/backup.sh`.
