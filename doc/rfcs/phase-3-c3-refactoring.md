# RFC Amendment: Phase 3 C3 — Contact Memory (Engram)

**Status:** Replaces MemPalace section of phase-3-b3-c3-rfc.md  
**Date:** April 2026  
**Change:** MemPalace removed due to stdio-only transport incompatibility with sidecar model, lossy AAAK compression risk, and absence of production Docker support. Replaced with Engram.

---

## Why Engram

| Criterion | Engram | MemPalace (removed) |
|---|---|---|
| Transport | stdio — Go binary subprocess | stdio — Python subprocess |
| Infrastructure | Single binary, single SQLite file | Python + ChromaDB + SQLite |
| Docker support | Binary installable in existing cognitive image | No official Dockerfile |
| Compression | None — verbatim storage | Lossy AAAK (causes hallucinations on retrieval) |
| Memory integrity | Exact FTS5 full-text search | Semantic vectors (imprecise for structured queries) |
| New service needed | No — runs inside cognitive container | Yes — required separate sidecar |
| MCP tools | 10 tools via stdio | 19 tools via stdio |
| Maturity | v0.1.0, MIT, Go | v3.0.0, MIT, Python |

Engram's FTS5 search is sufficient for Xnoria's contact memory queries. Queries are structured — "what actions were taken for contact X in stage ONB" — not open-ended semantic retrieval. Exact text search on `contact_id` + `stage` + `signal_id` is faster and more reliable than vector similarity for this use case.

---

## Infrastructure

### No new Docker service

Engram runs as a stdio subprocess **inside the existing cognitive container**. It is not a sidecar. The MCP client spawns it on demand — same pattern as the Compass MCP server.

### Dockerfile change

Add to `layers/cognitive/Dockerfile`:

```dockerfile
# Install Engram binary
RUN curl -L https://github.com/Gentleman-Programming/engram/releases/download/v0.1.0/engram_linux_amd64 \
    -o /usr/local/bin/engram && chmod +x /usr/local/bin/engram
```

Pin to `v0.1.0` explicitly. Do not use `latest`. If the release tag changes behavior, the memory system breaks silently.

### docker-compose.yml change

Add a named volume for Engram data persistence. Without this, memory is lost on container restart.

```yaml
cognitive:
  volumes:
    - ./layers/cognitive/dist:/app/dist   # existing
    - engram_data:/root/.engram           # new

volumes:
  engram_data:                            # add alongside existing volumes
```

### Environment variables

No new environment variables required. Engram uses `ENGRAM_DATA_DIR` which defaults to `/root/.engram` — the volume mount covers this.

Remove from `.env.example` and `docker-compose.yml` cognitive environment (cleanup from MemPalace):
- `MEMPALACE_MCP_URL` — remove entirely

---

## MCP Client Integration

### Transport

```typescript
// layers/cognitive/src/mcp/client.ts
// Engram — stdio subprocess inside cognitive container
const engramTransport = new StdioClientTransport({
  command: 'engram',
  args: ['mcp']
});
```

### Pre-flight verification

Before wiring the cognitive layer, confirm the actual tool schema Engram exposes:

```bash
docker exec exnoria_cognitive engram mcp
# Read the initialization response — verify mem_save, mem_search,
# mem_context, mem_session_summary are present with expected parameters
```

The README documents `mem_save` with `title`, `type`, and `content`. Confirm whether `project` scoping is available in v0.1.0 before using it. If not present, use a `contact_id:` prefix in the title field instead — see Memory Model below.

---

## Memory Model: Xnoria Domain Mapping

Engram's unit of memory is an **observation** — a structured record saved with `mem_save`. Sessions group observations. There is no wing/room metaphor.

Xnoria maps its domain onto Engram's observation structure as follows:

### Writing a session record

After the filter responds, the cognitive layer writes one observation per session:

```typescript
await mcpClient.call('mem_save', {
  title: `${contact_id} | ${stage} | ${signal_id} → ${action_id} [${status}]`,
  type: 'cx_intervention',
  content: [
    `contact_id: ${contact_id}`,
    `stage: ${stage}`,
    `signal_id: ${signal_id}`,
    `signal_severity: ${signal_severity}`,
    `cause_code: ${cause_code}`,
    `action_id: ${action_id}`,
    `status: ${status}`,           // executed | pending_hitl | rejected
    `filter_log_id: ${log_id}`,
    `requires_hitl: ${requires_hitl}`,
    `triggered_by: ${meta?.triggered_by ?? 'unknown'}`,
    `session_id: ${session_id}`,
    `timestamp: ${new Date().toISOString()}`
  ].join('\n')
});
```

The `title` is the primary FTS5 search target — it encodes `contact_id`, `stage`, `signal_id`, `action_id`, and `status` in a single scannable string. The `content` holds the full structured record.

