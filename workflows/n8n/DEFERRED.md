# Deferred Workflows

These workflows exist in `workflows/n8n/` as original exports but are **not registered** in `filter_action` and are **not adapted** for the filter architecture. They are tracked here to prevent them from being forgotten.

| Workflow | Original File | Deferred To | Reason |
|---|---|---|---|
| WhatsApp Decision Engine | `CX_ENGINE_WhatsApp_Decision_Engine_v1.json` | Phase 4 | Contains inline `CoreDecision` Gemini agent node — violates cognitive/orchestration separation. Decision logic must live in the cognitive layer, not inside a workflow. |
| OutOfHours Handoff path | `CX_ENGINE_OutOfHours_Engine_v1.json` (SAL branch) | Phase 2.5 follow-up | `SalesHandoff` node is a dead end (Set node — no CRM write, no comms). Must be wired to a real HubSpot update before the `sal.lead.handoff` action can be registered. |

---

## What was done instead

- **WhatsApp Decision Engine**: A clean execution-only stub (`sal.contact.message`) was extracted — the `SendWhatsApp` node only, receiving `message_content` from the filter payload. The decision agent was removed entirely.
- **OutOfHours nurture path**: The `AINurtureBot + GeminiModel + SimpleMemory` subgraph was extracted into `acq.lead.nurture`. The SalesHandoff branch remains deferred.

---

## Criteria to undefer

### WhatsApp Decision Engine
- Phase 4 multi-agent coordination design approved
- Cognitive layer has a dedicated conversational agent pattern that delegates to `sal.contact.message` for the actual send

### OutOfHours Handoff path (`sal.lead.handoff`)
- `SalesHandoff` Set node replaced with a real HubSpot API call (`hs_lead_status = CONNECTED` and task creation)
- New action `sal.lead.handoff` registered in `filter_action`
- Cognitive layer tool `sal_lead_handoff` added to `definitions.ts`
