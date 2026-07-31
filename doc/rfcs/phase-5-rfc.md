# RFC-002 — Xnoria Phase 5: Portability + Productization

**Status:** Open — awaiting implementation  
**Author:** Xnoria Architecture (orchestrated)  
**Date:** 2026-04-16  
**Depends on:** RFC-001 (dashboard), Phases 1–4 complete  
**Monorepo:** `xnoria-agentic-engine`

---

## Context

Xnoria is a CX Intelligence Engine built as a three-layer Docker Compose stack:

- **Cognitive layer** — OpenClaw agent runtime, Telegram channel, LLM via Groq (Qwen3-32b), vector memory via pgvector
- **Orchestration layer** — deterministic filter service (Express/TypeScript) + n8n workflows
- **Dashboard layer** — Next.js 16 operational dashboard (TenacitOS-derived)

The stack currently runs as a single monorepo instance on a local development machine. Phase 5 transforms it into a **distributable, templatable product** that can be deployed to multiple environments (VPS, edge device, local dev) and handed to clients with minimal configuration effort.

The two deliverables are:

1. **Instance templating** — a mechanism to deploy a new Xnoria instance from a single command with environment-specific configuration
2. **Multi-environment deployment guides** — runbooks for VPS, edge device (mini PC / Raspberry Pi), and local dev deployments

---

## Objectives

- A new Xnoria instance can be deployed in under 30 minutes by a developer who has never seen the codebase
- Client instances are isolated from each other — no shared state, no shared credentials
- Environment differences (VPS vs edge vs local) are handled by configuration, not by code changes
- The stack is reproducible: destroying and recreating an instance produces an identical system
- Secrets are never committed to source control

---

## Scope

### In scope

- `deploy/` directory at monorepo root with all deployment tooling
- Instance initialization script (`init.sh`)
- Environment template system (per-environment `.env` files)
- Docker Compose overrides for each target environment
- Deployment runbooks for three environments: VPS, edge device, local dev
- Reverse proxy configuration (Caddy) for HTTPS in VPS and edge deployments
- Backup and restore scripts for Postgres data
- Health check script that validates a deployment end-to-end
- `README.md` update to reflect multi-environment deployment

### Out of scope

- Kubernetes or container orchestration beyond Docker Compose
- CI/CD pipeline automation
- Multi-tenant data isolation within a single instance (each client gets their own instance)
- Billing or license management
- Automated provisioning of VPS infrastructure

---

## Proposed directory structure

```
xnoria/
├── deploy/
│   ├── init.sh                        # Instance initialization — run once per new deployment
│   ├── health-check.sh               # Validates full stack end-to-end
│   ├── backup.sh                     # Postgres backup to local or remote
│   ├── restore.sh                    # Postgres restore from backup
│   ├── environments/
│   │   ├── local/
│   │   │   ├── .env.template         # Local dev environment template
│   │   │   └── docker-compose.override.yml
│   │   ├── vps/
│   │   │   ├── .env.template         # VPS environment template
│   │   │   ├── docker-compose.override.yml
│   │   │   └── Caddyfile             # Reverse proxy config for HTTPS
│   │   └── edge/
│   │       ├── .env.template         # Edge device environment template
│   │       ├── docker-compose.override.yml
│   │       └── Caddyfile
│   └── runbooks/
│       ├── local-dev.md              # Local development deployment guide
│       ├── vps.md                    # VPS deployment guide (Ubuntu 24 LTS)
│       └── edge.md                  # Edge device guide (mini PC / Raspberry Pi)
├── docker-compose.yml                # Base compose — environment-agnostic
├── .env.example                      # Master env template (already exists)
└── README.md                         # Updated with deployment section
```

---

## Environment differences

The three target environments have different constraints that affect deployment:

| Concern | Local dev | VPS | Edge device |
|---|---|---|---|
| HTTPS | No — localhost only | Yes — Caddy + domain | Yes — Caddy + local domain or self-signed |
| Ports exposed | All (dev convenience) | Only 80/443 via proxy | Only 80/443 via proxy |
| n8n access | localhost:5678 direct | Behind proxy at subdomain | Behind proxy at local domain |
| Resources | High (dev machine) | Constrained by plan | Constrained (4-8GB RAM) |
| Persistence | Local volumes | Remote volumes or attached disk | Local SD/SSD |
| Restart policy | `no` or `unless-stopped` | `always` | `always` |
| Backups | Optional | Required | Required |
| OpenClaw sandbox | Disabled (dev) | Enabled | Enabled |
| Telegram polling | Active | Active | Active |
| Dashboard auth | Permissive | Strict (HTTPS cookie) | Strict |

Docker Compose overrides handle these differences without touching the base `docker-compose.yml`.

