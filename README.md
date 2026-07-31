# exnoria — CX Intelligence Engine
Especialized Agentic Engine for customer experience operations. Interprets signals, diagnoses problems, generates prioritized actions, executes safely

> Intelligence Engine for customer experience operations.  
> Interprets signals, diagnoses problems, generates prioritized actions, executes safely.

---

## What this is

Exnoria is not an automation tool. It is an **operational intelligence layer** that sits above existing business systems — CRM, support, marketing — and coordinates three things that most companies do separately and badly: diagnosis, prioritization, and controlled execution.

The system follows one rule above all others:

> The cognitive layer decides. The orchestration layer executes. The human intervenes where it matters.

---

## Repository structure

```
exnoria/
├── packages/
│   │
│   ├── dashboard/                        # Execution layer — CX Tool Dock
│   │   ├── signals/                      # Webhook ingestion, signal capture
│   │   ├── reporting/                    # State reporting, audit views
│   │   ├── dispatch/                     # Trigger push to orchestration layer
│   │   ├── hitl/                         # Human-in-the-loop approval queue
│   │   ├── shared/                       # Types and contracts shared across dashboard
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── orchestration/                    # Orchestration layer — n8n + filter
│   │   ├── filter/                       # Deterministic filter service
│   │   │   ├── allowlist/                # Allowlist lookup and runtime management
│   │   │   ├── execution/                # Workflow dispatch to n8n
│   │   │   ├── audit/                    # FILTER_LOG writes — every action recorded
│   │   │   ├── shared/                   # FilterRequest, FilterResponse types
│   │   │   ├── db/
│   │   │   │   ├── migrations/           # Versioned schema migrations
│   │   │   │   └── seed.sql              # Initial FILTER_ACTION rows (MVP workflows)
│   │   │   └── Dockerfile
│   │   ├── workflows/                    # n8n workflow definitions (exported JSON)
│   │   │   ├── acq.lead.score.json
│   │   │   ├── sal.sequence.enroll.json
│   │   │   └── sal.contact.prioritize.json
│   │   ├── contracts/                    # Action ID registry and stage definitions
│   │   │   └── actions.ts                # Single source of truth for all action IDs
│   │   ├── docker/                       # n8n + postgres compose config
│   │   └── README.md
│   │
│   └── cognitive/                        # Cognitive layer — agentic core (OpenClaw)
│       ├── signals/                      # Signal ingestion — what comes in
│       ├── plans/                        # Action plan generation — what the agent decides
│       ├── actions/                      # Action dispatch to the filter
│       ├── shared/                       # Types shared across cognitive layer
│       ├── Dockerfile
│       └── README.md
│
├── docker-compose.yml                    # Full stack — single command to run everything
├── .env.example                          # All required environment variables, documented
└── README.md                             # This file
```

---

## The three layers

### Execution layer (CX Tool Dock) — `packages/dashboard/`

The surface the outside world and human operators touch. Captures events and data from external systems, transforms them into structured CX signals, and feeds them into the cognitive layer. Also owns the HITL approval queue — the interface through which humans intervene in the agent's action plan before execution.

Organized by domain concept:

- `signals/` — inbound webhook ingestion, event normalization
- `reporting/` — audit views, operational dashboards, state visibility
- `dispatch/` — outbound triggers pushed to the orchestration layer
- `hitl/` — approval queue, human intervention interface

### Orchestration layer (Deterministic Filter) — `packages/orchestration/`

The system's nervous system. Coordinates all flows between the cognitive layer and external systems. Owns two things: the **filter service**, which is the enforcement boundary between intent and execution, and the **n8n workflow definitions**, which are the actual execution units.

The filter is the most critical piece of this layer. No action from the cognitive layer reaches n8n without passing through it. The filter checks the allowlist, routes to the correct workflow, logs the outcome, and returns a structured response. It never makes CX decisions — it only enforces what is permitted.

Organized by domain concept:

- `filter/allowlist/` — runtime allowlist lookup and management
- `filter/execution/` — webhook dispatch to n8n workflow by ID
- `filter/audit/` — FILTER_LOG writes on every action outcome
- `workflows/` — n8n workflow JSON exports, versioned in source control
- `contracts/` — the action ID registry, the single source of truth for what actions exist

### Cognitive layer (Agentic Core) — `packages/cognitive/`

The intelligence core. Receives business signals, reasons about them using an LLM (OpenClaw), and produces structured action plans. Has no direct access to any external system — its only output channel is `POST /filter/execute`. This is enforced by architecture, not by convention.

Organized by domain concept:

- `signals/` — signal ingestion and normalization
- `plans/` — LLM reasoning loop, action plan generation
- `actions/` — action dispatch, filter client, response handling

---

## Architecture

