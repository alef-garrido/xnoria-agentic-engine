// ==============================================================================
// Exnoria · Cognitive · Compass Signal & Intervention Data
// Ported from layers/dashboard/src/lib/compass.ts + intervention vocabulary
// Source: CX Diagnostic Compass Framework Matrix
// ==============================================================================

export type JourneyStage = "ACQ" | "SAL" | "ONB" | "PRD" | "SUP" | "COM" | "RET" | "EXP";

export interface CompassSignal {
  signal_id: string;
  name: string;
  domain: JourneyStage;
  cause_code: string;
  severity: number;
  level: number;
}

export interface CompassIntervention {
  id: string;
  signal_id: string;
  option: "A" | "B" | "C";
  description: string;
  strategic_note?: string;
}

// Stage metadata
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

// All 54 signals from the CX Diagnostic Compass framework
export const COMPASS_SIGNALS: CompassSignal[] = [
  // ACQ — Acquisition
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

  // SAL — Sales Experience
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

  // ONB — Onboarding
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

  // PRD — Product Experience
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

  // SUP — Support & Service
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

  // COM — Communication & Engagement
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

  // RET — Retention & Loyalty
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

  // EXP — Expansion
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

// ---------------------------------------------------------------------------
// Compass interventions — three options (A/B/C) per signal
// A = quick win, B = mid-level investment, C = strategic
// Not all signals have interventions defined yet — only those with active actions
// ---------------------------------------------------------------------------
export const COMPASS_INTERVENTIONS: CompassIntervention[] = [
  // ONB — Onboarding interventions
  {
    id: "INT_ONB_FRC_01_A",
    signal_id: "ONB_FRC_01",
    option: "A",
    description: "Send automated re-engagement nudge via WhatsApp",
    strategic_note: "Quick win — low cost, immediate action",
  },
  {
    id: "INT_ONB_FRC_01_B",
    signal_id: "ONB_FRC_01",
    option: "B",
    description: "Assign CSM for guided onboarding session",
    strategic_note: "Mid-level — requires CSM availability",
  },
  {
    id: "INT_ONB_FRC_01_C",
    signal_id: "ONB_FRC_01",
    option: "C",
    description: "Redesign onboarding flow to reduce friction steps",
    strategic_note: "Strategic — product investment",
  },

  {
    id: "INT_ONB_FRC_02_A",
    signal_id: "ONB_FRC_02",
    option: "A",
    description: "Offer white-glove CSM assistance",
    strategic_note: "HITL required — direct human contact",
  },
  {
    id: "INT_ONB_FRC_02_B",
    signal_id: "ONB_FRC_02",
    option: "B",
    description: "Create simplified onboarding path for complex setups",
    strategic_note: "Product change",
  },
  {
    id: "INT_ONB_FRC_02_C",
    signal_id: "ONB_FRC_02",
    option: "C",
    description: "Build self-service diagnostic tool for onboarding blockers",
    strategic_note: "Strategic — product investment",
  },

  {
    id: "INT_ONB_CLR_01_A",
    signal_id: "ONB_CLR_01",
    option: "A",
    description: "Send contextual help message with next step instructions",
    strategic_note: "Quick win — automated",
  },
  {
    id: "INT_ONB_CLR_01_B",
    signal_id: "ONB_CLR_01",
    option: "B",
    description: "Add in-app progress indicator and checklist",
    strategic_note: "Product change",
  },
  {
    id: "INT_ONB_CLR_01_C",
    signal_id: "ONB_CLR_01",
    option: "C",
    description: "Implement interactive onboarding wizard",
    strategic_note: "Strategic — product investment",
  },

  {
    id: "INT_ONB_CAP_01_A",
    signal_id: "ONB_CAP_01",
    option: "A",
    description: "Offer direct CSM white-glove assistance",
    strategic_note: "HITL required",
  },
  {
    id: "INT_ONB_CAP_01_B",
    signal_id: "ONB_CAP_01",
    option: "B",
    description: "Create setup templates for common configurations",
    strategic_note: "Product improvement",
  },
  {
    id: "INT_ONB_CAP_01_C",
    signal_id: "ONB_CAP_01",
    option: "C",
    description: "Build automated setup validation and correction",
    strategic_note: "Strategic",
  },

  {
    id: "INT_ONB_CAP_02_A",
    signal_id: "ONB_CAP_02",
    option: "A",
    description: "Escalate to technical support queue in HubSpot",
    strategic_note: "Quick win — routes to human",
  },
  {
    id: "INT_ONB_CAP_02_B",
    signal_id: "ONB_CAP_02",
    option: "B",
    description: "Create known-issues knowledge base for common blockers",
    strategic_note: "Mid-level",
  },
  {
    id: "INT_ONB_CAP_02_C",
    signal_id: "ONB_CAP_02",
    option: "C",
    description: "Build automated diagnostic and self-healing",
    strategic_note: "Strategic",
  },

  // PRD — Product Experience interventions
  {
    id: "INT_PRD_FRC_01_A",
    signal_id: "PRD_FRC_01",
    option: "A",
    description: "Send adoption nudge highlighting abandoned feature benefits",
    strategic_note: "Quick win — automated messaging",
  },
  {
    id: "INT_PRD_FRC_01_B",
    signal_id: "PRD_FRC_01",
    option: "B",
    description: "Create guided tutorial for the abandoned task flow",
    strategic_note: "Mid-level — content creation",
  },
  {
    id: "INT_PRD_FRC_01_C",
    signal_id: "PRD_FRC_01",
    option: "C",
    description: "Simplify the task flow UX to reduce abandonment",
    strategic_note: "Strategic — product redesign",
  },

  {
    id: "INT_PRD_FRC_02_A",
    signal_id: "PRD_FRC_02",
    option: "A",
    description: "Send feature education message with use-case examples",
    strategic_note: "Quick win — critical severity (0.9), always act",
  },
  {
    id: "INT_PRD_FRC_02_B",
    signal_id: "PRD_FRC_02",
    option: "B",
    description: "Schedule CSM-led feature walkthrough session",
    strategic_note: "Mid-level — requires CSM",
  },
  {
    id: "INT_PRD_FRC_02_C",
    signal_id: "PRD_FRC_02",
    option: "C",
    description: "Implement in-app feature discovery and contextual tips",
    strategic_note: "Strategic — product investment",
  },

  {
    id: "INT_PRD_CAP_01_A",
    signal_id: "PRD_CAP_01",
    option: "A",
    description: "Send targeted feature education for the native alternative",
    strategic_note: "Quick win",
  },
  {
    id: "INT_PRD_CAP_01_B",
    signal_id: "PRD_CAP_01",
    option: "B",
    description: "Create migration guide from workaround to native feature",
    strategic_note: "Mid-level — content creation",
  },
  {
    id: "INT_PRD_CAP_01_C",
    signal_id: "PRD_CAP_01",
    option: "C",
    description: "Improve native feature to match workaround capabilities",
    strategic_note: "Strategic — product development",
  },

  {
    id: "INT_PRD_CAP_02_A",
    signal_id: "PRD_CAP_02",
    option: "A",
    description: "Log enriched feature request to product feedback pipeline",
    strategic_note: "Quick win — no contact-facing action",
  },
  {
    id: "INT_PRD_CAP_02_B",
    signal_id: "PRD_CAP_02",
    option: "B",
    description: "Aggregate similar requests and create product brief",
    strategic_note: "Mid-level",
  },
  {
    id: "INT_PRD_CAP_02_C",
    signal_id: "PRD_CAP_02",
    option: "C",
    description: "Build feature voting/roadmap portal",
    strategic_note: "Strategic",
  },

  // SUP — Support interventions
  {
    id: "INT_SUP_RES_01_A",
    signal_id: "SUP_RES_01",
    option: "A",
    description: "Escalate ticket to senior support queue",
    strategic_note: "Quick win — routing",
  },
  {
    id: "INT_SUP_RES_01_B",
    signal_id: "SUP_RES_01",
    option: "B",
    description: "Implement priority queue for long-wait tickets",
    strategic_note: "Mid-level",
  },
  {
    id: "INT_SUP_RES_01_C",
    signal_id: "SUP_RES_01",
    option: "C",
    description: "Add AI-assisted first response to reduce wait",
    strategic_note: "Strategic",
  },

  {
    id: "INT_SUP_CAP_02_A",
    signal_id: "SUP_CAP_02",
    option: "A",
    description: "Send resolution status update to contact",
    strategic_note: "HITL — requires human review",
  },
  {
    id: "INT_SUP_CAP_02_B",
    signal_id: "SUP_CAP_02",
    option: "B",
    description: "Create automated status notification pipeline",
    strategic_note: "Mid-level",
  },
  {
    id: "INT_SUP_CAP_02_C",
    signal_id: "SUP_CAP_02",
    option: "C",
    description: "Build customer-facing ticket tracking portal",
    strategic_note: "Strategic",
  },

  // RET — Retention interventions
  {
    id: "INT_RET_VAL_01_A",
    signal_id: "RET_VAL_01",
    option: "A",
    description: "Enroll contact in winback sequence",
    strategic_note: "HITL — irreversible sequence enrollment",
  },
  {
    id: "INT_RET_VAL_01_B",
    signal_id: "RET_VAL_01",
    option: "B",
    description: "Trigger CSM outreach with retention offer",
    strategic_note: "Mid-level — requires approval",
  },
  {
    id: "INT_RET_VAL_01_C",
    signal_id: "RET_VAL_01",
    option: "C",
    description: "Build predictive churn model for early intervention",
    strategic_note: "Strategic",
  },

  {
    id: "INT_RET_REL_01_A",
    signal_id: "RET_REL_01",
    option: "A",
    description: "Flag account for immediate CSM review",
    strategic_note: "Quick win — internal routing",
  },
  {
    id: "INT_RET_REL_01_B",
    signal_id: "RET_REL_01",
    option: "B",
    description: "Implement automated engagement scoring alerts",
    strategic_note: "Mid-level",
  },
  {
    id: "INT_RET_REL_01_C",
    signal_id: "RET_REL_01",
    option: "C",
    description: "Build relationship health dashboard per account",
    strategic_note: "Strategic",
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Look up a single signal by ID */
export function getSignal(signal_id: string): CompassSignal | undefined {
  return COMPASS_SIGNALS.find((s) => s.signal_id === signal_id);
}

/** Get the 3 interventions (A/B/C) for a signal */
export function getInterventions(signal_id: string): CompassIntervention[] {
  return COMPASS_INTERVENTIONS.filter((i) => i.signal_id === signal_id);
}

/** Get all signals sharing a cause code */
export function getSignalsByCause(cause_code: string): CompassSignal[] {
  return COMPASS_SIGNALS.filter((s) => s.cause_code === cause_code);
}

/** Get all signals for a domain/stage */
export function getSignalsByDomain(domain: JourneyStage): CompassSignal[] {
  return COMPASS_SIGNALS.filter((s) => s.domain === domain);
}

/** Get signals above a severity threshold */
export function getCriticalSignals(threshold = 0.7): CompassSignal[] {
  return COMPASS_SIGNALS.filter((s) => s.severity >= threshold);
}
