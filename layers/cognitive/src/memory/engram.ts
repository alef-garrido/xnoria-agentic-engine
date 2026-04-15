// ==============================================================================
// Exnoria · Cognitive · Engram Memory Helpers
// Phase 3 C3 — Contact memory via Engram MCP
//
// Isolates Engram-specific logic from the reasoning loop.
// All functions are fire-and-forget — memory read/write failure must never block reasoning.
// ==============================================================================
import { executeMcpTool } from '../mcp/client';
import { FilterResponse } from '../shared/types';

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
  query: string = 'general',
  maxEntries: number = 3,
  agentCluster?: string
): Promise<string> {
  try {
    // Engram search uses project + contact_id + stage + agent as search query
    // Format matches: "TEST_CID_001 | ONB | agent:lifecycle"
    const searchQuery = agentCluster
      ? `${contactId} | ${stage} | agent:${agentCluster}`
      : `${contactId} | ${stage}`;
    const result = await executeMcpTool('mem_search', {
      query: searchQuery,
      project: 'xnoria-agentic-engine'
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
      ...entries.map(e => `- ${e.created_at.slice(0, 10)}: ${e.title}`),
    ];

    // Add cooldown note if applicable
    if (hasRecentNudge(entries, contactId, stage)) {
      lines.push(`Note: nudge sent within last 48 hours — prefer assist action if severity >= 0.8`);
    }

    return lines.join('\n');
  } catch (err) {
    console.error('[memory] context fetch failed:', err);
    return `Memory unavailable — proceed without prior context.`;
  }
}

function parseEngramResults(
  content: string,
  options: { maxEntries: number }
): EngramResult[] {
  // Simple parsing for Engram results
  // Expected format: JSON array of { title, content, created_at } objects
  try {
    const results = JSON.parse(content) as EngramResult[];
    return results.slice(0, options.maxEntries);
  } catch {
    // Fallback: treat as text lines
    return content.split('\n')
      .filter(line => line.trim())
      .slice(0, options.maxEntries)
      .map(line => ({
        title: line,
        content: '',
        created_at: new Date().toISOString()
      }));
  }
}

function hasRecentNudge(
  history: EngramResult[],
  contactId: string,
  stage: string
): boolean {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return history.some(entry =>
    entry.title.includes(contactId) &&
    entry.title.includes(stage) &&
    entry.title.includes('nudge') &&
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
    const clusterTag = agentCluster ? ` | agent:${agentCluster}` : '';
    const title = `${event.contact_id} | ${event.stage} | ${event.signal_id} → ${actionId} [${filterResponse.status}]${clusterTag}`;
    const content = buildMemoryContent(event, actionId, filterResponse, agentCluster);
    
    await executeMcpTool('mem_save', {
      title: title,
      content: content,
      project: 'xnoria-agentic-engine'
    });
  } catch (err) {
    console.error('[memory] session record failed:', err);
  }
}

// ------------------------------------------------------------------------------
// Formatted Content Builder (RFC-compliant)
// ------------------------------------------------------------------------------

export function buildMemoryContent(
  event: { contact_id: string; stage: string; signal_id?: string; signal_severity?: number; cause_code?: string },
  actionId: string,
  filterResponse: FilterResponse,
  agentCluster?: string
): string {
  const clusterNote = agentCluster ? ` | agent: ${agentCluster}` : '';
  
  return [
    `contact_id: ${event.contact_id}`,
    `stage: ${event.stage}`,
    `signal_id: ${event.signal_id ?? 'unknown'}`,
    `signal_severity: ${event.signal_severity ?? 0}`,
    `cause_code: ${event.cause_code ?? 'unknown'}`,
    `action_id: ${actionId}`,
    `status: ${filterResponse.status}`,
    `filter_log_id: ${filterResponse.log_id ?? 'none'}`,
    `timestamp: ${new Date().toISOString()}`,
    `agent_cluster: ${agentCluster ?? 'none'}${clusterNote}`,
  ].join('\n');
}