```
External systems / events
          │
          ▼
┌─────────────────────────────────┐
│  Execution layer                │  packages/dashboard/
│  Signals · Reporting · HITL     │  TypeScript app
└────────────┬────────────────────┘
             │  Structured CX signal
             ▼
┌─────────────────────────────────┐
│  Cognitive layer                │  packages/cognitive/
│  Interprets · Plans · Decides   │  OpenClaw / LLM
└────────────┬────────────────────┘
             │  POST /filter/execute
             ▼
┌─────────────────────────────────┐
│  Filter service                 │  packages/orchestration/filter/
│  Allowlist · Audit · Route      │  Express + Postgres
└────────────┬────────────────────┘
             │  Webhook trigger
             ▼
┌─────────────────────────────────┐
│  n8n workflows                  │  workflows/n8n/
│  Executes actions               │  n8n
└────────────┬────────────────────┘
             │
             ▼
    External systems
    (CRM, sequences, comms)
```

Three architectural principles that are non-negotiable:

1. **The cognitive layer never calls external systems directly.** All actions exit through the filter.
2. **Every action is logged**, whether executed, rejected, or pending human approval.
3. **The filter allowlist is managed at runtime** via the database, not by redeploying code.

---

## Domain language

These terms are used consistently across all packages, folder names, function names, database tables, and documentation. Do not substitute technical synonyms.

| Term | Meaning |
|---|---|
| **Signal** | A structured business event that enters the system — a new lead, a support ticket, a churn indicator |
| **Plan** | The cognitive layer's output — a prioritized list of actions to take in response to a signal |
| **Action** | A single permitted operation the system can request — always identified by `stage.resource.verb` |
| **Stage** | A phase in the customer journey — `ACQ`, `SAL`, `ONB`, `PRD`, `SUP`, `COM`, `RET`, `EXP` |
| **Session** | One reasoning cycle in the cognitive layer — groups all actions generated from a single signal |
| **Allowlist** | The set of actions currently permitted to execute — managed in the `FILTER_ACTION` table |
| **Audit log** | The immutable record of every action attempted — stored in `FILTER_LOG` |
| **HITL** | Human-in-the-loop — an action that requires human approval before execution |

---

## MVP scope

The current MVP targets the **ACQ/SAL journey stage** (acquisition and sales) with three workflows:

| Action ID | Stage | Description |
|---|---|---|
| `acq.lead.score` | ACQ | Receives lead data, scores it, applies CRM tags |
| `sal.sequence.enroll` | SAL | Enrolls a contact in a sales outreach sequence |
| `sal.contact.prioritize` | SAL | Flags a contact for immediate SDR follow-up |

The win condition: a lead signal enters the cognitive layer, OpenClaw reasons about it, the filter validates each action, n8n executes the permitted ones, and every step is recorded in `FILTER_LOG`.

Explicitly out of scope until the above is proven end-to-end:

- HITL approval queue
- Dashboard integration beyond signal ingestion
- MCP / NotebookLM context grounding
- Additional journey stages
- Any user-facing interface

---

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- An LLM API key

### First-time setup
Before running the stack for the first time, two values in .env must be set manually.

1. Copy the example file
```bash
cp .env.example .env
```

2. Set a Postgres password

Open .env and fill in POSTGRES_PASSWORD with any strong password of your choice.

3. Generate the n8n encryption key
```bash
openssl rand -hex 32
```
Copy the output and paste it as the value of N8N_ENCRYPTION_KEY in .env.
> This key encrypts all credentials stored inside n8n (API keys, webhooks, etc.).
> Generate it once and never change it. If it changes after n8n has stored 
> credentials, those credentials become permanently unreadable.
> Back it up in a password manager or secrets vault.

Your .env should look like this before proceeding:
```bash
POSTGRES_PASSWORD=your-strong-password-here
POSTGRES_DB=exnoria
N8N_ENCRYPTION_KEY=a1b2c3d4e5f6...  ← 64 hex characters
N8N_HOST=localhost
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678
```

### Running the full stack

```bash
# 1. Clone and enter the repo
git clone https://github.com/your-org/exnoria.git
cd exnoria

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum set LLM_API_KEY and POSTGRES_PASSWORD

# 3. Start everything
docker compose up -d

# 4. Verify services
# n8n:       http://localhost:5678
# Filter:    http://localhost:3000/health
# Dashboard: http://localhost:4000
```

### Testing each layer independently

**Test a workflow directly** (before the filter wraps it — Phase 2):

```bash
curl -X POST http://localhost:5678/webhook/acq-lead-score \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": "ct_001",
    "email": "test@example.com",
    "source": "landing_page"
  }'
```

**Test the filter directly** (before the cognitive layer exists — Phase 3):

```bash
curl -X POST http://localhost:3000/filter/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "acq.lead.score",
    "stage": "ACQ",
    "session_id": "test-session-001",
    "payload": {
      "contact_id": "ct_001",
      "email": "test@example.com",
      "source": "landing_page"
    }
  }'
```

Testing each layer independently before integration is intentional. If something breaks during integration, the failure is unambiguous.

---

## Environment variables

All variables are documented in `.env.example`. Required for the MVP:

