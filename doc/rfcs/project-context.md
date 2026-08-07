Here's a structured memory document the subagent can save to Engram. Written in the format Engram expects — structured, scannable, decision-dense.

---

**Save as:** `mem_save` with title `"Xnoria Architecture & Domain Constraints"`, type `"architecture"`

---

## Xnoria Agentic Engine — Architecture & Domain Memory

### What this system is

Xnoria (also spelled Exnoria in code) is a CX Intelligence Engine — an operational layer that sits above CRM, support, and marketing systems. It diagnoses customer experience problems using the CX Diagnostic Compass framework, decides on interventions, and executes them through controlled automation. The business context is B2B SaaS customer success — the contacts being acted on are real paying customers moving through a defined journey.

### The three-layer monorepo — inviolable structure

```
xnoria-agentic-engine/
├── layers/
│   ├── cognitive/        ← decides: LLM reasoning, tool definitions, MCP clients
│   ├── orchestration/    ← routes: filter service (Express), n8n workflow registry
│   │   └── filter/
│   └── dashboard/        ← surfaces: Next.js operator UI, HITL, allowlist, health, memory
├── workflows/
│   └── n8n/              ← n8n workflow JSON exports, named by action_id
├── docker-compose.yml
├── .env / .env.example
└── AGENTS.md
```

**Hard rules on structure:**

- Never create new directories inside `layers/` — there are exactly three layers and that will not change until Phase 5
- External tools and services (MemPalace, PostHog, Compass MCP) are infrastructure — they run as Docker sidecar containers or stdio processes, they do not get a folder in `layers/`
- New source files belong inside an existing layer's `src/` — if it doesn't fit, that's a signal the abstraction is wrong, not that a new layer is needed
- `workflows/n8n/` is for n8n JSON exports only, named `{action_id}.json` — no other files go here except `README.md` and `DEFERRED.md`

### The three non-negotiable architectural principles

1. **The cognitive layer never calls external systems directly.** All write actions exit through `POST /filter/execute`. Read-only context retrieval (MemPalace, PostHog, Compass) goes through MCP tools — these are not filter actions.
2. **Every action is logged.** The `filter_log` table is the authoritative audit record. n8n logging is secondary.
3. **The filter allowlist is managed at runtime via the database**, not by redeploying code. Enable/disable actions through the `/allowlist` dashboard page.

### The signal-to-action flow

```
External event → CXEvent (cognitive layer)
  → stage-aware tool selection (filter TOOLS by event.stage)
  → pre-processing: MemPalace history fetch + Compass signal lookup (deterministic, no LLM)
  → LLM call with filtered toolset + context block (≤800 tokens)
  → LLM selects action tool
  → POST /filter/execute (orchestration layer)
  → filter checks allowlist → HITL gate → n8n dispatch
  → memory write to MemPalace (fire-and-forget, never throws)
```

### Domain language — use these terms in all code and files

| Term      | Meaning                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------- |
| Signal    | A structured CX pain point from the Compass framework, identified by `signal_id` e.g. `ONB_FRC_01` |
| Stage     | Customer journey phase: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP                                     |
| Action    | A single executable intervention: `stage.resource.verb` e.g. `onb.contact.nudge`                   |
| Plan      | The cognitive layer's output — which action to take for a signal                                   |
| Session   | One reasoning cycle — one CXEvent in, one filter dispatch out                                      |
| Allowlist | The `filter_action` table — what actions are permitted to execute                                  |
| Audit log | The `filter_log` table — immutable record of every attempt                                         |
| HITL      | Human-in-the-loop — operator approval required before execution                                    |

### The CX Diagnostic Compass framework

Signal IDs follow the pattern `{DOMAIN}_{CAUSE}_{SEQUENCE}` e.g. `PRD_FRC_02`.
Intervention IDs follow `INT_{DOMAIN}_{CAUSE}_{SIGNAL}_{OPTION}` e.g. `INT_PRD_FRC_02_A`.
Option A = quick win, B = mid-level investment, C = strategic long-term.
Severity is 0–1. Critical = >0.8, High = 0.6–0.8, Medium = 0.4–0.6, Low = <0.4.

Active domains and their causes:

- ACQ: VIS, CLR, TRU
- SAL: CLR, VAL, TRU
- ONB: FRC, CLR, CAP
- PRD: FRC, CAP, CST
- SUP: RES, CAP, CST
- COM: REL, RES, CST
- RET: VAL, REL, TRU
- EXP: GRW, VAL, REL

Signals that are NOT automated (structural/product-level, not per-contact):

- `PRD_CST_01` variable performance
- `PRD_CST_02` bugs
- `PRD_CAP_02` feature requests → logged to HubSpot only, no contact action

### Tool classification — two types, never mix in one LLM turn

**Context retrieval tools** (`TOOL_TO_ACTION` value = `null`):

- `mempalace_search`, `mempalace_kg_query`, `mempalace_add_drawer`, `mempalace_kg_add`
- `compass_get_signal`, `compass_get_interventions`
- `posthog_get_contact_events`, `posthog_get_feature_adoption`
- `reply`