The `type: 'cx_intervention'` is consistent across all contact memory records — this makes it filterable if Engram adds type-based search in future versions.

### Reading contact history before reasoning

In the pre-processing step of `reason.ts`, before the LLM call:

```typescript
// Get prior interventions for this contact in this stage
const historyResult = await mcpClient.call('mem_search', {
  query: `${contact_id} ${stage}`
});

// Parse results into a compact context block (≤800 token budget)
const contactHistory = parseEngramResults(historyResult, {
  maxEntries: 3,           // most recent 3 interventions only
  fields: ['title', 'content']
});
```

This retrieves the 3 most recent observations matching `contact_id` + `stage`, sufficient to:
- Detect if a nudge was sent in the last 48 hours
- Know if a HITL action is already pending for this contact
- Know if a prior action was rejected and why

### Cooldown detection pattern

```typescript
function hasRecentNudge(history: EngramResult[], contactId: string, stage: string): boolean {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return history.some(entry =>
    entry.title.includes(contactId) &&
    entry.title.includes(stage) &&
    entry.title.includes('nudge') &&
    new Date(entry.created_at).getTime() > cutoff
  );
}
```

This is injected into the context block as a plain-language summary:

```
Prior interventions for contact CID_12345 in ONB (last 3):
- 2026-04-08: ONB_FRC_01 → onb.contact.nudge [executed]
- 2026-04-06: ONB_CLR_01 → onb.contact.nudge [executed]
- 2026-04-01: ONB_CAP_02 → onb.ticket.escalate [executed]
Note: nudge sent within last 48 hours — prefer onb.contact.assist if signal severity >= 0.8
```

The LLM reads this summary and reasons accordingly. It does not call Engram tools directly — Engram is called by pre-processing code, not by the LLM.

---

## Contact History Parameters

Standard CX memory fields retained from original RFC, adapted to Engram's storage model:

| Parameter | Stored as | Retention | Purpose |
|---|---|---|---|
| Signal detected | `signal_id` in title + content | 365 days | What pain points observed |
| Action taken | `action_id` in title + content | 365 days | What interventions attempted |
| Execution status | `status` in title + content | 365 days | executed / pending_hitl / rejected |
| Filter log ID | `filter_log_id` in content | Permanent | Audit trail linkage |
| HITL outcome | Separate `mem_save` on HITL resolution | Permanent | Approved/rejected record |
| Cooldown markers | Derived from history search | Via retention | Nudge fatigue prevention |
| Session ID | `session_id` in content | 365 days | Groups related observations |

**Retention:** Engram does not have built-in TTL. The 365-day guideline is a future operational concern — implement a periodic cleanup script in Phase 5 if storage becomes a concern. At current signal volume this is not a problem.

---

## reason.ts Integration

### Pre-processing section (before LLM call)

```typescript
async function buildContactContext(
  event: CXEvent,
  mcpClient: MCPClient
): Promise<string> {
  const MAX_CONTEXT_TOKENS = 800;

  try {
    const results = await mcpClient.call('mem_search', {
      query: `${event.contact_id} ${event.stage}`
    });

    const entries = parseEngramResults(results, { maxEntries: 3 });

    if (entries.length === 0) {
      return `No prior interventions recorded for contact ${event.contact_id} in ${event.stage}.`;
    }

    const lines = [
      `Prior interventions for contact ${event.contact_id} in ${event.stage} (last ${entries.length}):`,
      ...entries.map(e => `- ${e.created_at.slice(0, 10)}: ${e.title}`),
    ];

    // Cooldown note if applicable
    if (hasRecentNudge(entries, event.contact_id, event.stage)) {
      lines.push(`Note: nudge sent within last 48 hours — prefer assist action if severity >= 0.8`);
    }

    return lines.join('\n');
  } catch (err) {
    // Memory read failure must never block reasoning
    console.error('[memory] context fetch failed:', err);
    return `Memory unavailable — proceed without prior context.`;
  }
}
```

### Post-dispatch memory write (after filter responds)

```typescript
async function recordSession(
  event: CXEvent,
  actionId: string,
  filterResponse: FilterResponse,
  mcpClient: MCPClient
): Promise<void> {
  try {
    await mcpClient.call('mem_save', {
      title: `${event.contact_id} | ${event.stage} | ${event.signal_id} → ${actionId} [${filterResponse.status}]`,
      type: 'cx_intervention',
      content: buildMemoryContent(event, actionId, filterResponse)
    });
  } catch (err) {
    // Fire-and-forget — never throws into session result
    console.error('[memory] session record failed:', err);
  }
}
```

Both functions are called from `reason.ts` but are defined in `layers/cognitive/src/memory/engram.ts` — a new file that isolates all Engram interaction from the reasoning logic.

---

## Tool Definitions