---

## Deliverables

### Deliverable 1 — `deploy/init.sh`

The initialization script runs once when setting up a new Xnoria instance. It must:

1. Detect the target environment (prompt: local / vps / edge)
2. Copy the appropriate `.env.template` to `.env` at monorepo root
3. Generate secrets automatically:
   - `N8N_ENCRYPTION_KEY` — `openssl rand -hex 32`
   - `DASHBOARD_AUTH_SECRET` — `openssl rand -hex 32`
4. Prompt for required credentials that cannot be generated:
   - `POSTGRES_PASSWORD`
   - `DASHBOARD_ADMIN_PASSWORD`
   - `LLM_API_KEY` (Groq)
   - `EMBEDDING_API_KEY` (Google)
   - `HUBSPOT_PRIVATE_APP_TOKEN`
   - `HUBSPOT_PORTAL_ID`
   - `META_WA_TOKEN`
   - `META_PHONE_NUMBER_ID`
   - `SDR_WHATSAPP_NUMBER`
   - `TELEGRAM_BOT_TOKEN`
5. Write all values into `.env`
6. Run the database migrations:
   ```bash
   docker compose up -d postgres
   # wait for healthy
   docker compose exec postgres psql -U xnoria -d xnoria < packages/orchestration/filter/db/migrations/001_create_filter_tables.sql
   docker compose exec postgres psql -U xnoria -d xnoria < packages/orchestration/filter/db/migrations/002_seed_filter_actions.sql
   docker compose exec postgres psql -U xnoria -d xnoria < packages/cognitive/db/migrations/003_create_memory_tables.sql
   ```
7. Start the full stack: `docker compose up -d`
8. Run the health check: `./deploy/health-check.sh`
9. Print a summary of all running services and their URLs

The script must be idempotent — running it twice on an existing deployment must not destroy data or overwrite existing secrets.

---

### Deliverable 2 — `deploy/health-check.sh`

Validates the full stack is operational. Must check:

| Check | Pass condition |
|---|---|
| Postgres | `pg_isready` returns healthy |
| n8n | `GET http://localhost:5678/healthz` returns 200 |
| Filter service | `GET http://localhost:3000/health` returns `{"status":"ok"}` |
| Dashboard | `GET http://localhost:4000/api/health` returns 200 |
| Cognitive container | `docker inspect xnoria_cognitive` shows running |
| filter_action rows | `SELECT COUNT(*) FROM filter_action WHERE enabled = true` returns >= 3 |
| pgvector extension | `SELECT extname FROM pg_extension WHERE extname = 'vector'` returns 1 row |
| Telegram bot | `GET https://api.telegram.org/bot{TOKEN}/getMe` returns `ok: true` |

Exit code 0 if all checks pass. Exit code 1 with a summary of failed checks if any fail.

---

### Deliverable 3 — `deploy/backup.sh` and `deploy/restore.sh`

**backup.sh:**

```bash
# Usage: ./deploy/backup.sh [output-dir]
# Default output: ./backups/xnoria_backup_YYYYMMDD_HHMMSS.sql.gz
```

Must:
- Dump all Xnoria tables from Postgres using `pg_dump`
- Compress with gzip
- Print backup file path and size on completion
- Support optional upload to an S3-compatible bucket (read `BACKUP_S3_BUCKET` from `.env` if set)

**restore.sh:**

```bash
# Usage: ./deploy/restore.sh <backup-file>
```

Must:
- Accept a `.sql.gz` backup file as argument
- Warn that this will overwrite current data and prompt for confirmation
- Stop the cognitive and filter containers before restore (prevent writes during restore)
- Restore via `pg_restore` or `psql`
- Restart all containers after restore
- Run health check to confirm restored state is valid

---

### Deliverable 4 — Docker Compose overrides

#### `deploy/environments/local/docker-compose.override.yml`