These are called by pre-processing code (not the LLM loop) or returned by the LLM only before a filter action is selected. If the LLM returns a context tool and a filter action in the same turn, that is an error — reject it.

**Filter action tools** (`TOOL_TO_ACTION` value = `{ action_id, stage }`):

- All `acq.*`, `sal.*`, `onb.*`, `prd.*`, `sup.*`, `com.*`, `ret.*`, `exp.*` tools
- These exit through `POST /filter/execute` — never called directly

### Active action registry (19 enabled, 1 placeholder)

| Action ID                | Stage | HITL                                       |
| ------------------------ | ----- | ------------------------------------------ |
| `acq.lead.engage`        | ACQ   | No                                         |
| `acq.lead.nurture`       | ACQ   | No                                         |
| `acq.contact.outreach`   | ACQ   | Yes                                        |
| `sal.sequence.enroll`    | SAL   | No                                         |
| `sal.contact.prioritize` | SAL   | Yes                                        |
| `sal.contact.message`    | SAL   | No                                         |
| `sal.lead.handoff`       | SAL   | No — deferred, dead-end node not yet fixed |
| `onb.document.request`   | ONB   | No                                         |
| `onb.document.validate`  | ONB   | No                                         |
| `onb.contact.nudge`      | ONB   | No                                         |
| `onb.contact.assist`     | ONB   | Yes                                        |
| `onb.ticket.escalate`    | ONB   | No                                         |
| `prd.friction.flag`      | PRD   | No — maps to prd.contact.nudge workflow    |
| `prd.adoption.nudge`     | PRD   | No — maps to prd.contact.educate workflow  |
| `prd.feedback.log`       | PRD   | No                                         |
| `sup.ticket.escalate`    | SUP   | No                                         |
| `sup.contact.notify`     | SUP   | Yes                                        |
| `com.content.publish`    | COM   | Yes                                        |
| `ret.contact.winback`    | RET   | Yes                                        |
| `ret.account.flag`       | RET   | No                                         |
| `exp.account.flag`       | EXP   | No — disabled placeholder                  |

### Infrastructure — what runs where

| Service     | Type                       | Purpose                                            |
| ----------- | -------------------------- | -------------------------------------------------- |
| `cognitive` | Docker container (Node.js) | LLM reasoning, Telegram channel, MCP clients       |
| `filter`    | Docker container (Express) | Allowlist check, audit log, n8n dispatch           |
| `dashboard` | Docker container (Next.js) | Operator UI                                        |
| `postgres`  | Docker container           | filter_log, filter_action, cognitive memory tables |
| `n8n`       | Docker container           | Workflow execution engine                          |
| `mempalace` | Docker sidecar (Python)    | Contact memory, semantic search — NOT in layers/   |

MemPalace, PostHog MCP, and Compass MCP server are infrastructure — they are not layers. MemPalace runs as a sidecar container. PostHog connects via API key. Compass MCP runs as a stdio process inside the cognitive container.

### Development workflow — cognitive layer

```bash
cd layers/cognitive
npx tsc --noEmit          # verify no errors
npx tsc                   # emit to dist/
# volume mount makes dist/ available to container immediately
docker compose restart cognitive
docker exec exnoria_cognitive grep -r "function_name" /app/dist/  # verify new code is live
```

Never restart the container with a compilation failure. Never assume restart picks up image changes — use `docker compose up -d --force-recreate cognitive` when `docker-compose.yml` changes (new volumes, env vars, etc.).

### Migration conventions

- Files: `layers/orchestration/filter/db/migrations/NNN_description.sql`
- Always create new migration files, never modify existing ones
- `ON CONFLICT (action_id) DO UPDATE` — never update `enabled` on conflict (preserves operator state)
- `seed.sql` is for MVP bootstrap only — phase expansions go in numbered migrations
- Current highest migration: 008 (update workflow IDs placeholder)

### Deferred items (do not implement without explicit RFC)

- `sal.lead.handoff` — OutOfHours handoff path, needs CRM write before activation
- `WhatsApp_Decision_Engine` — contains inline Gemini decision agent, deferred to Phase 4
- Stage-level kill switch (D3) — `filter_stage` table, stage gate overrides action gate, deferred to Phase 3
- `exp.account.flag` — placeholder only, EXP workflows deferred to Phase 4
- B3 PostHog integration — requires `distinct_id` = HubSpot `contact_id` mapping confirmed before wiring

### Roadmap phase status

- Phase 1 ✅ — HITL, allowlist manager, workflow source control
- Phase 2 ✅ — SUP + RET workflows, agent toolset, health map
- Phase 2.5 ✅ — full stage coverage, workflow integration
- Phase 3 A3 ✅ — ONB + PRD workflows
- Phase 3 B3/C3 🔄 — PostHog MCP, Compass MCP, MemPalace contact memory (in progress)
- Phase 4 — COM + EXP workflows, multi-agent coordination, role-based access
- Phase 5 — instance templating, multi-env deployment
