# RFC: Phase 3 — B3 + C3 Intelligence Deepening

**Status:** Ready for Implementation  
**Date:** April 2026  
**Scope:** PostHog MCP for signal monitoring, Compass MCP for domain knowledge grounding, and MemPalace for contact memory and semantic search.

---

## Executive Summary

Phase 3 B3 and C3 complete the intelligence layer of Exnoria. Currently the cognitive layer reasons from sparse CRM tags and manually constructed `CXEvent` payloads. After this phase:

- **B3** grounds the agent in two live data sources: PostHog (real product usage signals mapped to Compass indicators) and a Compass MCP server (the full signal/intervention vocabulary queryable at runtime rather than as static vendored code)
- **C3** gives the agent persistent contact memory via MemPalace — a structured, semantically searchable record of every signal detected, action taken, and outcome observed per contact, organized by journey stage

These two tracks are independent and can run in parallel.

---

## Architectural Context

### What changes in the reasoning cycle

Currently the agent receives a `CXEvent` and reasons from it cold — no history of what happened to this contact before, no live signal data, no ability to look up what a Compass intervention actually recommends. After B3 + C3:

```
CXEvent arrives
    │
    ▼
Agent calls mempalace_search (wing=contact_id, room=stage)
    → retrieves contact's signal history for this stage
    │
    ▼
Agent calls compass_get_signal (signal_id from CXEvent)
    → retrieves severity, cause, interventions at runtime
    │
    ▼
Agent calls posthog_get_contact_events (contact_id)
    → retrieves live usage events confirming or contradicting the signal
    │
    ▼
Agent reasons with full context → selects action → dispatches via filter
    │
    ▼
Agent calls mempalace_kg_add
    → records: contact acted on, signal detected, action taken, timestamp
```

This is a fundamentally richer reasoning cycle. The agent stops guessing and starts knowing.

### Three Non-Negotiable Principles — unchanged

B3 and C3 add context retrieval to the cognitive layer. They do not change the execution path. The filter still enforces the allowlist. Every action still exits through `POST /filter/execute`. The cognitive layer still cannot call external systems directly — it calls MCP tools that are read-only data sources, and it calls filter actions that are write operations. Read vs write. Context vs execution. These are different paths and must stay separate.

---

## Track B3 — MCP Context Grounding

### B3.1 — PostHog MCP Integration

#### What PostHog provides

PostHog tracks user behavior at the event level. In Exnoria's context, the relevant events map directly to Compass indicators:

| Compass Indicator                            | PostHog Event                                                     |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `feature_adoption_rate` (PRD-FRC)            | `feature_used`, `feature_first_used`                              |
| `task_abandonment` (PRD-FRC)                 | `task_started` without subsequent `task_completed`                |
| `drop_off_rate` (ONB-FRC)                    | `onboarding_step_viewed` without `onboarding_step_completed`      |
| `time_to_first_value` (ONB-FRC)              | Time between `account_created` and first meaningful feature event |
| `help_article_views_in_onboarding` (ONB-CLR) | `help_article_viewed` during onboarding window                    |
| `onboarding_completion_rate` (ONB-CAP)       | `onboarding_completed` event presence                             |
| `feature_request_volume` (PRD-CAP)           | `feature_requested` event count                                   |

#### PostHog MCP server

PostHog has an official MCP server. It exposes PostHog's query API over MCP, allowing the cognitive layer to:

- Query events for a specific contact (`distinct_id` = `contact_id`)
- Run funnel queries to detect drop-off
- Retrieve feature flag states
- Access session recordings metadata

**Integration approach:**

Add PostHog MCP server to the cognitive layer's MCP configuration. The server connects to the PostHog instance (self-hosted or cloud) via API key.

**New environment variables:**

```
POSTHOG_API_KEY=<posthog-personal-api-key>
POSTHOG_HOST=<https://your-posthog-instance>  # or https://app.posthog.com
POSTHOG_PROJECT_ID=<project-id>
```

Add to `docker-compose.yml` cognitive service environment and `.env.example`.

