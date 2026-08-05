// ==============================================================================
// Exnoria · Dashboard · Vendored Compass Signal Data
// Source: CX Diagnostic Compass Framework Matrix (English only)
//
// This file contains static severity values extracted from the Compass framework
// for use in the Journey Health Map. It does NOT call the Compass app at runtime.
// ==============================================================================

import { STAGES } from "@/lib/constants";

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
export const STAGE_META: Record<JourneyStage, { name: string; color: string }> = {
  ACQ: { name: "Acquisition", color: "#3A86FF" },
  SAL: { name: "Sales Experience", color: "#8338EC" },
  ONB: { name: "Onboarding", color: "#06D6A0" },
  PRD: { name: "Product Experience", color: "#118AB2" },
  SUP: { name: "Support & Service", color: "#FF9F1C" },
  COM: { name: "Communication & Engagement", color: "#F72585" },
  RET: { name: "Retention & Loyalty", color: "#2EC4B6" },
  EXP: { name: "Expansion", color: "#EF476F" },
};

// All 54 signals from the CX Diagnostic Compass framework (English)
// Severity values: 0.0 – 1.0
export const COMPASS_SIGNALS: CompassSignal[] = [
  // ACQ — Acquisition (7 signals)
  {
    signal_id: "ACQ_VIS_01",
    name: "low awareness",
    domain: "ACQ",
    cause_code: "ACQ-VIS",
    severity: 0.8,
    level: 2,
  },
  {
    signal_id: "ACQ_VIS_02",
    name: "low traffic",
    domain: "ACQ",
    cause_code: "ACQ-VIS",
    severity: 0.9,
    level: 3,
  },
  {
    signal_id: "ACQ_CLR_01",
    name: "customer confusion",
    domain: "ACQ",
    cause_code: "ACQ-CLR",
    severity: 0.9,
    level: 1,
  },
  {
    signal_id: "ACQ_CLR_02",
    name: "high bounce rate",
    domain: "ACQ",
    cause_code: "ACQ-CLR",
    severity: 0.4,
    level: 2,
  },
  {
    signal_id: "ACQ_TRU_01",
    name: "abandoned carts",
    domain: "ACQ",
    cause_code: "ACQ-TRU",
    severity: 0.5,
    level: 3,
  },
  {
    signal_id: "ACQ_TRU_02",
    name: "hesitation to buy",
    domain: "ACQ",
    cause_code: "ACQ-TRU",
    severity: 0.6,
    level: 0,
  },

  // SAL — Sales Experience (6 signals)
  {
    signal_id: "SAL_CLR_01",
    name: "misunderstanding offering",
    domain: "SAL",
    cause_code: "SAL-CLR",
    severity: 0.8,
    level: 0,
  },
  {
    signal_id: "SAL_CLR_02",
    name: "unclear pricing",
    domain: "SAL",
    cause_code: "SAL-CLR",
    severity: 0.9,
    level: 1,
  },
  {
    signal_id: "SAL_VAL_01",
    name: "price objections",
    domain: "SAL",
    cause_code: "SAL-VAL",
    severity: 0.4,
    level: 2,
  },
  {
    signal_id: "SAL_VAL_02",
    name: "weak conversion",
    domain: "SAL",
    cause_code: "SAL-VAL",
    severity: 0.5,
    level: 3,
  },
  {
    signal_id: "SAL_TRU_01",
    name: "skepticism during demo",
    domain: "SAL",
    cause_code: "SAL-TRU",
    severity: 0.4,
    level: 2,
  },
  {
    signal_id: "SAL_TRU_02",
    name: "lost to competitors",
    domain: "SAL",
    cause_code: "SAL-TRU",
    severity: 0.5,
    level: 3,
  },

  // ONB — Onboarding (5 signals — note: ONB_CAP_02 has no interventions defined)
  {
    signal_id: "ONB_FRC_01",
    name: "abandoned setup",
    domain: "ONB",
    cause_code: "ONB-FRC",
    severity: 0.7,
    level: 1,
  },
  {
    signal_id: "ONB_FRC_02",
    name: "complaints about effort",
    domain: "ONB",
    cause_code: "ONB-FRC",
    severity: 0.8,
    level: 2,
  },
  {
    signal_id: "ONB_CLR_01",
    name: "users confused about next steps",
    domain: "ONB",
    cause_code: "ONB-CLR",
    severity: 0.7,
    level: 3,
  },
  {
    signal_id: "ONB_CAP_01",
    name: "unable to complete setup",
    domain: "ONB",
    cause_code: "ONB-CAP",
    severity: 0.6,
    level: 2,
  },
  {
    signal_id: "ONB_CAP_02",
    name: "technical blockers",
    domain: "ONB",
    cause_code: "ONB-CAP",
    severity: 0.7,
    level: 3,
  },

  // PRD — Product Experience (6 signals)
  {
    signal_id: "PRD_FRC_01",
    name: "task abandonment",
    domain: "PRD",
    cause_code: "PRD-FRC",
    severity: 0.8,
    level: 0,
  },
  {
    signal_id: "PRD_FRC_02",
    name: "low usage of core features",
    domain: "PRD",
    cause_code: "PRD-FRC",
    severity: 0.9,
    level: 1,
  },
  {
    signal_id: "PRD_CAP_01",
    name: "workarounds used",
    domain: "PRD",
    cause_code: "PRD-CAP",
    severity: 0.7,
    level: 1,
  },
  {
    signal_id: "PRD_CAP_02",
    name: "feature requests",
    domain: "PRD",
    cause_code: "PRD-CAP",
    severity: 0.8,
    level: 2,
  },
  {
    signal_id: "PRD_CST_01",
    name: "variable performance",
    domain: "PRD",
    cause_code: "PRD-CST",
    severity: 0.5,
    level: 3,
  },
  {
    signal_id: "PRD_CST_02",
    name: "bugs",
    domain: "PRD",
    cause_code: "PRD-CST",
    severity: 0.6,
    level: 0,
  },

  // SUP — Support & Service (6 signals)
  {
    signal_id: "SUP_RES_01",
    name: "long wait times",
    domain: "SUP",
    cause_code: "SUP-RES",
    severity: 0.5,
    level: 1,
  },
  {
    signal_id: "SUP_RES_02",
    name: "escalations",
    domain: "SUP",
    cause_code: "SUP-RES",
    severity: 0.6,
    level: 2,
  },
  {
    signal_id: "SUP_CAP_01",
    name: "unresolved issues",
    domain: "SUP",
    cause_code: "SUP-CAP",
    severity: 0.7,
    level: 3,
  },
  {
    signal_id: "SUP_CAP_02",
    name: "repeated contacts",
    domain: "SUP",
    cause_code: "SUP-CAP",
    severity: 0.8,
    level: 0,
  },
  {
    signal_id: "SUP_CST_01",
    name: "conflicting answers",
    domain: "SUP",
    cause_code: "SUP-CST",
    severity: 0.5,
    level: 1,
  },
  {
    signal_id: "SUP_CST_02",
    name: "agent roulette",
    domain: "SUP",
    cause_code: "SUP-CST",
    severity: 0.6,
    level: 2,
  },

  // COM — Communication & Engagement (6 signals)
  {
    signal_id: "COM_REL_01",
    name: "unsubscribed emails",
    domain: "COM",
    cause_code: "COM-REL",
    severity: 0.9,
    level: 1,
  },
  {
    signal_id: "COM_REL_02",
    name: "low engagement",
    domain: "COM",
    cause_code: "COM-REL",
    severity: 0.4,
    level: 2,
  },
  {
    signal_id: "COM_RES_01",
    name: "ignored feedback",
    domain: "COM",
    cause_code: "COM-RES",
    severity: 0.4,
    level: 0,
  },
  {
    signal_id: "COM_RES_02",
    name: "one-way communication",
    domain: "COM",
    cause_code: "COM-RES",
    severity: 0.5,
    level: 1,
  },
  {
    signal_id: "COM_CST_01",
    name: "mixed messaging",
    domain: "COM",
    cause_code: "COM-CST",
    severity: 0.4,
    level: 0,
  },
  {
    signal_id: "COM_CST_02",
    name: "off-brand interactions",
    domain: "COM",
    cause_code: "COM-CST",
    severity: 0.5,
    level: 1,
  },

  // RET — Retention & Loyalty (6 signals)
  {
    signal_id: "RET_VAL_01",
    name: "downgrades",
    domain: "RET",
    cause_code: "RET-VAL",
    severity: 0.9,
    level: 1,
  },
  {
    signal_id: "RET_VAL_02",
    name: "churn to cheaper option",
    domain: "RET",
    cause_code: "RET-VAL",
    severity: 0.4,
    level: 2,
  },
  {
    signal_id: "RET_REL_01",
    name: "silent churners",
    domain: "RET",
    cause_code: "RET-REL",
    severity: 0.9,
    level: 1,
  },
  {
    signal_id: "RET_REL_02",
    name: "no relationship with AM",
    domain: "RET",
    cause_code: "RET-REL",
    severity: 0.4,
    level: 2,
  },
  {
    signal_id: "RET_TRU_01",
    name: "broken promises",
    domain: "RET",
    cause_code: "RET-TRU",
    severity: 0.9,
    level: 1,
  },
  {
    signal_id: "RET_TRU_02",
    name: "reputational damage",
    domain: "RET",
    cause_code: "RET-TRU",
    severity: 0.4,
    level: 2,
  },

  // EXP — Expansion (6 signals)
  {
    signal_id: "EXP_GRW_01",
    name: "using competitors for other needs",
    domain: "EXP",
    cause_code: "EXP-GRW",
    severity: 0.6,
    level: 0,
  },
  {
    signal_id: "EXP_GRW_02",
    name: "stagnant usage",
    domain: "EXP",
    cause_code: "EXP-GRW",
    severity: 0.7,
    level: 1,
  },
  {
    signal_id: "EXP_VAL_01",
    name: "unwillingness to pay more",
    domain: "EXP",
    cause_code: "EXP-VAL",
    severity: 0.5,
    level: 3,
  },
  {
    signal_id: "EXP_VAL_02",
    name: "low ROI perception",
    domain: "EXP",
    cause_code: "EXP-VAL",
    severity: 0.6,
    level: 0,
  },
  {
    signal_id: "EXP_REL_01",
    name: "blockers at executive level",
    domain: "EXP",
    cause_code: "EXP-REL",
    severity: 0.5,
    level: 3,
  },
  {
    signal_id: "EXP_REL_02",
    name: "lack of champions",
    domain: "EXP",
    cause_code: "EXP-REL",
    severity: 0.6,
    level: 0,
  },
];

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
