// ==============================================================================
// Exnoria · Cognitive · Engram Memory Helpers
// Phase 3 C3 — Contact memory via Engram MCP
//
// Isolates Engram-specific logic from the reasoning loop.
// All functions are fire-and-forget — memory read/write failure must never block reasoning.
// ==============================================================================
import { executeMcpTool } from "../mcp/client";
import { FilterResponse } from "../shared/types";
import { createLogger } from "../../../shared/logging";

const logger = createLogger("memory-engram", "cognitive");

export interface EngramResult {
  title: string;
  content: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Reading: Contact History Context
// ------------------------------------------------------------------------------

export async function getContactHistory(
  contactId: string,
  stage: string,
  maxEntries: number = 3,
  agentCluster?: string
): Promise<string> {
  try {
    // Engram search uses project + contact_id + stage + agent as search query
    // Format matches: "TEST_CID_001 | ONB | agent:lifecycle"
    const searchQuery = agentCluster
      ? `${contactId} | ${stage} | agent:${agentCluster}`
      : `${contactId} | ${stage}`;
    const result = await executeMcpTool("mem_search", {
      query: searchQuery,
      project: process.env.ENGRA_PROJECT || "xnoria-agentic-engine",
    });

    if (!result.success) {
      return `Memory unavailable — ${result.error}`;
    }

    // Parse and limit entries to stay within token budget
    const entries = parseEngramResults(result.content, { maxEntries });

    if (entries.length === 0) {
      return `No prior interventions recorded for contact ${contactId} in ${stage}.`;
    }

    const lines = [
      `Prior interventions for contact ${contactId} in ${stage} (last ${entries.length}):`,
      ...entries.map((e) => `- ${e.created_at.slice(0, 10)}: ${e.title}`),
    ];

    // Add cooldown note if applicable
    if (hasRecentNudge(entries, contactId, stage)) {
      lines.push(`Note: nudge sent within last 48 hours — prefer assist action if severity >= 0.8`);
    }

    return lines.join("\n");
  } catch (err) {
    logger.warn({ err }, "Contact history fetch failed — proceeding without context");
    return `Memory unavailable — proceed without prior context.`;
  }
}

function parseEngramResults(content: string, options: { maxEntries: number }): EngramResult[] {
  // Engram MCP returns prose previews ("Found 3 memories: · [1] #ID (type) — title ...").
  // Older Engram versions returned JSON arrays — kept as fallback.
  try {
    const parsed = JSON.parse(content) as EngramResult[];
    if (Array.isArray(parsed)) {
      return parsed.slice(0, options.maxEntries);
    }
  } catch {
    /* prose format — parse below */
  }

  const entries: EngramResult[] = [];
  const blockRegex =
    /\[(\d+)\]\s+#(\d+)\s+\(([^)]*)\)\s*—?\s*(.*?)\n([\s\S]*?)(?=\n\[\d+\]\s+#|\s*$)/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null && entries.length < options.maxEntries) {
    const rawTitle = match[4].trim();
    const rawBody = match[5] ?? "";
    const title =
      rawTitle.length > 0 ? rawTitle : (rawBody.split("\n").find((l) => l.trim().length > 0) ?? "");
    const dateMatch = rawBody.match(/(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})/);
    const bodyLines = rawBody
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !/^\d{4}-\d{2}-\d{2}/.test(l) && l !== "---");
    entries.push({
      title: title.trim(),
      content: bodyLines.join("\n"),
      created_at: dateMatch ? dateMatch[1].replace(" ", "T") + "Z" : new Date().toISOString(),
    });
  }

  // Fallback: plain line-per-entry text
  if (entries.length === 0) {
    return content
      .split("\n")
      .filter((line) => line.trim())
      .slice(0, options.maxEntries)
      .map((line) => ({
        title: line,
        content: "",
        created_at: new Date().toISOString(),
      }));
  }
  return entries;
}

function hasRecentNudge(history: EngramResult[], contactId: string, stage: string): boolean {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return history.some(
    (entry) =>
      entry.title.includes(contactId) &&
      entry.title.includes(stage) &&
      entry.title.includes("nudge") &&
      new Date(entry.created_at).getTime() > cutoff
  );
}

// ------------------------------------------------------------------------------
// Writing: Session Outcome Recording
// ------------------------------------------------------------------------------