- All ports exposed directly (5432, 5678, 3000, 4000)
- `restart: unless-stopped` for postgres and n8n, `restart: no` for cognitive (manual runs)
- No Caddy service
- `N8N_BLOCK_ENV_ACCESS_IN_NODE: false` (already in base, confirm it's present)

#### `deploy/environments/vps/docker-compose.override.yml`

- Postgres port NOT exposed externally (internal network only)
- n8n port NOT exposed externally (proxied via Caddy)
- Dashboard port NOT exposed externally (proxied via Caddy)
- Filter port NOT exposed externally (internal only — only n8n and dashboard call it)
- `restart: always` on all services
- Caddy service added:
  ```yaml
  caddy:
    image: caddy:2-alpine
    container_name: xnoria_caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/environments/vps/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_certs:/etc/caddy/certs
    networks:
      - xnoria_internal
  ```

#### `deploy/environments/edge/docker-compose.override.yml`

- Same as VPS but with memory limits per service to respect constrained hardware:
  ```yaml
  postgres:
    deploy:
      resources:
        limits:
          memory: 512m
  n8n:
    deploy:
      resources:
        limits:
          memory: 512m
  cognitive:
    deploy:
      resources:
        limits:
          memory: 256m
  filter:
    deploy:
      resources:
        limits:
          memory: 128m
  dashboard:
    deploy:
      resources:
        limits:
          memory: 256m
  ```

---

### Deliverable 5 — Caddyfile (VPS and edge)

#### `deploy/environments/vps/Caddyfile`

```caddy
{$N8N_HOST} {
    reverse_proxy n8n:5678
}

{$DASHBOARD_HOST} {
    reverse_proxy dashboard:4000
}
```

Environment variables `N8N_HOST` and `DASHBOARD_HOST` are read from `.env` and must be added to both `.env.example` and the VPS `.env.template`. These are the public domain names (e.g. `n8n.yourdomain.com`, `dashboard.yourdomain.com`).

Caddy handles TLS certificate provisioning automatically via Let's Encrypt. No manual certificate management required.

#### `deploy/environments/edge/Caddyfile`

Same structure as VPS but supporting local hostnames (e.g. `xnoria.local`) with self-signed certificates when no public domain is available. Must include a `tls internal` directive for local deployments.

---

### Deliverable 6 — Environment templates

#### `deploy/environments/local/.env.template`

Copy of `.env.example` with:
- `N8N_HOST=localhost`
- `N8N_PROTOCOL=http`
- `N8N_WEBHOOK_URL=http://localhost:5678`
- `DASHBOARD_PORT=4000`
- All secrets left blank (filled by `init.sh`)
- Comments indicating local-only limitations (no HTTPS, no external webhooks without tunneling)

#### `deploy/environments/vps/.env.template`

Copy of `.env.example` with additional variables:
- `N8N_HOST=` (prompt: your n8n subdomain)
- `N8N_PROTOCOL=https`
- `N8N_WEBHOOK_URL=https://{N8N_HOST}`
- `DASHBOARD_HOST=` (prompt: your dashboard subdomain)
- `BACKUP_S3_BUCKET=` (optional)
- `BACKUP_S3_REGION=` (optional)

#### `deploy/environments/edge/.env.template`

Copy of VPS template with:
- `N8N_HOST=xnoria-n8n.local` (default local hostname)
- `DASHBOARD_HOST=xnoria.local` (default local hostname)
- Memory limit variables pre-set for 4GB RAM devices

---

### Deliverable 7 — Runbooks

Each runbook is a step-by-step deployment guide for its environment. Written for a developer who understands Docker but may not be familiar with Xnoria internals.

#### `deploy/runbooks/local-dev.md`

Sections:
1. Prerequisites (Docker Desktop, Node.js 20+, git)
2. Clone and initialize (`git clone` + `./deploy/init.sh local`)
3. Verify services
4. Development workflow (how to rebuild a single service, how to view logs, how to run SQL queries)
5. Updating the stack (`git pull` + `docker compose up -d --build`)
6. Common issues and fixes (reference the common errors from SKILL.md)

#### `deploy/runbooks/vps.md`

Target: Ubuntu 24.04 LTS on any VPS provider (DigitalOcean, Hetzner, Vultr, etc.)

Sections:
1. Prerequisites (VPS with 2GB+ RAM, domain name with DNS access, SSH access)
2. Server preparation:
   - Install Docker Engine (not Docker Desktop)
   - Configure UFW firewall (allow 22, 80, 443 only)
   - Create a non-root user with Docker group membership
   - Configure SSH key authentication, disable password login
3. DNS configuration (A records for n8n and dashboard subdomains)
4. Clone and initialize (`git clone` + `./deploy/init.sh vps`)
5. Start with VPS override: `docker compose -f docker-compose.yml -f deploy/environments/vps/docker-compose.override.yml up -d`
6. Verify HTTPS is working for both subdomains
7. Set up automated backups (cron job calling `backup.sh`)
8. Monitoring (checking logs, checking health)
9. Updating the stack

#### `deploy/runbooks/edge.md`

Target: Intel NUC, Beelink mini PC, or Raspberry Pi 4/5 (4GB+ RAM recommended)

Sections:
1. Prerequisites (Ubuntu Server 24.04 or Raspberry Pi OS Lite 64-bit, Docker Engine, local network with static IP)
2. Hardware-specific notes (SD card vs SSD for Raspberry Pi, thermal considerations)
3. Local DNS setup (configure router to resolve `xnoria.local` to the device IP)
4. Initialize: `./deploy/init.sh edge`
5. Start with edge override
6. Accessing the stack from other devices on the local network
7. Handling self-signed certificate trust on client browsers
8. Auto-start on boot (systemd service or Docker `restart: always`)
9. Performance tuning for constrained hardware

---

### Deliverable 8 — README.md deployment section

Add a **Deployment** section to the monorepo `README.md` after the existing Getting Started section:

```markdown
## Deployment

### Quick start (any environment)

    git clone https://github.com/your-org/xnoria.git
    cd xnoria
    ./deploy/init.sh

The init script will prompt for your target environment and guide you through configuration.

### Environment-specific guides

- [Local development](deploy/runbooks/local-dev.md)
- [VPS deployment](deploy/runbooks/vps.md)
- [Edge device deployment](deploy/runbooks/edge.md)

### Instance templating

Each client or project gets its own Xnoria instance. To deploy a new instance:

1. Clone the repo to the target machine
2. Run `./deploy/init.sh` with the appropriate environment
3. Fill in client-specific credentials when prompted
4. The instance is fully isolated — no shared state with other instances
```

---

## New environment variables required

Add these to `.env.example` under a new `# Deployment` section:

```bash
# ------------------------------------------------------------------------------
# Deployment
# ------------------------------------------------------------------------------

# Public hostname for n8n (VPS and edge only)
# N8N_HOST=n8n.yourdomain.com

# Public hostname for the dashboard (VPS and edge only)
# DASHBOARD_HOST=dashboard.yourdomain.com

# S3-compatible backup destination (optional)
# BACKUP_S3_BUCKET=
# BACKUP_S3_REGION=
# BACKUP_S3_ACCESS_KEY=
# BACKUP_S3_SECRET_KEY=
```

---

## Constraints

- `init.sh` must run on macOS and Linux without modification. No PowerShell or Windows-specific syntax.
- All scripts must use `#!/usr/bin/env bash` and `set -euo pipefail`.
- No new Docker images beyond what already exists in the stack. Caddy uses the official `caddy:2-alpine` image.
- Backup files must never contain plaintext credentials — only data.
- The `deploy/` directory must be fully self-contained. No script should depend on tools not present in a fresh Ubuntu 24 install plus Docker Engine.
- Client `.env` files are never committed. `.gitignore` must exclude all `.env` files except `.env.example` and `.env.template` files.

---

## Definition of done

- [ ] `deploy/init.sh` runs cleanly on macOS and Ubuntu 24 for all three environment targets
- [ ] `deploy/health-check.sh` exits 0 on a healthy stack, exits 1 with clear failure output on an unhealthy stack
- [ ] `deploy/backup.sh` produces a valid gzipped Postgres dump
- [ ] `deploy/restore.sh` restores from a backup produced by `backup.sh` and passes health check after restore
- [ ] VPS Docker Compose override hides all internal ports correctly — only 80/443 exposed
- [ ] Edge Docker Compose override applies memory limits and confirms stack starts on a 4GB RAM device
- [ ] Caddy successfully provisions TLS certificates for VPS deployment (tested with a real domain)
- [ ] All three runbooks have been walk-tested — a fresh deployment following the runbook produces a healthy stack as confirmed by `health-check.sh`
- [ ] README.md deployment section added
- [ ] `.env.example` updated with new deployment variables
- [ ] `.gitignore` confirmed to exclude all `.env` files except templates and examples

---

## Open questions for sub-agent

Before implementing Deliverables 1–8, answer these:

1. What shell is available on the target machines? Confirm `bash` 5.x is available on both macOS (via Homebrew) and Ubuntu 24.

2. Should `init.sh` support non-interactive mode (all values passed as environment variables) for CI/CD use, or is interactive-only sufficient for Phase 5?

3. For the VPS Caddyfile, should n8n and the dashboard share a single domain with path-based routing (e.g. `yourdomain.com/n8n`, `yourdomain.com/dashboard`), or subdomain-based routing (e.g. `n8n.yourdomain.com`, `dashboard.yourdomain.com`)? Subdomain routing is recommended — specify which to implement.

4. For edge deployments, is mDNS (`.local` hostnames via Avahi) available on the target devices, or should the runbook instruct users to configure static IPs and local DNS at the router level?

5. Should backup files be encrypted before storage? If yes, specify the encryption method (`openssl enc`, `age`, or `gpg`).

---

## Deliverable format

Return all script files as complete, executable content — no truncation, no placeholders, no `# TODO` comments. Each file clearly labeled with its target path in the monorepo.

Return runbooks as complete markdown documents — step-by-step, tested-sequence only. No speculative or conditional prose.

Do not summarize. Do not explain what you are about to do. Answer the open questions first, then deliver the artifacts in order.