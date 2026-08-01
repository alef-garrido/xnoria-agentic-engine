import type { WheelData } from "@/lib/cx-compass/types/wheel";

export const domainPrefixesEn: Record<string, string> = {
  acquisition: "ACQ",
  sales: "SAL",
  onboarding: "ONB",
  product: "PRD",
  support: "SUP",
  communication: "COM",
  retention: "RET",
  expansion: "EXP",
};

export const wheelDataEn: WheelData = {
  wheel_name: "CX Diagnostic Compass",
  version: "2.0",
  center: {
    id: "cx_health",
    name: "CX Health",
    description: "Overall health of the customer experience.",
  },
  domains: [
    {
      id: "acquisition",
      name: "Acquisition",
      color: "#3A86FF",
      causes: [
        { id: "vis", code: "ACQ-VIS", name: "Visibility", signals: [{ id: "ACQ_VIS_01", name: "low awareness", severity: 0.8, level: 2, indicators: [{ id: "ACQ_VIS_01_SV", name: "brand_search_volume" }], interventions: ["INT_ACQ_VIS_01_A", "INT_ACQ_VIS_01_B", "INT_ACQ_VIS_01_C"] }, { id: "ACQ_VIS_02", name: "low traffic", severity: 0.9, level: 3, indicators: [{ id: "ACQ_VIS_02_SV", name: "site_visitors" }], interventions: ["INT_ACQ_VIS_02_A", "INT_ACQ_VIS_02_B", "INT_ACQ_VIS_02_C"] }], indicators: [{ id: "ACQ_VIS_01_SV", name: "brand_search_volume" }, { id: "ACQ_VIS_02_SV", name: "site_visitors" }], interventions: ["INT_ACQ_VIS_01_A", "INT_ACQ_VIS_01_B", "INT_ACQ_VIS_01_C", "INT_ACQ_VIS_02_A", "INT_ACQ_VIS_02_B", "INT_ACQ_VIS_02_C"] },
        { id: "clr", code: "ACQ-CLR", name: "Clarity", signals: [{ id: "ACQ_CLR_01", name: "customer confusion", severity: 0.9, level: 1, indicators: [{ id: "ACQ_CLR_01_BR", name: "bounce_rate" }], interventions: ["INT_ACQ_CLR_01_A", "INT_ACQ_CLR_01_B", "INT_ACQ_CLR_01_C"] }, { id: "ACQ_CLR_02", name: "high bounce rate", severity: 0.4, level: 2, indicators: [{ id: "ACQ_CLR_02_TS", name: "time_on_site" }], interventions: ["INT_ACQ_CLR_02_A", "INT_ACQ_CLR_02_B", "INT_ACQ_CLR_02_C"] }], indicators: [{ id: "ACQ_CLR_01_BR", name: "bounce_rate" }, { id: "ACQ_CLR_02_TS", name: "time_on_site" }], interventions: ["INT_ACQ_CLR_01_A", "INT_ACQ_CLR_01_B", "INT_ACQ_CLR_01_C", "INT_ACQ_CLR_02_A", "INT_ACQ_CLR_02_B", "INT_ACQ_CLR_02_C"] },
        { id: "tru", code: "ACQ-TRU", name: "Trust", signals: [{ id: "ACQ_TRU_01", name: "abandoned carts", severity: 0.5, level: 3, indicators: [{ id: "ACQ_TRU_01_CR", name: "cart_abandonment_rate" }], interventions: ["INT_ACQ_TRU_01_A", "INT_ACQ_TRU_01_B", "INT_ACQ_TRU_01_C"] }, { id: "ACQ_TRU_02", name: "hesitation to buy", severity: 0.6, level: 0, indicators: [{ id: "ACQ_TRU_02_SC", name: "social_proof_clicks" }], interventions: ["INT_ACQ_TRU_02_A", "INT_ACQ_TRU_02_B", "INT_ACQ_TRU_02_C"] }], indicators: [{ id: "ACQ_TRU_01_CR", name: "cart_abandonment_rate" }, { id: "ACQ_TRU_02_SC", name: "social_proof_clicks" }], interventions: ["INT_ACQ_TRU_01_A", "INT_ACQ_TRU_01_B", "INT_ACQ_TRU_01_C", "INT_ACQ_TRU_02_A", "INT_ACQ_TRU_02_B", "INT_ACQ_TRU_02_C"] },
      ],
    },
    {
      id: "sales",
      name: "Sales Experience",
      color: "#8338EC",
      causes: [
        { id: "clr", code: "SAL-CLR", name: "Clarity", signals: [{ id: "SAL_CLR_01", name: "misunderstanding offering", severity: 0.8, level: 0, indicators: [{ id: "SAL_CLR_01_DR", name: "demo_to_close_rate" }], interventions: ["INT_SAL_CLR_01_A", "INT_SAL_CLR_01_B", "INT_SAL_CLR_01_C"] }, { id: "SAL_CLR_02", name: "unclear pricing", severity: 0.9, level: 1, indicators: [{ id: "SAL_CLR_01_DR", name: "demo_to_close_rate" }], interventions: ["INT_SAL_CLR_02_A", "INT_SAL_CLR_02_B", "INT_SAL_CLR_02_C"] }], indicators: [{ id: "SAL_CLR_01_DR", name: "demo_to_close_rate" }], interventions: ["INT_SAL_CLR_01_A", "INT_SAL_CLR_01_B", "INT_SAL_CLR_01_C", "INT_SAL_CLR_02_A", "INT_SAL_CLR_02_B", "INT_SAL_CLR_02_C"] },
        { id: "val", code: "SAL-VAL", name: "Value Perception", signals: [{ id: "SAL_VAL_01", name: "price objections", severity: 0.4, level: 2, indicators: [{ id: "SAL_VAL_01_WR", name: "win_loss_ratio" }], interventions: ["INT_SAL_VAL_01_A", "INT_SAL_VAL_01_B", "INT_SAL_VAL_01_C"] }, { id: "SAL_VAL_02", name: "weak conversion", severity: 0.5, level: 3, indicators: [{ id: "SAL_VAL_01_WR", name: "win_loss_ratio" }], interventions: ["INT_SAL_VAL_02_A", "INT_SAL_VAL_02_B", "INT_SAL_VAL_02_C"] }], indicators: [{ id: "SAL_VAL_01_WR", name: "win_loss_ratio" }], interventions: ["INT_SAL_VAL_01_A", "INT_SAL_VAL_01_B", "INT_SAL_VAL_01_C", "INT_SAL_VAL_02_A", "INT_SAL_VAL_02_B", "INT_SAL_VAL_02_C"] },
        { id: "tru", code: "SAL-TRU", name: "Trust", signals: [{ id: "SAL_TRU_01", name: "skepticism during demo", severity: 0.4, level: 2, indicators: [{ id: "SAL_TRU_01_CW", name: "competitive_win_rate" }], interventions: ["INT_SAL_TRU_01_A", "INT_SAL_TRU_01_B", "INT_SAL_TRU_01_C"] }, { id: "SAL_TRU_02", name: "lost to competitors", severity: 0.5, level: 3, indicators: [{ id: "SAL_TRU_01_CW", name: "competitive_win_rate" }], interventions: ["INT_SAL_TRU_02_A", "INT_SAL_TRU_02_B", "INT_SAL_TRU_02_C"] }], indicators: [{ id: "SAL_TRU_01_CW", name: "competitive_win_rate" }], interventions: ["INT_SAL_TRU_01_A", "INT_SAL_TRU_01_B", "INT_SAL_TRU_01_C", "INT_SAL_TRU_02_A", "INT_SAL_TRU_02_B", "INT_SAL_TRU_02_C"] },
      ],
    },
    {
      id: "onboarding",
      name: "Onboarding",
      color: "#06D6A0",
      causes: [
        { id: "frc", code: "ONB-FRC", name: "Friction", signals: [{ id: "ONB_FRC_01", name: "abandoned setup", severity: 0.7, level: 1, indicators: [{ id: "ONB_FRC_01_TV", name: "time_to_first_value" }], interventions: ["INT_ONB_FRC_01_A", "INT_ONB_FRC_01_B", "INT_ONB_FRC_01_C"] }, { id: "ONB_FRC_02", name: "complaints about effort", severity: 0.8, level: 2, indicators: [{ id: "ONB_FRC_02_DR", name: "drop_off_rate" }], interventions: ["INT_ONB_FRC_02_A", "INT_ONB_FRC_02_B", "INT_ONB_FRC_02_C"] }], indicators: [{ id: "ONB_FRC_01_TV", name: "time_to_first_value" }, { id: "ONB_FRC_02_DR", name: "drop_off_rate" }], interventions: ["INT_ONB_FRC_01_A", "INT_ONB_FRC_01_B", "INT_ONB_FRC_01_C", "INT_ONB_FRC_02_A", "INT_ONB_FRC_02_B", "INT_ONB_FRC_02_C"] },
        { id: "clr", code: "ONB-CLR", name: "Clarity", signals: [{ id: "ONB_CLR_01", name: "users confused about next steps", severity: 0.7, level: 3, indicators: [{ id: "ONB_CLR_01_HV", name: "help_article_views_in_onboarding" }], interventions: ["INT_ONB_CLR_01_A", "INT_ONB_CLR_01_B", "INT_ONB_CLR_01_C"] }], indicators: [{ id: "ONB_CLR_01_HV", name: "help_article_views_in_onboarding" }], interventions: ["INT_ONB_CLR_01_A", "INT_ONB_CLR_01_B", "INT_ONB_CLR_01_C"] },
        { id: "cap", code: "ONB-CAP", name: "Capability", signals: [{ id: "ONB_CAP_01", name: "unable to complete setup", severity: 0.6, level: 2, indicators: [{ id: "ONB_CAP_01_CR", name: "onboarding_completion_rate" }], interventions: ["INT_ONB_CAP_01_A", "INT_ONB_CAP_01_B", "INT_ONB_CAP_01_C"] }, { id: "ONB_CAP_02", name: "technical blockers", severity: 0.7, level: 3, indicators: [{ id: "ONB_CAP_01_CR", name: "onboarding_completion_rate" }], interventions: [] }], indicators: [{ id: "ONB_CAP_01_CR", name: "onboarding_completion_rate" }], interventions: ["INT_ONB_CAP_01_A", "INT_ONB_CAP_01_B", "INT_ONB_CAP_01_C"] },
      ],
    },
    {
      id: "product",
      name: "Product Experience",
      color: "#118AB2",
      causes: [
        { id: "frc", code: "PRD-FRC", name: "Friction", signals: [{ id: "PRD_FRC_01", name: "task abandonment", severity: 0.8, level: 0, indicators: [{ id: "PRD_FRC_01_FA", name: "feature_adoption_rate" }], interventions: ["INT_PRD_FRC_01_A", "INT_PRD_FRC_01_B", "INT_PRD_FRC_01_C"] }, { id: "PRD_FRC_02", name: "low usage of core features", severity: 0.9, level: 1, indicators: [{ id: "PRD_FRC_01_FA", name: "feature_adoption_rate" }], interventions: ["INT_PRD_FRC_02_A", "INT_PRD_FRC_02_B", "INT_PRD_FRC_02_C"] }], indicators: [{ id: "PRD_FRC_01_FA", name: "feature_adoption_rate" }], interventions: ["INT_PRD_FRC_01_A", "INT_PRD_FRC_01_B", "INT_PRD_FRC_01_C", "INT_PRD_FRC_02_A", "INT_PRD_FRC_02_B", "INT_PRD_FRC_02_C"] },
        { id: "cap", code: "PRD-CAP", name: "Capability", signals: [{ id: "PRD_CAP_01", name: "workarounds used", severity: 0.7, level: 1, indicators: [{ id: "PRD_CAP_01_FR", name: "feature_request_volume" }], interventions: ["INT_PRD_CAP_01_A", "INT_PRD_CAP_01_B", "INT_PRD_CAP_01_C"] }, { id: "PRD_CAP_02", name: "feature requests", severity: 0.8, level: 2, indicators: [{ id: "PRD_CAP_01_FR", name: "feature_request_volume" }], interventions: ["INT_PRD_CAP_02_A", "INT_PRD_CAP_02_B", "INT_PRD_CAP_02_C"] }], indicators: [{ id: "PRD_CAP_01_FR", name: "feature_request_volume" }], interventions: ["INT_PRD_CAP_01_A", "INT_PRD_CAP_01_B", "INT_PRD_CAP_01_C", "INT_PRD_CAP_02_A", "INT_PRD_CAP_02_B", "INT_PRD_CAP_02_C"] },
        { id: "cst", code: "PRD-CST", name: "Consistency", signals: [{ id: "PRD_CST_01", name: "variable performance", severity: 0.5, level: 3, indicators: [{ id: "PRD_CST_01_UT", name: "uptime" }], interventions: ["INT_PRD_CST_01_A", "INT_PRD_CST_01_B", "INT_PRD_CST_01_C"] }, { id: "PRD_CST_02", name: "bugs", severity: 0.6, level: 0, indicators: [{ id: "PRD_CST_02_BR", name: "bug_report_frequency" }], interventions: ["INT_PRD_CST_02_A", "INT_PRD_CST_02_B", "INT_PRD_CST_02_C"] }], indicators: [{ id: "PRD_CST_01_UT", name: "uptime" }, { id: "PRD_CST_02_BR", name: "bug_report_frequency" }], interventions: ["INT_PRD_CST_01_A", "INT_PRD_CST_01_B", "INT_PRD_CST_01_C", "INT_PRD_CST_02_A", "INT_PRD_CST_02_B", "INT_PRD_CST_02_C"] },
      ],
    },
    {
      id: "support",
      name: "Support & Service",
      color: "#FF9F1C",
      causes: [
        { id: "res", code: "SUP-RES", name: "Responsiveness", signals: [{ id: "SUP_RES_01", name: "long wait times", severity: 0.5, level: 1, indicators: [{ id: "SUP_RES_01_FR", name: "first_response_time" }], interventions: ["INT_SUP_RES_01_A", "INT_SUP_RES_01_B", "INT_SUP_RES_01_C"] }, { id: "SUP_RES_02", name: "escalations", severity: 0.6, level: 2, indicators: [{ id: "SUP_RES_02_RT", name: "resolution_time" }], interventions: ["INT_SUP_RES_02_A", "INT_SUP_RES_02_B", "INT_SUP_RES_02_C"] }], indicators: [{ id: "SUP_RES_01_FR", name: "first_response_time" }, { id: "SUP_RES_02_RT", name: "resolution_time" }], interventions: ["INT_SUP_RES_01_A", "INT_SUP_RES_01_B", "INT_SUP_RES_01_C", "INT_SUP_RES_02_A", "INT_SUP_RES_02_B", "INT_SUP_RES_02_C"] },
        { id: "cap", code: "SUP-CAP", name: "Capability", signals: [{ id: "SUP_CAP_01", name: "unresolved issues", severity: 0.7, level: 3, indicators: [{ id: "SUP_CAP_01_FC", name: "first_contact_resolution" }], interventions: ["INT_SUP_CAP_01_A", "INT_SUP_CAP_01_B", "INT_SUP_CAP_01_C"] }, { id: "SUP_CAP_02", name: "repeated contacts", severity: 0.8, level: 0, indicators: [{ id: "SUP_CAP_01_FC", name: "first_contact_resolution" }], interventions: ["INT_SUP_CAP_02_A", "INT_SUP_CAP_02_B", "INT_SUP_CAP_02_C"] }], indicators: [{ id: "SUP_CAP_01_FC", name: "first_contact_resolution" }], interventions: ["INT_SUP_CAP_01_A", "INT_SUP_CAP_01_B", "INT_SUP_CAP_01_C", "INT_SUP_CAP_02_A", "INT_SUP_CAP_02_B", "INT_SUP_CAP_02_C"] },
        { id: "cst", code: "SUP-CST", name: "Consistency", signals: [{ id: "SUP_CST_01", name: "conflicting answers", severity: 0.5, level: 1, indicators: [{ id: "SUP_CST_01_CV", name: "CSAT_variance" }], interventions: ["INT_SUP_CST_01_A", "INT_SUP_CST_01_B", "INT_SUP_CST_01_C"] }, { id: "SUP_CST_02", name: "agent roulette", severity: 0.6, level: 2, indicators: [{ id: "SUP_CST_01_CV", name: "CSAT_variance" }], interventions: ["INT_SUP_CST_02_A", "INT_SUP_CST_02_B", "INT_SUP_CST_02_C"] }], indicators: [{ id: "SUP_CST_01_CV", name: "CSAT_variance" }], interventions: ["INT_SUP_CST_01_A", "INT_SUP_CST_01_B", "INT_SUP_CST_01_C", "INT_SUP_CST_02_A", "INT_SUP_CST_02_B", "INT_SUP_CST_02_C"] },
      ],
    },
    {
      id: "communication",
      name: "Communication & Engagement",
      color: "#F72585",
      causes: [
        { id: "rel", code: "COM-REL", name: "Relationship", signals: [{ id: "COM_REL_01", name: "unsubscribed emails", severity: 0.9, level: 1, indicators: [{ id: "COM_REL_01_EO", name: "email_open_rate" }], interventions: ["INT_COM_REL_01_A", "INT_COM_REL_01_B", "INT_COM_REL_01_C"] }, { id: "COM_REL_02", name: "low engagement", severity: 0.4, level: 2, indicators: [{ id: "COM_REL_02_CA", name: "community_activity" }], interventions: ["INT_COM_REL_02_A", "INT_COM_REL_02_B", "INT_COM_REL_02_C"] }], indicators: [{ id: "COM_REL_01_EO", name: "email_open_rate" }, { id: "COM_REL_02_CA", name: "community_activity" }], interventions: ["INT_COM_REL_01_A", "INT_COM_REL_01_B", "INT_COM_REL_01_C", "INT_COM_REL_02_A", "INT_COM_REL_02_B", "INT_COM_REL_02_C"] },
        { id: "res", code: "COM-RES", name: "Responsiveness", signals: [{ id: "COM_RES_01", name: "ignored feedback", severity: 0.4, level: 0, indicators: [{ id: "COM_RES_01_SR", name: "survey_response_rate" }], interventions: ["INT_COM_RES_01_A", "INT_COM_RES_01_B", "INT_COM_RES_01_C"] }, { id: "COM_RES_02", name: "one-way communication", severity: 0.5, level: 1, indicators: [{ id: "COM_RES_01_SR", name: "survey_response_rate" }], interventions: ["INT_COM_RES_02_A", "INT_COM_RES_02_B", "INT_COM_RES_02_C"] }], indicators: [{ id: "COM_RES_01_SR", name: "survey_response_rate" }], interventions: ["INT_COM_RES_01_A", "INT_COM_RES_01_B", "INT_COM_RES_01_C", "INT_COM_RES_02_A", "INT_COM_RES_02_B", "INT_COM_RES_02_C"] },
        { id: "cst", code: "COM-CST", name: "Consistency", signals: [{ id: "COM_CST_01", name: "mixed messaging", severity: 0.4, level: 0, indicators: [{ id: "COM_CST_01_BS", name: "brand_sentiment" }], interventions: ["INT_COM_CST_01_A", "INT_COM_CST_01_B", "INT_COM_CST_01_C"] }, { id: "COM_CST_02", name: "off-brand interactions", severity: 0.5, level: 1, indicators: [{ id: "COM_CST_01_BS", name: "brand_sentiment" }], interventions: ["INT_COM_CST_02_A", "INT_COM_CST_02_B", "INT_COM_CST_02_C"] }], indicators: [{ id: "COM_CST_01_BS", name: "brand_sentiment" }], interventions: ["INT_COM_CST_01_A", "INT_COM_CST_01_B", "INT_COM_CST_01_C", "INT_COM_CST_02_A", "INT_COM_CST_02_B", "INT_COM_CST_02_C"] },
      ],
    },
    {
      id: "retention",
      name: "Retention & Loyalty",
      color: "#2EC4B6",
      causes: [
        { id: "val", code: "RET-VAL", name: "Value Perception", signals: [{ id: "RET_VAL_01", name: "downgrades", severity: 0.9, level: 1, indicators: [{ id: "RET_VAL_01_NR", name: "net_revenue_retention" }], interventions: ["INT_RET_VAL_01_A", "INT_RET_VAL_01_B", "INT_RET_VAL_01_C"] }, { id: "RET_VAL_02", name: "churn to cheaper option", severity: 0.4, level: 2, indicators: [{ id: "RET_VAL_02_DR", name: "downgrade_rate" }], interventions: ["INT_RET_VAL_02_A", "INT_RET_VAL_02_B", "INT_RET_VAL_02_C"] }], indicators: [{ id: "RET_VAL_01_NR", name: "net_revenue_retention" }, { id: "RET_VAL_02_DR", name: "downgrade_rate" }], interventions: ["INT_RET_VAL_01_A", "INT_RET_VAL_01_B", "INT_RET_VAL_01_C", "INT_RET_VAL_02_A", "INT_RET_VAL_02_B", "INT_RET_VAL_02_C"] },
        { id: "rel", code: "RET-REL", name: "Relationship", signals: [{ id: "RET_REL_01", name: "silent churners", severity: 0.9, level: 1, indicators: [{ id: "RET_REL_01_HS", name: "health_score" }], interventions: ["INT_RET_REL_01_A", "INT_RET_REL_01_B", "INT_RET_REL_01_C"] }, { id: "RET_REL_02", name: "no relationship with account manager", severity: 0.4, level: 2, indicators: [{ id: "RET_REL_02_NP", name: "NPS" }], interventions: ["INT_RET_REL_02_A", "INT_RET_REL_02_B", "INT_RET_REL_02_C"] }], indicators: [{ id: "RET_REL_01_HS", name: "health_score" }, { id: "RET_REL_02_NP", name: "NPS" }], interventions: ["INT_RET_REL_01_A", "INT_RET_REL_01_B", "INT_RET_REL_01_C", "INT_RET_REL_02_A", "INT_RET_REL_02_B", "INT_RET_REL_02_C"] },
        { id: "tru", code: "RET-TRU", name: "Trust", signals: [{ id: "RET_TRU_01", name: "broken promises", severity: 0.9, level: 1, indicators: [{ id: "RET_TRU_01_RR", name: "renewal_rate" }], interventions: ["INT_RET_TRU_01_A", "INT_RET_TRU_01_B", "INT_RET_TRU_01_C"] }, { id: "RET_TRU_02", name: "reputational damage", severity: 0.4, level: 2, indicators: [{ id: "RET_TRU_01_RR", name: "renewal_rate" }], interventions: ["INT_RET_TRU_02_A", "INT_RET_TRU_02_B", "INT_RET_TRU_02_C"] }], indicators: [{ id: "RET_TRU_01_RR", name: "renewal_rate" }], interventions: ["INT_RET_TRU_01_A", "INT_RET_TRU_01_B", "INT_RET_TRU_01_C", "INT_RET_TRU_02_A", "INT_RET_TRU_02_B", "INT_RET_TRU_02_C"] },
      ],
    },
    {
      id: "expansion",
      name: "Expansion",
      color: "#EF476F",
      causes: [
        { id: "grw", code: "EXP-GRW", name: "Growth Alignment", signals: [{ id: "EXP_GRW_01", name: "using competitors for other needs", severity: 0.6, level: 0, indicators: [{ id: "EXP_GRW_01_CS", name: "cross_sell_rate" }], interventions: ["INT_EXP_GRW_01_A", "INT_EXP_GRW_01_B", "INT_EXP_GRW_01_C"] }, { id: "EXP_GRW_02", name: "stagnant usage", severity: 0.7, level: 1, indicators: [{ id: "EXP_GRW_02_UA", name: "upsell_attempts" }], interventions: ["INT_EXP_GRW_02_A", "INT_EXP_GRW_02_B", "INT_EXP_GRW_02_C"] }], indicators: [{ id: "EXP_GRW_01_CS", name: "cross_sell_rate" }, { id: "EXP_GRW_02_UA", name: "upsell_attempts" }], interventions: ["INT_EXP_GRW_01_A", "INT_EXP_GRW_01_B", "INT_EXP_GRW_01_C", "INT_EXP_GRW_02_A", "INT_EXP_GRW_02_B", "INT_EXP_GRW_02_C"] },
        { id: "val", code: "EXP-VAL", name: "Value Perception", signals: [{ id: "EXP_VAL_01", name: "unwillingness to pay more", severity: 0.5, level: 3, indicators: [{ id: "EXP_VAL_01_ER", name: "expansion_revenue" }], interventions: ["INT_EXP_VAL_01_A", "INT_EXP_VAL_01_B", "INT_EXP_VAL_01_C"] }, { id: "EXP_VAL_02", name: "low ROI perception", severity: 0.6, level: 0, indicators: [{ id: "EXP_VAL_01_ER", name: "expansion_revenue" }], interventions: ["INT_EXP_VAL_02_A", "INT_EXP_VAL_02_B", "INT_EXP_VAL_02_C"] }], indicators: [{ id: "EXP_VAL_01_ER", name: "expansion_revenue" }], interventions: ["INT_EXP_VAL_01_A", "INT_EXP_VAL_01_B", "INT_EXP_VAL_01_C", "INT_EXP_VAL_02_A", "INT_EXP_VAL_02_B", "INT_EXP_VAL_02_C"] },
        { id: "rel", code: "EXP-REL", name: "Relationship", signals: [{ id: "EXP_REL_01", name: "blockers at executive level", severity: 0.5, level: 3, indicators: [{ id: "EXP_REL_01_NA", name: "number_of_advocates" }], interventions: ["INT_EXP_REL_01_A", "INT_EXP_REL_01_B", "INT_EXP_REL_01_C"] }, { id: "EXP_REL_02", name: "lack of champions", severity: 0.6, level: 0, indicators: [{ id: "EXP_REL_01_NA", name: "number_of_advocates" }], interventions: ["INT_EXP_REL_02_A", "INT_EXP_REL_02_B", "INT_EXP_REL_02_C"] }], indicators: [{ id: "EXP_REL_01_NA", name: "number_of_advocates" }], interventions: ["INT_EXP_REL_01_A", "INT_EXP_REL_01_B", "INT_EXP_REL_01_C", "INT_EXP_REL_02_A", "INT_EXP_REL_02_B", "INT_EXP_REL_02_C"] },
      ],
    },
  ],
};

export const uiStringsEn = {
  signals: "Signals",
  indicators: "Key Indicators",
  interventions: "Suggested Interventions",
  backToOverview: "Back to Overview",
  searchPlaceholder: "Search domains, causes, signals...",
  noResults: "No results found for",
  legend: "Legend",
  causeCodeSystem: "Cause Code System",
  home: "Home",
};
