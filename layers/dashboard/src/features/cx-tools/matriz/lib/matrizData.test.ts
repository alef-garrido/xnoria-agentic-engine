import { describe, expect, it } from "vitest";
import { resolveMatrizData } from "./matrizData";

describe("resolveMatrizData", () => {
  it("resolves EN data identical to the original hardcoded dataset", () => {
    const en = resolveMatrizData("en");

    expect(en.journey.map((s) => s.label)).toEqual([
      "Acquisition",
      "Sales Experience",
      "Onboarding",
      "Product Experience",
      "Support & Service",
      "Communication",
      "Retention",
      "Expansion",
    ]);

    const byId = Object.fromEntries(en.touchpoints.map((tp) => [tp.id, tp]));
    expect(byId.tp_ads).toMatchObject({
      label: "Ads / Landing",
      signals: ["Low CTR", "High bounce"],
      layers: {
        workflows: { text: "Lead capture and tracking", automation_level: "high" },
        agent: { text: "Detects low conversion and mismatch", decision_type: "diagnostic" },
        human: { text: "Adjusts campaigns and messaging", required: true },
      },
    });
    expect(byId.tp_first_contact.label).toBe("First Contact");
    expect(byId.tp_welcome.layers.human?.text).toBe("Intervenes in critical accounts");
    expect(byId.tp_feature.signals).toEqual(["Low usage", "UX friction"]);
    expect(byId.tp_support.layers.agent?.text).toBe("Suggests responses and detects urgency");
    expect(byId.tp_campaigns.layers.workflows?.text).toBe("Campaign automation");
    expect(byId.tp_churn_risk.impact).toBe("critical");
    expect(byId.tp_upsell.signals).toEqual(["Upgrade opportunity"]);
  });

  it("resolves ES translations for stages and touchpoints", () => {
    const es = resolveMatrizData("es");
    expect(es.journey[0].label).toBe("Adquisición");
    const churn = es.touchpoints.find((tp) => tp.id === "tp_churn_risk");
    expect(churn?.label).toBe("Riesgo de fuga");
    expect(churn?.layers.human?.text).toBe("Intervención estratégica");
  });
});
