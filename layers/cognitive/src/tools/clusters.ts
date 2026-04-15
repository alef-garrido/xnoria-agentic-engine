// ==============================================================================
// Exnoria · Cognitive · Tool Clusters
// Phase 4 B4 — Agent-based tool subsetting
//
// Maps journey stages to specialist agents and defines tool subsets per cluster.
// ==============================================================================
import { ToolDefinition } from '../shared/types';
import { TOOLS, TOOL_TO_ACTION } from './definitions';

export type AgentCluster = 'acqsal' | 'lifecycle' | 'escalation';

/**
 * Maps journey stages to agent clusters
 */
export const STAGE_TO_CLUSTER: Record<string, AgentCluster> = {
  ACQ: 'acqsal',
  SAL: 'acqsal',
  ONB: 'lifecycle',
  PRD: 'lifecycle',
  COM: 'lifecycle',
  RET: 'lifecycle',
  SUP: 'escalation',
  EXP: 'escalation',
};

/**
 * Context retrieval tools — always available to all clusters
 * These map to null in TOOL_TO_ACTION (routed to MCP, not filter)
 */
const CONTEXT_TOOL_NAMES = new Set([
  'compass_get_signal',
  'compass_get_interventions',
  'posthog_get_contact_events',
  'posthog_get_feature_adoption',
  'reply',
]);

/**
 * Get tool subset for a given cluster
 * 
 * - Context tools (compass, posthog, reply) are always included
 * - Filter action tools are filtered by the cluster's stages
 */
export function getClusterTools(cluster: AgentCluster): ToolDefinition[] {
  const clusterStages = Object.entries(STAGE_TO_CLUSTER)
    .filter(([, c]) => c === cluster)
    .map(([stage]) => stage);

  return TOOLS.filter(tool => {
    const name = tool.function.name;
    const mapping = TOOL_TO_ACTION[name];

    // Always include context retrieval tools and reply
    if (mapping === null) return true;

    // Include filter action tools whose stage belongs to this cluster
    return clusterStages.includes(mapping.stage as string);
  });
}

/**
 * Get stages for a given cluster
 * Useful for logging and debugging
 */
export function getClusterStages(cluster: AgentCluster): string[] {
  return Object.entries(STAGE_TO_CLUSTER)
    .filter(([, c]) => c === cluster)
    .map(([stage]) => stage);
}