**Contact ID mapping:**

PostHog uses `distinct_id` to identify users. This must match Exnoria's `contact_id`. Two options:

1. HubSpot contact ID is set as `distinct_id` in PostHog at identification time — cleanest, requires PostHog identity call when contact is created in HubSpot
2. PostHog's own ID is stored as a HubSpot contact property `posthog_distinct_id` — more flexible, requires a lookup step

**Recommendation: Option 1.** Set HubSpot contact ID as `distinct_id` in PostHog. This is a one-time PostHog identity configuration, not an ongoing engineering task.

**New cognitive layer tool definitions** (read-only, not dispatched to filter):

```typescript
{
  name: 'posthog_get_contact_events',
  description: 'Retrieve recent PostHog events for a contact to confirm or contextualize a Compass signal. ' +
    'Use before acting on PRD or ONB signals to verify live usage data. ' +
    'Read-only — does not dispatch to filter.',
  parameters: {
    contact_id: string,      // maps to PostHog distinct_id
    event_names: string[],   // specific events to query e.g. ['feature_used', 'task_abandoned']
    days: number             // lookback window, default 30
  }
}

{
  name: 'posthog_get_feature_adoption',
  description: 'Get feature adoption metrics for a contact. ' +
    'Maps to PRD_FRC indicators (feature_adoption_rate). ' +
    'Use when signal_id is PRD_FRC_01 or PRD_FRC_02 to verify signal before acting.',
  parameters: {
    contact_id: string,
    feature_names: string[]  // features to check adoption for
  }
}
```

These tools are `null` in `TOOL_TO_ACTION` — they are context retrieval tools, not filter-dispatched actions.

---

### B3.2 — Compass MCP Server

#### Why a Compass MCP server

Currently the Compass framework is vendored as static TypeScript in `layers/dashboard/src/lib/compass.ts`. The cognitive layer does not have direct access to it at runtime — it knows signal IDs from tool descriptions, but cannot query intervention details, cause relationships, or severity context dynamically.

A Compass MCP server makes the framework a live queryable resource. The agent can ask: "Given signal `PRD_FRC_02`, what are the three interventions and which is the quickest win?" and get a structured answer without that logic being hardcoded into tool descriptions.

#### Implementation

The Compass MCP server is a lightweight Node.js MCP server that wraps the existing `compass.ts` data. It lives at `layers/cognitive/src/mcp/compass-server.ts`.

**Five tools exposed:**

```
compass_get_signal(signal_id)
  → returns: name, severity, level, cause_code, indicators, interventions[]

compass_get_interventions(signal_id)
  → returns: 3 interventions (A/B/C) with descriptions and strategic notes

compass_get_cause(cause_code)
  → returns: all signals in this cause across domains

compass_get_domain_signals(domain_code)
  → returns: all signals for a domain (e.g. all PRD signals)

compass_get_critical_signals(threshold?)
  → returns: signals above severity threshold, default 0.7
```

**Where it runs:**

As a sidecar MCP server within the cognitive layer's Docker container. Not a separate service — it runs as an MCP stdio process alongside the cognitive layer's existing MCP configuration.

**Files to create:**

- `layers/cognitive/src/mcp/compass-server.ts` — MCP server implementation
- Update cognitive layer's MCP configuration to include the Compass server

**New cognitive layer tool definitions** (read-only):

```typescript
{
  name: 'compass_get_signal',
  description: 'Look up a Compass signal by ID to retrieve its severity, cause, indicators, and available interventions. ' +
    'Use when you need to reason about which intervention to recommend for a specific signal.',
  parameters: { signal_id: string }
}

{
  name: 'compass_get_interventions',
  description: 'Get the three intervention options for a Compass signal. ' +
    'Option A is typically the quick win, B is mid-level investment, C is strategic. ' +
    'Use to inform which action payload to send.',
  parameters: { signal_id: string }
}
```

Both `null` in `TOOL_TO_ACTION` — context retrieval only.

---

## Track C3 — Contact Memory Browser (MemPalace)

