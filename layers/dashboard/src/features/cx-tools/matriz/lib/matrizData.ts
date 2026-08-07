import type { MatrizData } from "@/features/cx-tools/matriz/lib/types";
import {
  translate,
  type Language,
  type TranslationKey,
} from "@/features/cx-tools/shared/i18n/translations";

/**
 * matrizData.ts — Canonical Matriz data structure.
 *
 * Labels, signals and layer descriptions are stored as translation keys
 * and resolved at module call time via `resolveMatrizData(language)`.
 * Single source of truth: translations.ts holds all strings (en + es).
 */

interface StageDef {
  id: string;
  labelKey: TranslationKey;
  order: number;
  color: string;
}

interface TouchpointDef {
  id: string;
  stage: string;
  position: { x: number; y: number };
  labelKey: TranslationKey;
  impact: "low" | "medium" | "high" | "critical";
  state: "active" | "warning" | "idle";
  signalKeys: TranslationKey[];
  layers: {
    workflows?: { textKey: TranslationKey; automation_level?: "low" | "medium" | "high" };
    agent?: {
      textKey: TranslationKey;
      decision_type?:
        | "diagnostic"
        | "prioritization"
        | "risk_detection"
        | "pattern_detection"
        | "real_time_assist"
        | "optimization"
        | "risk_prioritization"
        | "opportunity_detection";
    };
    human?: { textKey: TranslationKey; required?: boolean };
  };
}

const STAGES: StageDef[] = [
  { id: "ACQ", labelKey: "matriz.stage.acq", order: 1, color: "#3A86FF" },
  { id: "SAL", labelKey: "matriz.stage.sal", order: 2, color: "#8338EC" },
  { id: "ONB", labelKey: "matriz.stage.onb", order: 3, color: "#06D6A0" },
  { id: "PRD", labelKey: "matriz.stage.prd", order: 4, color: "#118AB2" },
  { id: "SUP", labelKey: "matriz.stage.sup", order: 5, color: "#FF9F1C" },
  { id: "COM", labelKey: "matriz.stage.com", order: 6, color: "#F72585" },
  { id: "RET", labelKey: "matriz.stage.ret", order: 7, color: "#2EC4B6" },
  { id: "EXP", labelKey: "matriz.stage.exp", order: 8, color: "#EF476F" },
];

