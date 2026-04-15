import { ToolDefinition } from '../shared/types';
export type AgentCluster = 'acqsal' | 'lifecycle' | 'escalation';
/**
 * Maps journey stages to agent clusters
 */
export declare const STAGE_TO_CLUSTER: Record<string, AgentCluster>;
/**
 * Get tool subset for a given cluster
 *
 * - Context tools (compass, posthog, reply) are always included
 * - Filter action tools are filtered by the cluster's stages
 */
export declare function getClusterTools(cluster: AgentCluster): ToolDefinition[];
/**
 * Get stages for a given cluster
 * Useful for logging and debugging
 */
export declare function getClusterStages(cluster: AgentCluster): string[];
