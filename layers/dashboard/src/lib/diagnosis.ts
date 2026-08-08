/**
 * Shared DTO types for the on-demand diagnosis + action plan flow.
 * Mirrors the cognitive diagnosis module contract (layers/cognitive/src/diagnosis/types.ts)
 * and the jsonb shapes persisted in the diagnosis / action_plan tables.
 */

export type DiagnosisStatus = "queued" | "running" | "completed" | "failed";
export type PlanPriority = "P0" | "P1" | "P2";

export interface DiagnosisFindingDto {
  signal_id: string;
  stage: string;
  cause_code: string;
  severity: number;
  confidence: number;
  evidence: string;
  intervention_ids: string[];
}

export interface StageHealthDto {
  stage: string;
  score: number;
}

export interface DiagnosisResultDto {
  stage_health: StageHealthDto[];
  findings: DiagnosisFindingDto[];
  summary: string;
  low_data: boolean;
}

export interface DiagnosisDto {
  id: string;
  contact_id: string;
  email: string | null;
  status: DiagnosisStatus;
  fail_reason: string | null;
  triggered_by: string | null;
  result: DiagnosisResultDto | null;
  model: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PlanItemDto {
  rank: number;
  action_id: string;
  stage: string;
  priority: PlanPriority;
  rationale: string;
  expected_outcome: string;
  requires_hitl: boolean;
  signal_id?: string;
  payload: Record<string, unknown>;
}

export interface PlanDto {
  id: string;
  diagnosis_id: string;
  contact_id: string;
  status: string;
  items: PlanItemDto[];
  model: string | null;
  created_at: string;
}

/** Diagnosis history row joined with its (optional) action plan — GET /api/diagnose?contact_id= */
export interface DiagnosisListItemDto extends DiagnosisDto {
  plan: PlanDto | null;
}
