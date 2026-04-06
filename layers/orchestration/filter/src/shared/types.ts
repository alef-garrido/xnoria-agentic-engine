export type JourneyStage =
  | 'ACQ' | 'SAL' | 'ONB' | 'PRD'
  | 'SUP' | 'COM' | 'RET' | 'EXP';

export type FilterStatus =
  | 'executed'
  | 'rejected'
  | 'pending_hitl'
  | 'error';

export type RejectionCode =
  | 'ACTION_NOT_IN_ALLOWLIST'
  | 'ACTION_DISABLED'
  | 'STAGE_MISMATCH'
  | 'PAYLOAD_INVALID'
  | 'WORKFLOW_UNREACHABLE';

export interface FilterRequest {
  action_id:  string;
  stage:      JourneyStage;
  session_id: string;
  payload:    Record<string, unknown>;
  meta?: {
    triggered_by?: string;
    confidence?:   number;
    [key: string]: unknown;
  };
}

export interface FilterResponse {
  status:           FilterStatus;
  log_id:           string;
  workflow_result?: Record<string, unknown>;
  queue_id?:        string;
  rejection_code?:  RejectionCode;
  error_code?:      string;
  message?:         string;
}

export interface FilterAction {
  id:              string;
  action_id:       string;
  stage:           JourneyStage;
  n8n_workflow_id: string;
  requires_hitl:   boolean;
  enabled:         boolean;
  description:     string | null;
}
