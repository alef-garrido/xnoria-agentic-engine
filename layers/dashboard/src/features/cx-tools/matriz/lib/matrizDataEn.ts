import { MatrizData } from "@/features/cx-tools/matriz/lib/types";

export const matrizDataEn: MatrizData = {
  journey: [
    { id: "ACQ", label: "Acquisition", order: 1, color: "#3A86FF" },
    { id: "SAL", label: "Sales Experience", order: 2, color: "#8338EC" },
    { id: "ONB", label: "Onboarding", order: 3, color: "#06D6A0" },
    { id: "PRD", label: "Product Experience", order: 4, color: "#118AB2" },
    { id: "SUP", label: "Support & Service", order: 5, color: "#FF9F1C" },
    { id: "COM", label: "Communication", order: 6, color: "#F72585" },
    { id: "RET", label: "Retention", order: 7, color: "#2EC4B6" },
    { id: "EXP", label: "Expansion", order: 8, color: "#EF476F" }
  ],
  touchpoints: [
    {
      id: "tp_ads",
      stage: "ACQ",
      position: { x: 1, y: 0 },
      label: "Ads / Landing",
      impact: "high",
      state: "active",
      signals: ["Low CTR", "High bounce"],
      layers: {
        workflows: { text: "Lead capture and tracking", automation_level: "high" },
        agent: { text: "Detects low conversion and mismatch", decision_type: "diagnostic" },
        human: { text: "Adjusts campaigns and messaging", required: true }
      }
    },
    {
      id: "tp_first_contact",
      stage: "SAL",
      position: { x: 2, y: 1 },
      label: "First Contact",
      impact: "high",
      state: "warning",
      signals: ["No response", "Cold lead"],
      layers: {
        workflows: { text: "Automated follow-ups", automation_level: "high" },
        agent: { text: "Prioritizes high-value leads", decision_type: "prioritization" },
        human: { text: "Personalized outreach strategy", required: true }
      }
    },
    {
      id: "tp_welcome",
      stage: "ONB",
      position: { x: 3, y: 0 },
      label: "Welcome",
      impact: "high",
      state: "idle",
      signals: ["Early drop-off"],
      layers: {
        workflows: { text: "Onboarding sequences", automation_level: "medium" },
        agent: { text: "Detects early abandonment", decision_type: "risk_detection" },
        human: { text: "Intervenes in critical accounts", required: true }
      }
    },
    {
      id: "tp_feature",
      stage: "PRD",
      position: { x: 4, y: 1 },
      label: "Feature Usage",
      impact: "medium",
      state: "active",
      signals: ["Low usage", "UX friction"],
      layers: {
        workflows: { text: "Tracking and nudges", automation_level: "medium" },
        agent: { text: "Detects usage patterns", decision_type: "pattern_detection" },
        human: { text: "Feature adoption consultations", required: true }
      }
    },
    {
      id: "tp_support",
      stage: "SUP",
      position: { x: 5, y: 0 },
      label: "Tickets / Chat",
      impact: "high",
      state: "warning",
      signals: ["High volume", "Repeated issues"],
      layers: {
        workflows: { text: "Classification and basic responses", automation_level: "high" },
        agent: { text: "Suggests responses and detects urgency", decision_type: "real_time_assist" },
        human: { text: "Resolves complex cases", required: true }
      }
    },
    {
      id: "tp_campaigns",
      stage: "COM",
      position: { x: 6, y: 1 },
      label: "Campaigns",
      impact: "medium",
      state: "idle",
      signals: ["Low engagement"],
      layers: {
        workflows: { text: "Campaign automation", automation_level: "high" },
        agent: { text: "Optimizes timing and content", decision_type: "optimization" },
        human: { text: "Content and targeting validation", required: true }
      }
    },
    {
      id: "tp_churn_risk",
      stage: "RET",
      position: { x: 7, y: 0 },
      label: "Churn Risk",
      impact: "critical",
      state: "warning",
      signals: ["Inactivity", "Low interaction"],
      layers: {
        workflows: { text: "Alerts and sequences", automation_level: "medium" },
        agent: { text: "Prioritizes accounts at risk", decision_type: "risk_prioritization" },
        human: { text: "Strategic intervention", required: true }
      }
    },
    {
      id: "tp_upsell",
      stage: "EXP",
      position: { x: 8, y: 1 },
      label: "Upsell / Reactivation",
      impact: "critical",
      state: "active",
      signals: ["Upgrade opportunity"],
      layers: {
        workflows: { text: "Automated campaigns", automation_level: "high" },
        agent: { text: "Detects opportunity and timing", decision_type: "opportunity_detection" },
        human: { text: "Closing and negotiation", required: true }
      }
    }
  ]
};