Engram tools are **not** added to the LLM's `TOOLS` array. They are called directly by pre-processing and post-dispatch code. The LLM never sees or calls Engram tools — this is a deliberate design choice. Engram is infrastructure, not a reasoning tool.

Remove from `definitions.ts` (cleanup from MemPalace design):
- `memory_get_contact_history`
- `memory_record_session`

These are replaced by the direct function calls in `layers/cognitive/src/memory/engram.ts`.

---

## Dashboard: Memory Browser

The memory browser page (`/dashboard/memory`) is deferred until Engram is confirmed stable in production. The browser needs a read API — implement `GET /filter/engram/search?contact_id=X&stage=Y` on the filter service (proxied from the cognitive layer's Engram instance) once the memory write/read cycle is verified end-to-end.

Remove from current implementation (cleanup):
- `layers/dashboard/src/app/(dashboard)/memory/page.tsx`
- `layers/dashboard/src/components/MemoryBrowser.tsx`
- `layers/dashboard/src/app/api/memory/route.ts`
- Memory nav item from `Sidebar.tsx`

These are reinstated in a follow-up RFC once the core memory loop is confirmed working.

---

## New and Modified Files

### New Files

| # | File | Purpose |
|---|---|---|
| 1 | `layers/cognitive/src/memory/engram.ts` | Engram read/write helpers — isolated from reason.ts |

### Modified Files

| # | File | Change |
|---|---|---|
| 1 | `layers/cognitive/Dockerfile` | Add Engram binary install |
| 2 | `docker-compose.yml` | Add `engram_data` volume to cognitive service |
| 3 | `layers/cognitive/src/mcp/client.ts` | Add Engram stdio transport |
| 4 | `layers/cognitive/src/agent/reason.ts` | Call `buildContactContext` in pre-processing, `recordSession` post-dispatch |
| 5 | `layers/cognitive/src/tools/definitions.ts` | Remove `memory_get_contact_history`, `memory_record_session` |

### Files to Remove (MemPalace cleanup)

| # | File | Reason |
|---|---|---|
| 1 | `layers/dashboard/src/app/(dashboard)/memory/page.tsx` | Deferred — no backend yet |
| 2 | `layers/dashboard/src/components/MemoryBrowser.tsx` | Deferred |
| 3 | `layers/dashboard/src/app/api/memory/route.ts` | Deferred |

### docker-compose.yml removals

- `mempalace` service block — remove entirely
- `mempalace_data` volume — remove entirely
- `MEMPALACE_MCP_URL` from cognitive environment — remove

---

## Implementation Sequence

```
1. Add Engram binary to cognitive Dockerfile
2. Add engram_data volume to docker-compose.yml
3. Rebuild cognitive image: docker compose build cognitive
4. Verify binary: docker exec exnoria_cognitive engram --version
5. Verify MCP tools: docker exec exnoria_cognitive engram mcp
   → confirm mem_save and mem_search parameters match expected schema
6. Create layers/cognitive/src/memory/engram.ts
7. Add Engram stdio transport to mcp/client.ts
8. Update reason.ts: add buildContactContext call in pre-processing
9. Update reason.ts: add recordSession call post-dispatch
10. Remove MemPalace tool defs from definitions.ts
11. Remove MemPalace dashboard files
12. Remove Memory nav item from Sidebar.tsx
13. Build and verify: npx tsc --noEmit
14. Force-recreate container: docker compose up -d --force-recreate cognitive
15. Test: inject ONB_FRC_01 event → verify mem_save written to engram_data volume
16. Test: inject second ONB_FRC_01 for same contact within 48h → verify cooldown note in context → verify agent selects onb.contact.assist instead of onb.contact.nudge
```

---

## Acceptance Criteria

- [ ] Engram binary present and executable inside cognitive container
- [ ] `engram mcp` responds with valid MCP initialization including `mem_save` and `mem_search`
- [ ] `engram_data` volume persists across container restarts — memory survives `docker compose restart cognitive`
- [ ] After filter dispatch, `mem_save` is called and SQLite record is written to volume
- [ ] `mem_search` for `contact_id + stage` returns prior intervention records
- [ ] Cooldown test: second ONB_FRC_01 for same contact within 48h → agent selects `onb.contact.assist` not `onb.contact.nudge`
- [ ] Memory read/write failure does not crash or block the reasoning session
- [ ] All MemPalace references removed from codebase — `grep -r "mempalace" layers/` returns nothing
- [ ] TypeScript compilation passes with no errors
- [ ] Memory browser dashboard items removed — no broken routes

---

## Update to AGENTS.md

Replace the MemPalace entry in the infrastructure table:

```
| engram | stdio subprocess (Go binary) | Contact memory, session history — runs inside cognitive container |
```

Update B3/C3 notes under Phase 3 roadmap:

```
C3 memory backend: Engram (Go binary, SQLite + FTS5, stdio MCP)
Memory browser dashboard: deferred — pending Engram production verification
```