const TOUCHPOINTS: TouchpointDef[] = [
  {
    id: "tp_ads",
    stage: "ACQ",
    position: { x: 1, y: 0 },
    labelKey: "matriz.tp.tp_ads.label",
    impact: "high",
    state: "active",
    signalKeys: ["matriz.tp.tp_ads.signal.0", "matriz.tp.tp_ads.signal.1"],
    layers: {
      workflows: { textKey: "matriz.tp.tp_ads.layer.workflows", automation_level: "high" },
      agent: { textKey: "matriz.tp.tp_ads.layer.agent", decision_type: "diagnostic" },
      human: { textKey: "matriz.tp.tp_ads.layer.human", required: true },
    },
  },
  {
    id: "tp_first_contact",
    stage: "SAL",
    position: { x: 2, y: 1 },
    labelKey: "matriz.tp.tp_first_contact.label",
    impact: "high",
    state: "warning",
    signalKeys: ["matriz.tp.tp_first_contact.signal.0", "matriz.tp.tp_first_contact.signal.1"],
    layers: {
      workflows: {
        textKey: "matriz.tp.tp_first_contact.layer.workflows",
        automation_level: "high",
      },
      agent: {
        textKey: "matriz.tp.tp_first_contact.layer.agent",
        decision_type: "prioritization",
      },
      human: { textKey: "matriz.tp.tp_first_contact.layer.human", required: true },
    },
  },
  {
    id: "tp_welcome",
    stage: "ONB",
    position: { x: 3, y: 0 },
    labelKey: "matriz.tp.tp_welcome.label",
    impact: "high",
    state: "idle",
    signalKeys: ["matriz.tp.tp_welcome.signal.0"],
    layers: {
      workflows: { textKey: "matriz.tp.tp_welcome.layer.workflows", automation_level: "medium" },
      agent: { textKey: "matriz.tp.tp_welcome.layer.agent", decision_type: "risk_detection" },
      human: { textKey: "matriz.tp.tp_welcome.layer.human", required: true },
    },
  },
  {
    id: "tp_feature",
    stage: "PRD",
    position: { x: 4, y: 1 },
    labelKey: "matriz.tp.tp_feature.label",
    impact: "medium",
    state: "active",
    signalKeys: ["matriz.tp.tp_feature.signal.0", "matriz.tp.tp_feature.signal.1"],
    layers: {
      workflows: { textKey: "matriz.tp.tp_feature.layer.workflows", automation_level: "medium" },
      agent: { textKey: "matriz.tp.tp_feature.layer.agent", decision_type: "pattern_detection" },
      human: { textKey: "matriz.tp.tp_feature.layer.human", required: true },
    },
  },
  {
    id: "tp_support",
    stage: "SUP",
    position: { x: 5, y: 0 },
    labelKey: "matriz.tp.tp_support.label",
    impact: "high",
    state: "warning",
    signalKeys: ["matriz.tp.tp_support.signal.0", "matriz.tp.tp_support.signal.1"],
    layers: {
      workflows: { textKey: "matriz.tp.tp_support.layer.workflows", automation_level: "high" },
      agent: { textKey: "matriz.tp.tp_support.layer.agent", decision_type: "real_time_assist" },
      human: { textKey: "matriz.tp.tp_support.layer.human", required: true },
    },
  },
  {
    id: "tp_campaigns",
    stage: "COM",
    position: { x: 6, y: 1 },
    labelKey: "matriz.tp.tp_campaigns.label",
    impact: "medium",
    state: "idle",
    signalKeys: ["matriz.tp.tp_campaigns.signal.0"],
    layers: {
      workflows: { textKey: "matriz.tp.tp_campaigns.layer.workflows", automation_level: "high" },
      agent: { textKey: "matriz.tp.tp_campaigns.layer.agent", decision_type: "optimization" },
      human: { textKey: "matriz.tp.tp_campaigns.layer.human", required: true },
    },
  },
  {
    id: "tp_churn_risk",
    stage: "RET",
    position: { x: 7, y: 0 },
    labelKey: "matriz.tp.tp_churn_risk.label",
    impact: "critical",
    state: "warning",
    signalKeys: ["matriz.tp.tp_churn_risk.signal.0", "matriz.tp.tp_churn_risk.signal.1"],
    layers: {
      workflows: { textKey: "matriz.tp.tp_churn_risk.layer.workflows", automation_level: "medium" },
      agent: {
        textKey: "matriz.tp.tp_churn_risk.layer.agent",
        decision_type: "risk_prioritization",
      },
      human: { textKey: "matriz.tp.tp_churn_risk.layer.human", required: true },
    },
  },
  {
    id: "tp_upsell",
    stage: "EXP",
    position: { x: 8, y: 1 },
    labelKey: "matriz.tp.tp_upsell.label",
    impact: "critical",
    state: "active",
    signalKeys: ["matriz.tp.tp_upsell.signal.0"],
    layers: {
      workflows: { textKey: "matriz.tp.tp_upsell.layer.workflows", automation_level: "high" },
      agent: {
        textKey: "matriz.tp.tp_upsell.layer.agent",
        decision_type: "opportunity_detection",
      },
      human: { textKey: "matriz.tp.tp_upsell.layer.human", required: true },
    },
  },
];

export function resolveMatrizData(language: Language = "en"): MatrizData {
  return {
    journey: STAGES.map((stage) => ({
      id: stage.id,
      label: translate(stage.labelKey, language),
      order: stage.order,
      color: stage.color,
    })),
    touchpoints: TOUCHPOINTS.map((tp) => ({
      id: tp.id,
      stage: tp.stage,
      position: tp.position,
      impact: tp.impact,
      state: tp.state,
      label: translate(tp.labelKey, language),
      signals: tp.signalKeys.map((key) => translate(key, language)),
      layers: {
        workflows: tp.layers.workflows && {
          text: translate(tp.layers.workflows.textKey, language),
          automation_level: tp.layers.workflows.automation_level,
        },
        agent: tp.layers.agent && {
          text: translate(tp.layers.agent.textKey, language),
          decision_type: tp.layers.agent.decision_type,
        },
        human: tp.layers.human && {
          text: translate(tp.layers.human.textKey, language),
          required: tp.layers.human.required,
        },
      },
    })),
  };
}