### Tool selection rationale

MemPalace was chosen over Engram and pgvector for C3. The decision criteria:

| Criterion                  | MemPalace                               | Engram                           | pgvector                    |
| -------------------------- | --------------------------------------- | -------------------------------- | --------------------------- |
| Semantic search            | ChromaDB vectors                        | FTS5 full-text only              | Requires embedding pipeline |
| Contact-scoped storage     | Wing per contact                        | Not designed for contacts        | Manual schema design        |
| Journey stage organization | Room per domain                         | Not applicable                   | Manual schema design        |
| Knowledge graph            | Temporal triples (SQLite)               | None                             | None                        |
| MCP tools                  | 19 tools, ready                         | 10 tools, agent-focused          | No MCP                      |
| Infrastructure             | Python + ChromaDB                       | Go binary + SQLite               | Already in stack            |
| Maintenance                | Active (26.9k stars, v3.0.0 April 2026) | Early (0 stars, v0.1.0 Feb 2026) | Stable                      |

MemPalace's wing/room/knowledge graph model maps directly to Exnoria's domain vocabulary: wing per contact, room per journey stage, knowledge graph triples for signal-action-outcome chains.

### C3.1 — MemPalace Integration

#### Deployment

MemPalace runs as a sidecar container in the Docker stack. It exposes its MCP server to the cognitive layer.

Add to `docker-compose.yml`:

```yaml
mempalace:
  image: python:3.11-slim
  working_dir: /app
  command: python -m mempalace.mcp_server
  volumes:
    - mempalace_data:/root/.mempalace
  environment:
    MEMPAL_DIR: /root/.mempalace
  networks:
    - exnoria_internal
```

Add volume:

```yaml
volumes:
  mempalace_data:
```

The cognitive layer connects to MemPalace via MCP stdio or HTTP. Configure in cognitive layer's MCP settings.

#### Memory Model: Exnoria Domain Mapping

| MemPalace Concept      | Exnoria Mapping                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Wing                   | Contact (`wing_{contact_id}`)                                                                                            |
| Room                   | Journey stage (`room_acq`, `room_sal`, `room_onb`, etc.)                                                                 |
| Hall                   | Memory type (`hall_facts` = decisions/actions, `hall_events` = signals detected, `hall_discoveries` = outcomes observed) |
| Drawer                 | Verbatim CXEvent + action record                                                                                         |
| Knowledge Graph Triple | `contact → signal_detected → ONB_FRC_01 (2026-04-09)`                                                                    |

#### What gets written to memory

The cognitive layer writes to MemPalace at the end of each reasoning session, after the filter has responded. Three writes per session:

**1. Signal event (hall_events):**

```
wing_{contact_id} / hall_events / room_{stage}
"Session {session_id}: detected signal {signal_id} (severity {severity}).
Cause: {cause_code}. Triggered by: {meta.triggered_by}"
```

**2. Action fact (hall_facts):**

```
wing_{contact_id} / hall_facts / room_{stage}
"Action {action_id} dispatched. Status: {executed|pending_hitl|rejected}.
Filter log: {log_id}. Interventions considered: {interventions}"
```

**3. Knowledge graph triple:**

```
kg.add_triple(contact_id, "signal_detected", signal_id, valid_from=now)
kg.add_triple(contact_id, "action_taken", action_id, valid_from=now)
```

On HITL outcomes, a follow-up write:

```
kg.add_triple(contact_id, "action_approved|action_rejected", action_id, valid_from=reviewed_at)
```

#### What the agent reads before reasoning

At the start of each reasoning cycle, before selecting an action, the agent calls:

```typescript
// 1. Get contact's stage history
mempalace_search((query = signal_id), (wing = `wing_${contact_id}`), (room = `room_${stage}`));

// 2. Get recent actions taken for this contact
mempalace_kg_query((entity = contact_id), (relationship = "action_taken"));

// 3. Check if a nudge was recently sent (prevents duplicate nudges)
mempalace_search((query = "nudge sent"), (wing = `wing_${contact_id}`), (room = `room_${stage}`));
```

