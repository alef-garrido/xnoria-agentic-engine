# Xnoria — CX Intelligence Engine

> Specialized Agentic Engine for customer experience operations.  
> Interprets signals, diagnoses problems, generates prioritized actions, executes safely.

---

## What this is

Xnoria is not an automation tool. It is an **operational intelligence engine** that sits above existing business systems — CRM, support, marketing — and coordinates three things that most companies do separately and badly: diagnosis, prioritization, and controlled execution.

The system follows one rule above all others:

> The cognitive layer decides. The orchestration layer executes. The human intervenes where it matters.

---

## Repository structure

```
xnoria/
├── packages/
│   ├── orchestration/          # n8n instance, filter service, workflow contracts
│   │   ├── filter/             # Deterministic filter — the contract between agent and execution
│   │   ├── workflows/          # n8n workflow definitions (exported JSON)
│   │   └── docker/             # n8n + postgres compose config
│   └── cognitive/              # Agentic core (OpenClaw integration)
│       ├── src/
│       └── Dockerfile
├── docker-compose.yml          # Full stack — single command to run everything
├── .env.example                # All required environment variables, documented
└── README.md                   # This file
```

### Package responsibilities

**`packages/orchestration/`**  
The n8n orchestration instance and everything that governs what it is allowed to execute. This package owns the filter service — the HTTP API that all cognitive layer action requests must pass through before reaching any workflow. It also holds workflow definitions as versioned JSON exports so the workflow state is reproducible from scratch.

**`packages/cognitive/`**  
The agentic core. Receives business signals, interprets them via LLM, produces structured action plans, and submits each action to the filter service. This package has no direct access to n8n, external CRMs, or any execution surface — it can only POST to the filter.

**`packages/orchestration/filter/`**  
A lightweight HTTP service (inside the orchestration package) that enforces the allowlist contract. Every action the cognitive layer wants to take must be declared in the `FILTER_ACTION` database table with `enabled = true` before it will execute. Unknown or disabled actions are rejected and logged. This is the security boundary of the system.

---

## Architecture

```
Signal input
     │
     ▼
┌─────────────────────────────┐
│  Cognitive layer            │  packages/cognitive/
│  Interprets · Plans         │  OpenClaw / LLM
└────────────┬────────────────┘
             │  POST /filter/execute
             ▼
┌─────────────────────────────┐
│  Filter service             │  packages/orchestration/filter/
│  Allowlist · Audit log      │  Express + Postgres
└────────────┬────────────────┘
             │  Webhook trigger
             ▼
┌─────────────────────────────┐
│  n8n workflows              │  packages/orchestration/workflows/
│  Executes · Reports         │  n8n
└─────────────────────────────┘
             │
             ▼
    External systems
    (CRM, sequences, comms)
```

Three architectural principles that are non-negotiable:

1. **The cognitive layer never calls external systems directly.** All actions exit through the filter.
2. **Every action is logged**, whether executed, rejected, or pending approval.
3. **The filter allowlist is managed at runtime** via the database, not by redeploying code.

---

## MVP scope

The current MVP targets the **ACQ/SAL journey stage** (acquisition and sales) with three workflows:

| Action ID | Description |
|---|---|
| `acq.lead.score` | Receives lead data, scores it, applies CRM tags |
| `sal.sequence.enroll` | Enrolls a contact in a sales outreach sequence |
| `sal.contact.prioritize` | Flags a contact for immediate SDR follow-up |

The win condition: a lead signal enters the cognitive layer, OpenClaw reasons about it, the filter validates each action, n8n executes the permitted ones, and every step is recorded in `FILTER_LOG`.

HITL (human-in-the-loop approval), dashboard integration, and additional journey stages are explicitly out of scope until the above is proven end-to-end.

---

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for the filter service and cognitive package)
- An Anthropic API key (for the cognitive layer LLM calls)

### Running the stack

```bash
# 1. Clone and enter the repo
git clone https://github.com/your-org/xnoria.git
cd xnoria

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum set ANTHROPIC_API_KEY and POSTGRES_PASSWORD

# 3. Start everything
docker compose up -d

# 4. Verify
# n8n:    http://localhost:5678
# Filter: http://localhost:3000/health
```

### Testing the filter independently

Before the cognitive layer exists, the filter can be tested directly:

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

Expected response when the action is in the allowlist and enabled:

```json
{
  "status": "executed",
  "log_id": "...",
  "workflow_result": { ... }
}
```

Expected response when the action is unknown or disabled:

```json
{
  "status": "rejected",
  "log_id": "...",
  "rejection_code": "ACTION_NOT_IN_ALLOWLIST",
  "message": "action_id 'acq.lead.score' is not permitted for stage ACQ"
}
```

---

## Environment variables

All variables are documented in `.env.example`. Required variables:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Postgres password (shared by n8n and filter) |
| `POSTGRES_DB` | Database name (default: `xnoria`) |
| `N8N_ENCRYPTION_KEY` | n8n credential encryption key — generate once, never change |
| `ANTHROPIC_API_KEY` | API key for cognitive layer LLM calls |
| `FILTER_PORT` | Port for the filter HTTP service (default: `3000`) |
| `N8N_BASE_URL` | Internal URL the filter uses to trigger n8n webhooks |

---

## Development

### Adding a new workflow

1. Build and test the workflow in n8n UI at `localhost:5678`
2. Export it as JSON and save to `packages/orchestration/workflows/`
3. Add a corresponding row to `FILTER_ACTION` in the seed file at `packages/orchestration/filter/db/seed.sql`
4. Test via curl against the filter endpoint

### Adding a new allowed action

Update `packages/orchestration/filter/db/seed.sql`:

```sql
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, enabled, description)
VALUES ('acq.lead.score', 'ACQ', 'your-n8n-webhook-id', false, true, 'Score incoming lead and tag in CRM');
```

At runtime, the `enabled` flag can be toggled directly in the database without redeploying.

---

## Roadmap

| Phase | Description | Status |
|---|---|---|
| 0 | Monorepo scaffold | In progress |
| 1 | n8n + Postgres running via Docker Compose | Pending |
| 2 | 3 ACQ/SAL workflows built and tested in n8n | Pending |
| 3 | Filter service + allowlist DB | Pending |
| 4 | OpenClaw stub + cognitive package | Pending |
| MVP win | Full chain: signal → reason → filter → execute → log | Pending |

---

## Design principles

These are from the PRD and govern every technical decision in this repo.

**Separation of decision and execution.** The cognitive layer decides. The orchestration layer executes. These responsibilities never mix.

**Security by architecture.** The agent is not trusted. The environment controls what can happen. No action reaches an external system without passing through the filter.

**Observable and auditable.** Every signal, diagnosis, decision, and action is recorded. The system must be reproducible and verifiable, not a black box.

**Modular and replaceable.** The cognitive core is swappable. Each package has isolated responsibilities. Changing the LLM provider or the orchestration tool should not require touching the other layers.

**Explainability over magic.** Every output of the system can be traced back to the signal that caused it. Rejection reasons are structured and recorded. Nothing happens silently.

---

## License

Private — Xnoria / Oscar Armando Perez Garrido. All rights reserved.
