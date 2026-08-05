import type { JourneyStage } from "@/lib/constants";
import { getStageAverageSeverity } from "@/lib/compass";

export interface StageHealthMetrics {
  stage: string;
  period_days: number;
  total_actions: number;
  executed: number;
  rejected: number;
  pending_hitl: number;
  execution_rate: number;
  hitl_total: number;
  hitl_approved: number;
  hitl_rejected: number;
  hitl_approval_rate: number;
  avg_review_minutes: number | null;
  top_rejection_code: string | null;
}

export type StatusLevel = "healthy" | "warning" | "critical";

// Threshold constants — adjust without code change
export const HEALTH_THRESHOLDS = {
  executionRate: { healthy: 0.85, warning: 0.6 },
  avgSeverity: { healthy: 0.5, warning: 0.7 },
  hitlApproval: { healthy: 0.8, warning: 0.6 },
} as const;

export function getStatus(
  value: number,
  threshold: { healthy: number; warning: number },
  invert = false
): StatusLevel {
  if (invert) {
    // Lower is better (severity)
    if (value < threshold.healthy) return "healthy";
    if (value <= threshold.warning) return "warning";
    return "critical";
  }
  // Higher is better (rates)
  if (value > threshold.healthy) return "healthy";
  if (value >= threshold.warning) return "warning";
  return "critical";
}

export function getStageMetrics(
  metrics: StageHealthMetrics[],
  stage: JourneyStage
): StageHealthMetrics | null {
  return metrics.find((m) => m.stage === stage) ?? null;
}

/** Worst-status-wins combination of severity, execution rate and HITL approval. */
export function getCombinedStatus(metrics: StageHealthMetrics[], stage: JourneyStage): StatusLevel {
  const m = getStageMetrics(metrics, stage);
  const severity = getStageAverageSeverity(stage);
  const severityStatus = getStatus(severity, HEALTH_THRESHOLDS.avgSeverity, true);

  if (!m || m.total_actions === 0) return severityStatus;

  const execStatus = getStatus(m.execution_rate, HEALTH_THRESHOLDS.executionRate);
  const hitlStatus =
    m.hitl_total > 0 ? getStatus(m.hitl_approval_rate, HEALTH_THRESHOLDS.hitlApproval) : "healthy";

  const statuses = [severityStatus, execStatus, hitlStatus];
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  return "healthy";
}