This gives the agent: what signals have been detected for this contact in this stage, what actions were already taken, and whether cooldown conditions apply (e.g. "do not nudge if nudged in last 48 hours").

#### New cognitive layer tool definitions

Add to `TOOL_TO_ACTION` as `null` entries (read/write context, not filter actions):

```typescript
{
  name: 'memory_get_contact_history',
  description: 'Retrieve the signal and action history for a contact in a specific journey stage. ' +
    'Always call this before selecting an action — check if this signal was already acted on recently.',
  parameters: {
    contact_id: string,
    stage: string,      // e.g. "ONB", "PRD"
    query: string       // what to search for, e.g. "nudge sent" or signal_id
  }
}

{
  name: 'memory_record_session',
  description: 'Record the outcome of this reasoning session to contact memory. ' +
    'Call after the filter responds with the action outcome. ' +
    'Write signal detected, action taken, and status.',
  parameters: {
    contact_id: string,
    stage: string,
    session_id: string,
    signal_id: string,
    action_id: string,
    status: string,     // executed | pending_hitl | rejected
    log_id: string
  }
}
```

### C3.2 — Memory Browser Dashboard Page

The dashboard memory browser is a thin UI over MemPalace's MCP tools, proxied through the filter service or a new dashboard API route.

#### Page: `/dashboard/memory`

**Layout — three panels:**

**Left panel: Contact search**

- Search input → calls `mempalace_search` across all wings
- Results list: contact ID, most recent signal, most recent action, last activity date
- Click contact → loads their profile in center panel

**Center panel: Contact timeline**

- Selected contact's full history in reverse chronological order
- Groups by journey stage (room)
- Each entry shows: signal detected, severity, action taken, status (executed / pending_hitl / rejected / no action)
- Expandable row: full payload, agent reasoning (`meta.triggered_by`), filter log ID
- Color-coded by stage using Compass domain colors from `compass.ts`

**Right panel: Knowledge graph**

