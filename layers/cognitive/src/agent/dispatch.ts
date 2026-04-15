// ==============================================================================
// Exnoria · Cognitive · Filter Dispatch Helper
// Phase 4 B4 — Shared dispatch logic for specialists
//
// Provides dispatchToFilter function for specialist agents to send actions
// to the filter service.
// ==============================================================================
import axios from 'axios';

const FILTER_URL = process.env.FILTER_URL ?? 'http://filter:3000';

/**
 * Dispatch an action to the filter service
 */
export async function dispatchToFilter(action: {
  action_id: string;
  stage: string;
  session_id: string;
  contact_id: string;
  signal_id?: string;
  signal_severity?: number;
  cause_code?: string;
  interventions?: string[];
  payload: Record<string, unknown>;
  meta?: {
    triggered_by?: string;
    cluster?: string;
    [key: string]: unknown;
  };
}): Promise<FilterResponse> {
  const res = await axios.post(`${FILTER_URL}/filter/execute`, {
    action_id: action.action_id,
    stage: action.stage,
    session_id: action.session_id,
    contact_id: action.contact_id,
    signal_id: action.signal_id,
    signal_severity: action.signal_severity,
    cause_code: action.cause_code,
    interventions: action.interventions,
    payload: action.payload,
    meta: {
      triggered_by: action.meta?.triggered_by || 'specialist',
      cluster: action.meta?.cluster,
      ...action.meta,
    },
  });

  return res.data;
}

export interface FilterResponse {
  status: 'executed' | 'rejected' | 'pending_hitl' | 'error';
  log_id: string;
  workflow_result?: Record<string, unknown>;
  rejection_code?: string;
  message?: string;
}