| Variable | Used by | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | orchestration | Postgres password shared by n8n and filter |
| `POSTGRES_DB` | orchestration | Database name (default: `exnoria`) |
| `N8N_ENCRYPTION_KEY` | orchestration | n8n credential encryption — generate once, never rotate |
| `LLM_API_KEY` | cognitive | API key for LLM calls (OpenAI-compatible) |
| `FILTER_PORT` | orchestration | Filter HTTP service port (default: `3000`) |
| `N8N_BASE_URL` | orchestration | Internal URL the filter uses to trigger n8n webhooks |
| `DASHBOARD_PORT` | dashboard | Dashboard app port (default: `4000`) |

---

## Development workflows

### Adding a new n8n workflow

1. Build and test the workflow in the n8n UI at `localhost:5678`
2. Export it as JSON and save to `workflows/n8n/`
3. Register the action in `packages/orchestration/contracts/actions.ts`
4. Add a row to `packages/orchestration/filter/db/seed.sql`
5. Test via curl against the filter endpoint before running end-to-end

### Registering a new allowed action

In `packages/orchestration/filter/db/seed.sql`:

```sql
INSERT INTO filter_action (
  action_id, stage, n8n_workflow_id,
  requires_hitl, enabled, description
) VALUES (
  'acq.lead.score',
  'ACQ',
  'your-n8n-webhook-id',
  false,
  true,
  'Score incoming lead and apply CRM tags'
);
```

The `enabled` flag can be toggled in the database at runtime without redeploying.

### Adding a new journey stage

1. Add the stage to `JourneyStage` type in `packages/orchestration/contracts/actions.ts`
2. Define the permitted actions for that stage in the same file
3. Add corresponding seed rows to `filter/db/seed.sql`
4. Build the n8n workflows for that stage
5. Update this README's MVP scope table

---

## Roadmap

| Phase | Description | Status |
|---|---|---|
| 0 | Monorepo scaffold + README | Done |
| 1 | n8n + Postgres running via Docker Compose | Pending |
| 2 | 3 ACQ/SAL workflows built and tested in n8n | Pending |
| 3 | Filter service + allowlist DB | Pending |
| 4 | OpenClaw stub + cognitive package | Pending |
| MVP | Full chain: signal → reason → filter → execute → log | Pending |

---

## Design principles

**Separation of decision and execution.** The cognitive layer decides. The orchestration layer executes. These responsibilities never mix.

**Security by architecture.** The agent is not trusted. The environment controls what can happen. No action reaches an external system without passing through the filter.

**Observable and auditable.** Every signal, diagnosis, decision, and action is recorded. The system must be reproducible and verifiable, not a black box.

**Modular and replaceable.** The cognitive core is swappable. Each package has isolated responsibilities. Changing the LLM provider or the orchestration tool should not require touching the other layers.

**Domain language over technical language.** Folders, files, functions, and database tables are named after domain concepts — signals, plans, actions, stages — not after technical roles like controllers, services, or helpers.

**Explainability over magic.** Every output of the system can be traced back to the signal that caused it. Rejection reasons are structured and recorded. Nothing happens silently.

---

## Deployment

### Quick start (any environment)

```bash
git clone https://github.com/your-org/xnoria.git
cd xnoria
chmod +x deploy/init.sh deploy/health-check.sh deploy/backup.sh deploy/restore.sh
./deploy/init.sh
```

The init script detects your target environment, generates secrets, prompts for credentials, runs migrations, starts the stack, and runs a health check — all in one command.

### Environment-specific guides

| Environment | Guide | Use case |
|---|---|---|
| Local development | [deploy/runbooks/local-dev.md](deploy/runbooks/local-dev.md) | Developer workstation, testing |
| VPS | [deploy/runbooks/vps.md](deploy/runbooks/vps.md) | Ubuntu 24 on DigitalOcean/Hetzner/Vultr, public HTTPS |
| Edge device | [deploy/runbooks/edge.md](deploy/runbooks/edge.md) | Intel NUC, Raspberry Pi 4/5, local network |

### Instance templating

Each client or project gets its own isolated Xnoria instance — no shared state, no shared credentials.

To deploy a new instance:

1. Clone the repo to the target machine
2. Run `./deploy/init.sh` with the appropriate environment (`local`, `vps`, or `edge`)
3. Fill in client-specific credentials when prompted
4. The instance is fully isolated from all other deployments

### Backup and restore

```bash
# Create an encrypted backup
export BACKUP_PASSPHRASE='your-secure-passphrase'
./deploy/backup.sh

# Restore from backup
./deploy/restore.sh backups/xnoria_backup_YYYYMMDD_HHMMSS.sql.gz.enc
```

Backups are AES-256-CBC encrypted. Never commit backup files or your `BACKUP_PASSPHRASE` to source control.

### Health check

```bash
./deploy/health-check.sh
```

Validates all services are operational: Postgres, n8n, filter, dashboard, cognitive container, filter actions, pgvector extension, and Telegram bot connectivity.

---

## License

Private — exnoria / Oscar Armando Perez Garrido. All rights reserved.