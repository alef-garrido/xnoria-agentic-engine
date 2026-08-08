// ==============================================================================
// Exnoria · Cognitive · Diagnosis types
// Operator-triggered diagnosis of a single lead/contact and the prioritized
// action plan derived from a completed diagnosis.
// ==============================================================================
import { JourneyStage } from "../shared/types";

export type DiagnosisStatus = "queued" | "running" | "completed" | "failed";

export interface DiagnosisFinding {
  signal_id: string;
  stage: JourneyStage;
  cause_code: string;
  severity: number;
  confidence: number;
  evidence: string;
  intervention_ids: string[];
}

export interface StageHealth {
  stage: JourneyStage;
  score: number;
}

export interface DiagnosisResult {
  stage_health: StageHealth[];
  findings: DiagnosisFinding[];
  summary: string;
  low_data: boolean;
}

export type PlanPriority = "P0" | "P1" | "P2";

export interface PlanItem {
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

export interface DiagnosisRow {
  id: string;
  contact_id: string;
  email: string | null;
  status: DiagnosisStatus;
  fail_reason: string | null;
  triggered_by: string | null;
  input: Record<string, unknown>;
  result: DiagnosisResult | null;
  model: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ActionPlanRow {
  id: string;
  diagnosis_id: string;
  contact_id: string;
  status: string;
  items: PlanItem[];
  model: string | null;
  created_at: string;
}
