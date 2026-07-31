# Exnoria Operational Guide

Create, configure, and manage an Exnoria CX Intelligence Engine instance.

---

## 1. Prerequisites

| Requirement | Minimum | Notes |
|---|---|---|
| Docker Engine | 24+ | [docs.docker.com](https://docs.docker.com/engine/install/) |
| Docker Compose | v2.x (plugin) | Included with Docker Engine |
| Git | any | System package manager |
| openssl | any | Pre-installed on macOS/Linux |
| curl | any | Pre-installed on macOS/Linux |
| RAM | 4 GB (dev) / 2 GB (VPS min) / 8 GB (edge recommended) | Under 2 GB causes OOM kills |
| OS | Linux x86-64 or ARM64 | Ubuntu 24.04 LTS recommended |
| Disk | 20 GB+ | SSD strongly recommended (not SD card for 24/7) |

Verify prerequisites:

```bash
docker --version
docker compose version
git --version
openssl version
```

---

## 2. Quickstart

### 2.1 Clone the repository

```bash
git clone https://github.com/your-org/exnoria.git
cd exnoria
```

### 2.2 Initialize project configuration

```bash
make project-init
```

This runs `scripts/scaffold-project.sh`, which:
1. Copies `.env.example` to `.env` with auto-generated secure secrets (Postgres password, n8n encryption key, dashboard auth secret, admin password)
2. Copies `config/project.config.example.json` to `config/project.config.json`
3. Creates required directories (`backups/`, `tmp/`, `validation/`, `doc/rfcs/`)
4. Optionally loads seed SQL packs into the database if Postgres is already running

This step does **not** run database migrations. It only creates scaffolding — you still need to fill credentials and run the stack.

**Relationship with deploy/init.sh:** `make project-init` (scaffold) generates secrets and copies config templates. `deploy/init.sh` (§4) is a superset — it does everything scaffold does plus prompts for credentials, runs migrations, and starts the full stack. Use `make project-init` when you want to configure manually; use `deploy/init.sh` for guided setup.

After this step, your `.env` has auto-generated secrets but still requires manual credential entry.

### 2.3 Configure credentials

Edit `.env` and fill every `[REQUIRED]` variable. Variables are grouped by tier:

**Core (required for any working stack):**

```bash
POSTGRES_PASSWORD=              # auto-generated — keep it
N8N_ENCRYPTION_KEY=             # auto-generated — keep it
N8N_API_KEY=                    # from n8n UI (Settings > API Key) — after first boot
LLM_API_KEY=gsk_...             # Groq API key
TELEGRAM_BOT_TOKEN=123:...      # from @BotFather
TELEGRAM_OPERATOR_CHAT_ID=      # from @userinfobot
EMBEDDING_API_KEY=              # Google Generative Language API key
DASHBOARD_ADMIN_PASSWORD=       # auto-generated, or set your own
DASHBOARD_AUTH_SECRET=          # auto-generated — keep it
```

**Feature-required (needed for CRM, WhatsApp, and COM workflows):**

```bash
HUBSPOT_PRIVATE_APP_TOKEN=      # HubSpot Private App token
HUBSPOT_PORTAL_ID=              # HubSpot portal numeric ID
HUBSPOT_DEVELOPER_API_KEY=      # HubSpot Developer API key
HUBSPOT_PERSONAL_ACCESS_KEY=    # HubSpot personal access key (CLI integrations)
META_WA_TOKEN=                  # Meta WhatsApp System User token
META_PHONE_NUMBER_ID=           # WhatsApp Phone Number ID
SDR_WHATSAPP_NUMBER=            # international format
COM_CONTENT_SHEET_ID=           # Google Sheets ID for content calendar
THREADS_ACCESS_TOKEN=           # Threads API token for content publishing
```

See section 3 for the full variable reference.


### 2.4 Customize branding (optional)

Edit `config/project.config.json`:

```json
{
  "project": { "id": "exnoria", "name": "My Brand", "version": "1.3.0" },
  "branding": {
    "title": "My CX Dock",
    "subtitle": "Bajio Outbound",
    "logo_url": "/logo.svg",
    "primary_color": "#0F172A"
  },
  "enabled_stages": ["ACQ","SAL","ONB","PRD","SUP","COM","RET","EXP"],
  "llm_defaults": {
    "coordinator_model": "llama-3.1-8b-instant",
    "acqsal_model": "llama-3.3-70b-versatile",
    "lifecycle_model": "llama-3.3-70b-versatile",
    "escalation_model": "llama-3.3-70b-versatile"
  }
}
```

Mapping to dashboard env vars:

| project.config field | Env var | branding.ts field |
|---|---|---|
| `branding.title` | `NEXT_PUBLIC_APP_TITLE` | `appTitle` |
| `branding.subtitle` | `NEXT_PUBLIC_PROJECT_SUBTITLE` | `subtitle` |
| `branding.logo_url` | - | (static asset path, no env override) |
| - | `NEXT_PUBLIC_AGENT_NAME` | `agentName` (default: "Exnoria") |

Add any `NEXT_PUBLIC_*` vars to `.env` to override `branding.ts` defaults.

### 2.5 Start the stack

```bash
make up
```

This runs `docker compose up -d`, starting: postgres (pgvector/pg16), n8n, filter (Express), cognitive (agentic core), dashboard (Next.js 16).

### 2.6 Verify everything is running

```bash
make verify-workflows
```

Then visit:

| Service | URL |
|---|---|
| Dashboard | http://localhost:4000 |
| n8n | http://localhost:5678 |
| Filter health | http://localhost:3000/health |

Login to the Dashboard with the password from `DASHBOARD_ADMIN_PASSWORD`. If that was not set before first startup, see section 5 (Admin Bootstrap).

### 2.7 Import n8n workflows

1. Open http://localhost:5678
2. Sign in with credentials generated during scaffold (stored in `.env`)
3. Import all `.json` files from `workflows/n8n/`
4. Activate each workflow
5. Confirm the webhook IDs in the database match:

```bash
docker compose exec postgres psql -U exnoria -d exnoria -c \
  "SELECT action_id, n8n_workflow_id, enabled FROM filter_action;"
```

---

## 3. Configuration Reference

All environment variables in `.env`. Copy from `.env.example` — never commit `.env` to source control.

### 3.1 Project Identity

| Variable | Required | Default | Description |
|---|---|---|---|
| `PROJECT_ID` | optional | `exnoria` | Namespaces containers, DB user, network. Change for multi-instance on same host. |
| `PROJECT_SUBTITLE` | optional | empty | Displayed in dashboard TopBar. Set `NEXT_PUBLIC_PROJECT_SUBTITLE` for runtime override. |
| `ENGRA_PROJECT` | optional | `exnoria` | Namespaces Engram contact memory per instance. Change when running multiple instances to prevent memory collision. |

### 3.2 Postgres

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_PASSWORD` | **REQUIRED** | - | Password for the Postgres user (matches `PROJECT_ID`). |
| `POSTGRES_DB` | optional | `exnoria` | Database name. |

### 3.3 n8n

| Variable | Required | Default | Description |
|---|---|---|---|
| `N8N_ENCRYPTION_KEY` | **REQUIRED** (generated) | - | `openssl rand -hex 32`. Set once, never change — existing credentials become unreadable. |
| `N8N_API_KEY` | **REQUIRED** | - | Generated in n8n UI (Settings > API Key). |
| `N8N_HOST` | optional | `localhost` | Public hostname for webhook URLs. |
| `N8N_PROTOCOL` | optional | `http` | `http` for local dev, `https` for production. |
| `N8N_WEBHOOK_URL` | optional | `http://localhost:5678` | Full public URL n8n uses to construct webhook URLs. |

### 3.4 Meta WhatsApp Business API

| Variable | Required | Default | Description |
|---|---|---|---|
| `META_WA_TOKEN` | **REQUIRED** | - | System User permanent token from Meta Business Manager. |
| `META_PHONE_NUMBER_ID` | **REQUIRED** | - | Numeric ID of the WhatsApp Business sender number. |
| `SDR_WHATSAPP_NUMBER` | **REQUIRED** | - | Recipient number for SDR notifications (international format). |

### 3.5 HubSpot

| Variable | Required | Default | Description |
|---|---|---|---|
| `HUBSPOT_PRIVATE_APP_TOKEN` | **REQUIRED** | - | Private App token with `crm.objects.contacts.read` + `write` scopes. |
| `HUBSPOT_PORTAL_ID` | **REQUIRED** | - | Portal numeric ID from HubSpot account settings. |
| `HUBSPOT_DEVELOPER_API_KEY` | **REQUIRED** | - | Developer API key from HubSpot Developer Portal. Used for app management and developer-level operations. |
| `HUBSPOT_PERSONAL_ACCESS_KEY` | **REQUIRED** | - | Personal access key from HubSpot Private Apps settings. Used for CLI-based development and personal integrations. |

### 3.6 Filter Service

| Variable | Required | Default | Description |
|---|---|---|---|
| `FILTER_PORT` | optional | `3000` | HTTP port for Express filter service. |
| `N8N_BASE_URL` | optional | `http://n8n:5678` | Internal URL (Docker network) for n8n dispatch. |
| `TELEGRAM_OPERATOR_CHAT_ID` | **REQUIRED** | - | Telegram chat ID for HITL operator notifications. Get from @userinfobot. |
| `DASHBOARD_URL` | **REQUIRED** | `http://localhost:4000` | Public dashboard URL for HITL notification links. Never `localhost` in production. |
| `COM_CONTENT_SHEET_ID` | **REQUIRED** | - | Google Sheets ID for content calendar (COM workflow). |
| `THREADS_ACCESS_TOKEN` | **REQUIRED** | - | Threads API token for COM content publishing. |

### 3.7 Cognitive Layer (LLM)

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_API_KEY` | **REQUIRED** | - | Groq API key (or any OpenAI-compatible provider). |
| `LLM_BASE_URL` | optional | `https://api.groq.com/openai/v1` | Base URL for LLM provider. |
| `LLM_MODEL` | optional | `llama-3.3-70b-versatile` | Primary model (single-agent mode). |
| `AGENT_MODE` | optional | `single` | `single` or `multi`. Multi uses specialist models per cluster. |
| `EMBEDDING_API_KEY` | **REQUIRED** | - | Google Generative Language API key for Engram embeddings. |
| `TELEGRAM_BOT_TOKEN` | **REQUIRED** | - | Bot token from @BotFather. Long-polling only (no webhook port needed). |

Multi-agent specialist models (used when `AGENT_MODE=multi`):

| Variable | Default | Role |
|---|---|---|
| `LLM_COORDINATOR_MODEL` | `llama-3.3-70b-versatile` | Routes events to specialists |
| `LLM_ACQSAL_MODEL` | `llama-3.3-70b-versatile` | Acquisition + Sales actions |
| `LLM_LIFECYCLE_MODEL` | `llama-3.3-70b-versatile` | PRD, ONB, SUP actions |
| `LLM_ESCALATION_MODEL` | `llama-3.3-70b-versatile` | Escalation decisions |

The `project.config.json` `llm_defaults` section serves as the project-level configuration source. Environment variables override when `AGENT_MODE=multi` — otherwise the coordinator model (`LLM_MODEL`) handles everything.

Fallback provider (OpenRouter, used when Groq fails):

| Variable | Default |
|---|---|
| `OPENROUTER_API_KEY` | - |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` |

### 3.8 PostHog (product analytics)

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTHOG_AUTH_HEADER` | optional | - | `Bearer phx_...` from PostHog user API settings. |
| `POSTHOG_PROJECT_ID` | optional | - | PostHog project numeric ID. |
| `POSTHOG_HOST` | optional | `https://app.posthog.com` | PostHog instance URL. |
| `POSTHOG_PROJECT_TOKEN` | optional | - | Project API token. |

Note: PostHog returns empty data until the product instruments `posthog.identify(contact_id)` and `posthog.capture(...)` calls. Without instrumentation, the cognitive layer degrades gracefully to Engram memory. (See `layers/cognitive/AGENTS.md` §PostHog Signal Data Prerequisites for identity mapping details.)

### 3.9 Dashboard

| Variable | Required | Default | Description |
|---|---|---|---|
| `DASHBOARD_PORT` | optional | `4000` | Host port for the Next.js dashboard. |
| `DASHBOARD_ADMIN_PASSWORD` | **REQUIRED** | - | Minimum 8 chars. Used to seed admin account on first startup. |
| `DASHBOARD_AUTH_SECRET` | **REQUIRED** (generated) | - | `openssl rand -hex 32`. Used to sign auth cookies. |
| `NEXT_PUBLIC_PROJECT_SUBTITLE` | optional | - | Displayed in dashboard TopBar branding. |

### 3.10 Deployment

| Variable | Required | Default | Description |
|---|---|---|---|
| `N8N_HOST` | VPS/Edge | - | Public hostname (e.g. `n8n.yourdomain.com`). |
| `DASHBOARD_HOST` | VPS/Edge | - | Public hostname (e.g. `dashboard.yourdomain.com`). |
| `BACKUP_PASSPHRASE` | backups | - | AES-256 encryption passphrase for backup.sh. |
| `BACKUP_S3_BUCKET` | optional | - | S3 bucket for off-site backup upload. |
| `BACKUP_S3_REGION` | optional | `us-east-1` | S3 region. |
| `BACKUP_S3_ACCESS_KEY` | optional | - | S3 access key. |
| `BACKUP_S3_SECRET_KEY` | optional | - | S3 secret key. |

---

## 4. Deployment Profiles

Exnoria supports three deployment targets. The guided init script handles setup:

```bash
chmod +x deploy/init.sh
./deploy/init.sh local   # or: vps, edge
```

The init script:
1. Copies the environment template for the chosen target
2. Generates `N8N_ENCRYPTION_KEY` and `DASHBOARD_AUTH_SECRET`
3. Prompts for all required credentials
4. Starts Postgres and runs all database migrations
5. Starts the full stack
6. Runs the health check

### 4.1 Local Development

Target: `local` — runs entirely on localhost. No HTTPS, no public domain.

```bash
./deploy/init.sh local
# or non-interactive:
export POSTGRES_PASSWORD=... LLM_API_KEY=...  # all required vars
./deploy/init.sh local
```

**Services:**

| Service | URL |
|---|---|
| n8n | http://localhost:5678 |
| Filter | http://localhost:3000/health |
| Dashboard | http://localhost:4000 |

For external webhook testing with Meta/HubSpot:

```bash
cloudflared tunnel --url http://localhost:5678
# or: ngrok http 5678
```

Update `N8N_WEBHOOK_URL` in `.env` with the tunnel URL and restart n8n: `docker compose up -d n8n`.

Full details in `deploy/runbooks/local-dev.md`.

### 4.2 VPS (Production)

Target: `vps` — Caddy reverse proxy with automatic Let's Encrypt TLS. Requires public domain.

**Prerequisites:**
- VPS with 2 vCPU, 2 GB+ RAM, 20 GB+ SSD
- Ubuntu 24.04 LTS (fresh install)
- Domain with DNS A records:
  - `n8n.yourdomain.com` pointing to VPS IP
  - `dashboard.yourdomain.com` pointing to VPS IP
- Firewall: ports 22 (SSH), 80 (ACME challenge), 443 (HTTPS) open

```bash
./deploy/init.sh vps
# Enter actual domain names when prompted
```

Start with VPS override:

```bash
docker compose \
  -f docker-compose.yml \
  -f deploy/environments/vps/docker-compose.override.yml \
  up -d
```

Caddy obtains Let's Encrypt certificates automatically. Verify:

```bash
curl -s -o /dev/null -w "%{http_code}" https://n8n.yourdomain.com/healthz
curl -s -o /dev/null -w "%{http_code}" https://dashboard.yourdomain.com/api/health
# Both should return 200
```

Full details in `deploy/runbooks/vps.md`.

### 4.3 Edge Device

Target: `edge` — Intel NUC, Beelink mini PC, Raspberry Pi 4/5. Self-signed Caddy TLS, mDNS for local network discovery.

**Prerequisites:**
- 4 GB+ RAM (8 GB recommended), SSD strongly recommended
- Ubuntu Server 24.04 LTS (x86-64) or Raspberry Pi OS Lite 64-bit
- Internet for LLM API calls and Telegram (dashboard accessible on LAN)

mDNS setup:

```bash
sudo apt install -y avahi-daemon
sudo systemctl enable --now avahi-daemon
sudo hostnamectl set-hostname exnoria
# Device resolves as exnoria.local on the local network
# n8n subdomain: exnoria-n8n.local
```

```bash
./deploy/init.sh edge
```

Start with Edge override:

```bash
docker compose \
  -f docker-compose.yml \
  -f deploy/environments/edge/docker-compose.override.yml \
  up -d
```

Trust the self-signed Caddy CA on each client device:

```bash
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > caddy-root.crt
# Install caddy-root.crt on each client (see deploy/runbooks/edge.md §6)
```

Full details in `deploy/runbooks/edge.md`.

---

## 5. Admin Bootstrap

The admin account is created by migration but has no password initially. Three ways to set it:

### 5.1 Automatic (recommended)

Set `DASHBOARD_ADMIN_PASSWORD` in `.env` before first `docker compose up`. The dashboard container runs `init-admin-password.js` on startup, which hashes and stores the password. Idempotent — only updates if `password_hash IS NULL`.

### 5.2 Manual API (escape hatch)

If the password was not set before startup:

```bash
curl -X POST http://localhost:4000/api/bootstrap/admin-init \
  -H "Content-Type: application/json" \
  -d '{"password": "your-secure-password"}'
```

This endpoint self-disables after first successful use (returns 403 on subsequent calls).

### 5.3 Fallback (CLI)

```bash
# Generate bcrypt hash
docker compose exec dashboard node -e \
  "require('bcrypt').hash('your-password', 12).then(h => console.log(h))"

# Set it in the database
docker compose exec postgres psql -U exnoria -d exnoria -c \
  "UPDATE operators SET password_hash = '<hash>', password_changed = true WHERE handle = 'admin';"
```

---

## 6. Day-2 Operations

### 6.1 View logs

```bash
docker compose logs -f cognitive   # agentic core reasoning
docker compose logs -f filter      # allowlist checks + n8n dispatch
docker compose logs -f n8n         # workflow execution
docker compose logs -f dashboard   # Next.js server
```

### 6.2 Rebuild a single service

```bash
docker compose up -d --build cognitive
docker compose up -d --build filter
docker compose up -d --build dashboard
```

### 6.3 Health check

```bash
./deploy/health-check.sh
```

Expected: all checks pass (Postgres, n8n, filter, dashboard, cognitive, pgvector, Telegram bot).

### 6.4 Backups

```bash
# Manual backup
export BACKUP_PASSPHRASE=your-passphrase
./deploy/backup.sh ./backups
```

Automated daily backup (VPS production):

```bash
crontab -e
# Add:
0 3 * * * export BACKUP_PASSPHRASE=your-passphrase && \
  /home/exnoria/exnoria/deploy/backup.sh /home/exnoria/exnoria/backups \
  >> /home/exnoria/exnoria/backups/backup.log 2>&1
```

Export audit log before destructive operations:

```bash
make export-all
```

### 6.5 Credential rotation

1. Update the value in `.env`
2. Restart the affected service: `docker compose up -d <service-name>`

**Never rotate `N8N_ENCRYPTION_KEY`** — existing n8n credentials become permanently unreadable.

### 6.6 Update the stack

```bash
git pull
docker compose up -d --build
```

If new migrations were added:

```bash
git pull
docker compose up -d postgres
docker compose exec postgres psql -U exnoria -d exnoria \
  < layers/orchestration/filter/db/migrations/<NNN_description>.sql
docker compose up -d --build
```

### 6.7 Run a SQL query

```bash
docker compose exec postgres psql -U exnoria -d exnoria \
  -c "SELECT action_id, status, created_at FROM filter_log ORDER BY created_at DESC LIMIT 20;"
```

### 6.8 Teardown

**Safe (preserves all volumes):**

```bash
make down
```

**Nuclear (destroys ALL volumes — IRREVERSIBLE):**

```bash
make down-hard
# Requires typing DESTROY to confirm
```

Before any teardown: run `make export-all` and `make verify-workflows`. (See section 8.)

---

## 7. Multi-Instance

Run multiple isolated Exnoria instances on the same host.

### 7.1 Per-instance configuration

Each instance needs:

1. Its own directory with its own `.env`
2. A unique `PROJECT_ID` (e.g., `exnoria-client-bajio`)
3. Its own `docker-compose.yml` with `PROJECT_ID` substituted (or use the same compose file with different env)

The `PROJECT_ID` env var namespaces:

| Resource | Naming pattern | Example |
|---|---|---|
| Container names | `{PROJECT_ID}_{service}` | `exnoria_bajio_postgres` |
| Docker network | `{PROJECT_ID}_internal` | `exnoria_bajio_internal` |
| Postgres user | `{PROJECT_ID}` | `exnoria_bajio` |
| Postgres DB | `POSTGRES_DB` or default | `exnoria_bajio` |

### 7.2 Engram memory isolation

Set `ENGRA_PROJECT` to a unique value per instance to prevent cross-instance memory collision (it is defined in `.env.example`, uncomment and set a unique value per instance):

```bash
# In each instance's .env
ENGRA_PROJECT=client-bajio
```

### 7.3 Port conflicts

Each instance needs unique host port mappings for services that bind to host ports. Override in a local `docker-compose.override.yml`:

```yaml
services:
  dashboard:
    ports:
      - "4001:4000"
  n8n:
    ports:
      - "5679:5678"
  filter:
    ports:
      - "3001:3000"
```

---

## 8. Safety Procedures

### 8.1 The Makefile-only rule

**Never use raw `docker compose down -v`.** Always use `make` targets:

| Command | Effect |
|---|---|
| `make up` | Start services (safe) |
| `make down` | Stop services (safe — preserves volumes) |
| `make restart` | Restart services (safe) |
| `make rebuild` | Rebuild **all** services and restart (safe — uses `docker compose build` then `docker compose up -d`) |
| `make down-hard` | Nuclear option — destroys ALL volumes (IRREVERSIBLE) |

`make down-hard` requires typing `DESTROY` as confirmation.

### 8.2 Volume classification

| Volume | Criticality | Content | Recovery |
|---|---|---|---|
| `postgres_data` | **CRITICAL** | filter_log, audit history, CRM data | Manual backup only (`make export-all` / `deploy/backup.sh`) |
| `n8n_data` | **MANAGED** | Workflow configs, credentials | Must be exported to `workflows/n8n/*.json` |
| `engram_data` | **EPHEMERAL** | Contact memory, session state | Regeneratable but loses context |

### 8.3 Pre-shutdown checklist

Before any shutdown (especially `make down-hard`):

1. **Export n8n workflows:** Open n8n UI > Settings > Export All Workflows > JSON > Save each to `workflows/n8n/{action_id}.json`
2. **Verify exports:** `make verify-workflows` — all green
3. **Backup audit log:** `make export-all`
4. **Only then** use `make down` (safe) or `make down-hard` (destructive)

### 8.4 The source-control rule

**If it's not in source control, it doesn't exist.**

- Workflows built in n8n UI but never exported to `workflows/n8n/` are lost on volume destroy
- Audit log entries in `filter_log` are lost unless backed up via `make export-all`
- Engram contact memory is lost on volume destroy (recoverable from filter_log context but session state is gone)

---

## Appendix A: Quick Reference

### Service URLs (local dev)

| Service | URL |
|---|---|
| Dashboard | http://localhost:4000 |
| n8n | http://localhost:5678 |
| Filter health | http://localhost:3000/health |

### Common commands

```bash
# Start / Stop
make up
make down

# Rebuild
docker compose up -d --build <service>

# Logs
docker compose logs -f <service>

# SQL
docker compose exec postgres psql -U exnoria -d exnoria -c "SELECT ..."

# Health
./deploy/health-check.sh

# Backup
export BACKUP_PASSPHRASE=... && ./deploy/backup.sh ./backups

# Workflow verification
make verify-workflows

# Export audit log
make export-all
```

### Directory structure (quick map)

```
exnoria/
├── .env                          # Secrets (gitignored)
├── .env.example                  # Template with annotations
├── docker-compose.yml            # 5 services: postgres, n8n, filter, cognitive, dashboard
├── Makefile                      # Safe Docker wrapper
├── config/
│   ├── project.config.json       # Instance branding + model config
│   ├── project.config.example.json
│   └── seeds/*.sql               # Stage seed packs (loaded by scaffold)
├── docs/                         # Documentation
│   └── operational-guide.md      # This file
├── doc/
│   └── rfcs/                     # RFCs created by scaffold
├── layers/
│   ├── cognitive/                # Agentic core (TypeScript)
│   ├── orchestration/filter/     # Express filter service
│   └── dashboard/                # Next.js 16 dashboard
├── workflows/n8n/                # Exported workflow JSONs
├── deploy/
│   ├── init.sh                   # Guided instance initialization
│   ├── backup.sh                 # AES-256 encrypted backup
│   ├── restore.sh                # Restore from backup
│   ├── health-check.sh           # Full stack health check
│   ├── environments/{local,vps,edge}/  # Per-deployment overrides + templates
│   └── runbooks/{local-dev,vps,edge}.md # Full deployment guides
└── scripts/
    ├── scaffold-project.sh       # Env generation + seed loading
    ├── verify-workflows.sh       # Checks workflow exports
    └── sanitize-workflows.sh     # Strips secrets from workflow JSONs
```
