/**
 * compassSignals.ts — Flattened Compass signal view for dashboard health pages.
 *
 * Derived at module load from the canonical WHEEL_STRUCTURE (wheelStructure.ts).
 * No data is duplicated here: for the JourneyHealthMap / healthStatus consumers
 * the severity, level, cause codes and stage metadata all trace back to the
 * wheel structure + translations.ts single source of truth.
 */

import { STAGES } from "@/lib/constants";
import { WHEEL_STRUCTURE } from "@/features/cx-tools/shared/data/wheelStructure";
import { translate } from "@/features/cx-tools/shared/i18n/translations";

export type JourneyStage = (typeof STAGES)[number];

export interface CompassSignal {
  signal_id: string;
  name: string;
  domain: JourneyStage;
  cause_code: string;
  severity: number;
  level: number;
}

// Stage metadata: names and colors from the Compass framework
export const STAGE_META = Object.fromEntries(
  WHEEL_STRUCTURE.domains.map((d) => [
    d.code,
    { name: translate(d.name_key, "en"), color: d.color },
  ])
) as Record<JourneyStage, { name: string; color: string }>;

// All signals from the CX Diagnostic Compass framework (English-only view,
// matching the wheel structure). Severity values: 0.0 – 1.0.
export const COMPASS_SIGNALS: CompassSignal[] = WHEEL_STRUCTURE.domains.flatMap((d) =>
  d.causes.flatMap((c) =>
    c.signals.map((s) => ({
      signal_id: s.id,
      name: translate(s.name_key, "en"),
      domain: d.code as JourneyStage,
      cause_code: `${d.code}-${c.code}`,
      severity: s.severity,
      level: s.level,
    }))
  )
);

/**
 * Compute average severity for a given journey stage from Compass signal data.
 * Returns 0 if no signals exist for that stage.
 */
export function getStageAverageSeverity(stage: JourneyStage): number {
  const stageSignals = COMPASS_SIGNALS.filter((s) => s.domain === stage);
  if (stageSignals.length === 0) return 0;
  const sum = stageSignals.reduce((acc, s) => acc + s.severity, 0);
  return Math.round((sum / stageSignals.length) * 100) / 100;
}

/**
 * Get all severity averages for all stages.
 */
export function getAllStageAverageSeverities(): Record<JourneyStage, number> {
  const result = {} as Record<JourneyStage, number>;
  for (const stage of STAGES) {
    result[stage] = getStageAverageSeverity(stage);
  }
  return result;
}
