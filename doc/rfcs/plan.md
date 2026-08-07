This is a full product roadmap conversation. Let me map the complete picture before we sequence anything.Each card in the roadmap is clickable to drill into that specific area. Here's the reasoning behind the sequencing:

![alt text](image.png)

**Phase 1 is about closing debt before expanding.** The three items — exporting working workflows to source control, implementing HITL properly, and adding the allowlist manager to the dashboard — are things that should be done before any client ever touches the system. HITL in particular is a safety property, not a feature. Right now the filter has the schema and the logic stub but no approval surface. That gap matters.

HITL (Human-in-the-loop) in Xnoria isn't a new concept — the schema, the filter logic, and the `requires_hitl` flag already exist. What's missing is the **approval surface**: the mechanism by which a human sees a pending action, decides yes or no, and the system responds accordingly.

Here's what the full implementation involves across all three layers:

---

## What already exists

The filter service already handles the `pending_hitl` case — it writes to `filter_log` with `status: pending_hitl` and returns a `queue_id`. The `filter_action` table has a `requires_hitl` boolean per action. The contract is designed. Nothing needs to change in the filter's core logic.

What doesn't exist: anything that surfaces that queue to a human, accepts their decision, and resumes execution.

---

## The three missing pieces

**1. A queue API in the filter service**

The filter needs two new endpoints:

```
GET  /filter/hitl/pending     → list all pending_hitl actions awaiting approval
POST /filter/hitl/:log_id/approve  → human approves, filter dispatches to n8n
POST /filter/hitl/:log_id/reject   → human rejects, filter updates log status
```

The approve endpoint re-reads the original `payload_in` from `filter_log`, dispatches it to n8n exactly as the execute path would, then updates `status` from `pending_hitl` to `executed`. The reject endpoint updates `status` to `rejected` with a `rejection_code` of `HITL_REJECTED`.

**2. A HITL queue page in the dashboard**

A new page at `/hitl` that polls `GET /filter/hitl/pending` every 10 seconds and presents each pending action as an approval card showing: action ID, stage, contact, the full payload the agent sent, and the agent's reasoning (from `meta.triggered_by`). Two buttons — Approve and Reject. The page is the operator's intervention surface.

**3. A Telegram notification to the operator**

When the filter queues a HITL action, it should notify the operator immediately rather than waiting for them to check the dashboard. This means the filter service needs to call the Telegram Bot API directly when `requires_hitl = true`, sending a message to a configured operator chat ID with a summary of the pending action and a link to the dashboard approval page.

---

## Which actions should require HITL

Not all actions need human approval. The `requires_hitl` flag in `filter_action` is already per-action, so you control the granularity. A sensible initial configuration for the three MVP workflows:

| Action                   | requires_hitl | Reasoning                                                      |
| ------------------------ | ------------- | -------------------------------------------------------------- |
| `acq.lead.score`         | false         | Read + tag — low risk, fully reversible                        |
| `sal.sequence.enroll`    | false         | Enrollment is reversible, agent decision quality is measurable |
| `sal.contact.prioritize` | true          | Sends a WhatsApp to a human — irreversible, warrants approval  |

As you add SUP and RET workflows, actions like `ret.account.trigger_winback` (sends a discount offer) or `sup.ticket.escalate` (pages a person) should also have `requires_hitl = true`.

---

## Implementation order

The dependency chain is: filter queue API first, then dashboard page, then Telegram notification. The Telegram notification is optional for Phase 1 but makes the system meaningfully more responsive — without it, HITL only works if someone is actively watching the dashboard.

Estimated scope: the filter additions are about 60 lines of TypeScript, the dashboard page is a straightforward polling component similar to the activity feed, and the Telegram notification reuses the same Bot API pattern already in the cognitive layer.

**Phases 2 and 3 expand the journey in priority order.** SUP and RET come before ONB and PRD because they're where the money is — support escalation and churn prevention have immediate, measurable business impact. ONB and PRD matter deeply but their payoff is slower. This also means the agent's toolset grows incrementally rather than all at once, which keeps the reasoning quality high.

**B3 (MCP + NotebookLM) is the most transformative single item in the roadmap.** The PRD already calls for it. Right now the agent reasons purely from signal + conversation history. Grounding it in domain knowledge — your client's specific business context, policies, customer segments — is what takes it from a generic CX agent to something genuinely hard to replicate.

**Phase 4 is the multi-operator inflection point.** Role-based access in the dashboard and multi-agent coordination in the cognitive layer are the two things that let you hand an instance to a client and have them operate it without your involvement. Nothing before Phase 4 requires that — but nothing after it works without it.

**Phase 5 is the productization layer.** Instance templating means a new client deployment is a `docker compose up` with a filled `.env`, not a week of configuration. Combined with deployment runbooks for VPS and edge devices, this is what makes the system commercially distributable.

The dependency note at the bottom is the constraint to watch: A2 must ship before B2 can expand the toolset, because the agent can only call tools that have corresponding filter entries and n8n workflows behind them. You can't add the tool definition first — the execution layer has to exist.

Where do you want to start — Phase 1 hardening, or dive straight into the Phase 2 workflow design?