export async function recordSessionOutcome(
  event: { contact_id: string; stage: string; signal_id?: string },
  actionId: string,
  filterResponse: FilterResponse,
  session_id: string,
  agentCluster?: string
): Promise<void> {
  if (!event.signal_id) {
    return;
  }

  try {
    // Build memory title and content for Engram
    const clusterTag = agentCluster ? ` | agent:${agentCluster}` : "";
    const title = `${event.contact_id} | ${event.stage} | ${event.signal_id} → ${actionId} [${filterResponse.status}]${clusterTag}`;
    const content = buildMemoryContent(event, actionId, filterResponse, agentCluster);

    await executeMcpTool("mem_save", {
      title: title,
      content: content,
      project: process.env.ENGRA_PROJECT || "xnoria-agentic-engine",
    });
  } catch (err) {
    logger.warn({ err, action_id: actionId }, "Session outcome recording failed");
  }
}

// ------------------------------------------------------------------------------
// Writing: Diagnosis + Action-Plan Recording (operator-triggered)
// ------------------------------------------------------------------------------

export interface DiagnosisMemoryInput {
  diagnosisId: string;
  contactId: string;
  email: string | null;
  summary?: string;
  findings: { signal_id: string; severity: number; cause_code?: string | null }[];
  stageHealth?: { stage: string; score: number }[];
  model?: string | null;
}

export interface PlanMemoryInput {
  planId: string;
  items: {
    rank: number;
    action_id: string;
    stage: string;
    priority: string;
    rationale?: string;
    expected_outcome?: string;
  }[];
}

/** Persist an operator-triggered diagnosis + its action plan into Engram. */
export async function recordDiagnosisOutcome(
  diagnosis: DiagnosisMemoryInput,
  plan?: PlanMemoryInput
): Promise<void> {
  try {
    const planSummary =
      plan && plan.items.length > 0
        ? ` | plan:${plan.items.length} actions`
        : " | no plan generated";
    const title = `${diagnosis.contactId} | DIAGNOSIS | ${diagnosis.findings.length} findings${planSummary} | operator`;
    const content = buildDiagnosisMemoryContent(diagnosis, plan);

    await executeMcpTool("mem_save", {
      title,
      content,
      project: process.env.ENGRA_PROJECT || "xnoria-agentic-engine",
    });
  } catch (err) {
    logger.warn(
      { err, diagnosis_id: diagnosis.diagnosisId },
      "Diagnosis outcome recording to Engram failed"
    );
  }
}

export function buildDiagnosisMemoryContent(
  diagnosis: DiagnosisMemoryInput,
  plan?: PlanMemoryInput
): string {
  const lines = [
    `diagnosis_id: ${diagnosis.diagnosisId}`,
    `contact_id: ${diagnosis.contactId}`,
    `email: ${diagnosis.email ?? "unknown"}`,
    `model: ${diagnosis.model ?? "unknown"}`,
    `findings: ${diagnosis.findings.length}`,
    `summary: ${diagnosis.summary ?? "none"}`,
  ];

  if (diagnosis.findings.length > 0) {
    for (const f of diagnosis.findings) {
      lines.push(
        `  - ${f.signal_id} severity=${f.severity}${f.cause_code ? ` cause=${f.cause_code}` : ""}`
      );
    }
  }

  if (diagnosis.stageHealth && diagnosis.stageHealth.length > 0) {
    lines.push("stage_health:");
    for (const sh of diagnosis.stageHealth) {
      lines.push(`  - ${sh.stage} score=${sh.score}`);
    }
  }

  if (plan && plan.items.length > 0) {
    lines.push(`plan_id: ${plan.planId}`, "plan_items:");
    for (const item of plan.items) {
      lines.push(`  - [${item.rank}] ${item.action_id} (${item.stage}, ${item.priority})`);
    }
  } else {
    lines.push("plan: none");
  }

  lines.push(`timestamp: ${new Date().toISOString()}`);
  return lines.join("\n");
}

// ------------------------------------------------------------------------------
// Formatted Content Builder (RFC-compliant)
// ------------------------------------------------------------------------------

export function buildMemoryContent(
  event: {
    contact_id: string;
    stage: string;
    signal_id?: string;
    signal_severity?: number;
    cause_code?: string;
  },
  actionId: string,
  filterResponse: FilterResponse,
  agentCluster?: string
): string {
  const clusterNote = agentCluster ? ` | agent: ${agentCluster}` : "";

  return [
    `contact_id: ${event.contact_id}`,
    `stage: ${event.stage}`,
    `signal_id: ${event.signal_id ?? "unknown"}`,
    `signal_severity: ${event.signal_severity ?? 0}`,
    `cause_code: ${event.cause_code ?? "unknown"}`,
    `action_id: ${actionId}`,
    `status: ${filterResponse.status}`,
    `filter_log_id: ${filterResponse.log_id ?? "none"}`,
    `timestamp: ${new Date().toISOString()}`,
    `agent_cluster: ${agentCluster ?? "none"}${clusterNote}`,
  ].join("\n");
}