- `mempalace_kg_timeline` for selected contact
- Visual timeline of entity-relationship triples: when signals were detected, when actions were taken, when HITL was approved/rejected
- Simple chronological list — not a graph visualization (that's Phase 4 complexity)

**New files:**

- `layers/dashboard/src/app/(dashboard)/memory/page.tsx`
- `layers/dashboard/src/components/MemoryBrowser.tsx`
- `layers/dashboard/src/app/api/memory/route.ts` — proxy to MemPalace MCP HTTP endpoint

#### Sidebar

Add nav item: `{ href: "/memory", label: "Memory", icon: BrainCircuit }` — positioned after Health, before Approvals.

---

## Contact History Parameters (CX Business Context Best Practices)

Per standard CRM and CX memory models, the following fields constitute a contact's meaningful history in this context:

| Parameter                   | Source                     | Retention      | Purpose                                   |
| --------------------------- | -------------------------- | -------------- | ----------------------------------------- |
| `signal_history[]`          | MemPalace hall_events      | 365 days       | What pain points have been detected       |
| `action_history[]`          | MemPalace hall_facts       | 365 days       | What interventions were attempted         |
| `stage_progression`         | KG triples                 | Permanent      | When contact moved through journey stages |
| `hitl_outcomes`             | KG triples                 | Permanent      | Approved/rejected actions (audit trail)   |
| `last_nudge_at`             | KG triple                  | 90 days        | Prevents nudge fatigue                    |
| `last_assist_at`            | KG triple                  | 90 days        | Prevents over-intervention                |
| `open_signals[]`            | KG triples (no resolution) | Until resolved | Unresolved pain points still active       |
| `feature_adoption_snapshot` | PostHog (B3)               | 30-day rolling | Current product engagement state          |

**Retention policy:** Signal and action history kept 365 days. Stage progression and HITL outcomes kept permanently (audit requirement). Cooldown markers (last_nudge_at, last_assist_at) kept 90 days then pruned. PostHog data is live — no retention managed by Exnoria.

---

## Infrastructure Changes

### docker-compose.yml

```yaml
# New service
mempalace:
  image: python:3.11-slim
  working_dir: /app
  command: sh -c "pip install mempalace && python -m mempalace.mcp_server"
  volumes:
    - mempalace_data:/root/.mempalace
  networks:
    - exnoria_internal
  restart: unless-stopped

# New volume
volumes:
  mempalace_data:
```

### Environment Variables

| Variable             | Service   | Description                           |
| -------------------- | --------- | ------------------------------------- |
| `POSTHOG_API_KEY`    | cognitive | PostHog personal API key              |
| `POSTHOG_HOST`       | cognitive | PostHog instance URL                  |
| `POSTHOG_PROJECT_ID` | cognitive | PostHog project ID                    |
| `MEMPALACE_MCP_URL`  | cognitive | Internal URL for MemPalace MCP server |

Add to `.env.example` and `docker-compose.yml` cognitive service environment.

---

## New and Modified Files

### New Files

| #   | File                                                   | Purpose                      |
| --- | ------------------------------------------------------ | ---------------------------- |
| 1   | `layers/cognitive/src/mcp/compass-server.ts`           | Compass MCP server — 5 tools |
| 2   | `layers/dashboard/src/app/(dashboard)/memory/page.tsx` | Memory browser page          |
| 3   | `layers/dashboard/src/components/MemoryBrowser.tsx`    | Contact timeline component   |
| 4   | `layers/dashboard/src/app/api/memory/route.ts`         | Proxy to MemPalace           |

### Modified Files

| #   | File                                          | Change                                                             |
| --- | --------------------------------------------- | ------------------------------------------------------------------ |
| 1   | `layers/cognitive/src/tools/definitions.ts`   | Add 6 new context retrieval tools (2 PostHog, 2 Compass, 2 Memory) |
| 2   | `layers/cognitive/src/agent/reason.ts`        | Add memory read at session start, memory write at session end      |
| 3   | `layers/dashboard/src/components/Sidebar.tsx` | Add Memory nav item                                                |
| 4   | `docker-compose.yml`                          | Add mempalace service + volume, PostHog env vars to cognitive      |
| 5   | `.env.example`                                | Add PostHog + MemPalace variables                                  |

---

## Implementation Sequence

```
B3.2: Compass MCP server                    ← no external dependencies, start here
B3.1: PostHog identity configuration        ← configure distinct_id = contact_id in PostHog
B3.1: PostHog MCP integration               ← after identity confirmed
B3: Add 4 context retrieval tool defs       ← after both MCP servers available
C3.1: MemPalace Docker deployment           ← no code dependencies
C3.1: Memory model initialization           ← after container running
C3.1: Add 2 memory tool defs                ← after MemPalace running
C3.1: reason.ts memory read/write           ← after tool defs
C3.2: Dashboard memory browser              ← after MemPalace running
Sidebar update                              ← last
```

B3 and C3 tracks are independent — they can run in parallel after their respective infrastructure is up.

---

## Acceptance Criteria

- [ ] Compass MCP server running, `compass_get_signal("PRD_FRC_02")` returns correct severity (0.9) and 3 interventions
- [ ] PostHog MCP connected, `posthog_get_contact_events` returns events for a test contact
- [ ] MemPalace container running and healthy, `mempalace_status` returns palace overview
- [ ] Cognitive layer calls `memory_get_contact_history` before reasoning on a test CXEvent
- [ ] After filter dispatch, cognitive layer calls `memory_record_session` and MemPalace record is written
- [ ] Second CXEvent for same contact retrieves history correctly — agent demonstrates awareness of prior signal
- [ ] Dashboard `/memory` page renders contact search, timeline, and KG panel
- [ ] Duplicate nudge prevention: second ONB_FRC_01 event for contact within 48 hours does not trigger `onb.contact.nudge` — agent reads history and reasons differently
- [ ] TypeScript compilation passes with no errors
- [ ] All new environment variables documented in `.env.example`
