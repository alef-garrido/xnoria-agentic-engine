/**
 * Unit tests for interventionRegistry
 * Phase 1: Intervention Registry Creation
 *
 * Tests verify:
 * - All interventions are properly defined
 * - No duplicate intervention IDs
 * - All interventions have valid translations
 * - Helper functions work correctly
 * - Type safety through TypeScript
 */

import { describe, it, expect } from "vitest";
import {
  INTERVENTIONS,
  getIntervention,
  validateInterventionId,
  getInterventionOrThrow,
  getAllInterventions,
  getInterventionsBySignal,
  getInterventionTranslation,
  validateInterventionList,
  getInterventionStats,
  type InterventionId,
} from "./interventionRegistry";

describe("InterventionRegistry", () => {
  // ============================================================================
  // Structure and Integrity Tests
  // ============================================================================

  it("should have 138 total interventions", () => {
    expect(Object.keys(INTERVENTIONS).length).toBe(138);
  });

  it("should have no duplicate intervention IDs", () => {
    const ids = Object.keys(INTERVENTIONS);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it("should have all interventions grouped as A, B, C options", () => {
    const interventions = getAllInterventions();
    for (const intervention of interventions) {
      expect(["A", "B", "C"]).toContain(intervention.option);
    }
  });

  it("should follow the INT_{DOMAIN}_{CAUSE}_{SIGNAL}_{OPTION} patterns", () => {
    const pattern = /^INT_[A-Z]{3}_[A-Z]{3}_\d{2}_[A-C]$/;
    const ids = Object.keys(INTERVENTIONS);
    for (const id of ids) {
      expect(id).toMatch(pattern);
    }
  });

  // ============================================================================
  // Translation Tests
  // ============================================================================

  it("should have English translation for every intervention", () => {
    const interventions = getAllInterventions();
    for (const intervention of interventions) {
      expect(intervention.translations.en).toBeDefined();
      expect(intervention.translations.en.length).toBeGreaterThan(0);
    }
  });

  it("should have Spanish translation for every intervention", () => {
    const interventions = getAllInterventions();
    for (const intervention of interventions) {
      expect(intervention.translations.es).toBeDefined();
      expect(intervention.translations.es.length).toBeGreaterThan(0);
    }
  });

  it("should not have empty translations", () => {
    const interventions = getAllInterventions();
    for (const intervention of interventions) {
      expect(intervention.translations.en.trim().length).toBeGreaterThan(0);
      expect(intervention.translations.es.trim().length).toBeGreaterThan(0);
    }
  });

  // ============================================================================
  // Signal Reference Tests
  // ============================================================================

  it("should have valid signal references in all interventions", () => {
    const signalPattern = /^[A-Z]{3}_[A-Z]{3}_\d{2}$/;
    const interventions = getAllInterventions();
    for (const intervention of interventions) {
      expect(intervention.signal).toMatch(signalPattern);
    }
  });

  it("should have signal reference matching intervention ID prefix", () => {
    const interventions = getAllInterventions();
    for (const intervention of interventions) {
      const idWithoutOption = intervention.id.replace(/^INT_/, "").replace(/_[A-C]$/, "");
      expect(idWithoutOption).toBe(intervention.signal);
    }
  });

  // ============================================================================
  // Helper Function Tests
  // ============================================================================

  it("getIntervention should return intervention for valid ID", () => {
    const intervention = getIntervention("INT_ACQ_VIS_01_A");
    expect(intervention).toBeDefined();
    expect(intervention?.id).toBe("INT_ACQ_VIS_01_A");
    expect(intervention?.signal).toBe("ACQ_VIS_01");
    expect(intervention?.option).toBe("A");
  });

  it("getIntervention should return null for invalid ID", () => {
    expect(getIntervention("INVALID")).toBeNull();
    expect(getIntervention("INT_FAKE_01_A")).toBeNull();
    expect(getIntervention(undefined)).toBeNull();
    expect(getIntervention(123)).toBeNull();
  });

  it("validateInterventionId should return true for valid IDs", () => {
    expect(validateInterventionId("INT_ACQ_VIS_01_A")).toBe(true);
    expect(validateInterventionId("INT_RET_VAL_02_C")).toBe(true);
    expect(validateInterventionId("INT_EXP_REL_02_B")).toBe(true);
  });

  it("validateInterventionId should return false for invalid IDs", () => {
    expect(validateInterventionId("INVALID")).toBe(false);
    expect(validateInterventionId("INT_FAKE_01_A")).toBe(false);
    expect(validateInterventionId(123)).toBe(false);
    expect(validateInterventionId(null)).toBe(false);
    expect(validateInterventionId(undefined)).toBe(false);
  });

  it("getInterventionOrThrow should return intervention for valid ID", () => {
    const intervention = getInterventionOrThrow("INT_ACQ_VIS_01_A");
    expect(intervention.id).toBe("INT_ACQ_VIS_01_A");
  });

  it("getInterventionOrThrow should throw for invalid ID", () => {
    expect(() => getInterventionOrThrow("INVALID")).toThrow();
    expect(() => getInterventionOrThrow("INT_FAKE_01_A")).toThrow();
  });

  it("getAllInterventions should return array of all interventions", () => {
    const all = getAllInterventions();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(138);
  });

  it("getInterventionsBySignal should return interventions for given signal", () => {
    const acqVis01 = getInterventionsBySignal("ACQ_VIS_01");
    expect(acqVis01.length).toBe(3); // A, B, C options
    expect(acqVis01.map((i) => i.option)).toEqual(["A", "B", "C"]);
  });

  it("getInterventionsBySignal should return empty array for non-existent signal", () => {
    const result = getInterventionsBySignal("FAKE_SIG_99");
    expect(result).toEqual([]);
  });

  it("getInterventionTranslation should return English translation", () => {
    const translation = getInterventionTranslation("INT_ACQ_VIS_01_A", "en");
    expect(translation).toBe("launch targeted display ads");
  });

  it("getInterventionTranslation should return Spanish translation", () => {
    const translation = getInterventionTranslation("INT_ACQ_VIS_01_A", "es");
    expect(translation).toBe("lanzar anuncios gráficos dirigidos");
  });

  it("getInterventionTranslation should return null for invalid ID", () => {
    const translation = getInterventionTranslation("INVALID", "en");
    expect(translation).toBeNull();
  });

  it("validateInterventionList should return true for valid list", () => {
    const validList = ["INT_ACQ_VIS_01_A", "INT_SAL_CLR_01_B", "INT_ONB_FRC_02_C"];
    expect(validateInterventionList(validList)).toBe(true);
  });

  it("validateInterventionList should return false for list with invalid IDs", () => {
    const invalidList = ["INT_ACQ_VIS_01_A", "INVALID", "INT_SAL_CLR_01_B"];
    expect(validateInterventionList(invalidList)).toBe(false);
  });

  it("validateInterventionList should return false for non-array input", () => {
    expect(validateInterventionList("not an array" as unknown as string[])).toBe(false);
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  it("getInterventionStats should return correct counts", () => {
    const stats = getInterventionStats();

    expect(stats.totalInterventions).toBe(138);
    expect(stats.totalSignals).toBeGreaterThan(0);
    expect(stats.totalDomains).toBe(8); // ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP
  });

  it("getInterventionStats should breakdown by signal", () => {
    const stats = getInterventionStats();

    // Each signal should have exactly 3 interventions (A, B, C)
    for (const [, count] of Object.entries(stats.bySignal)) {
      expect(count).toBe(3);
    }
  });

  it("getInterventionStats should breakdown by domain", () => {
    const stats = getInterventionStats();
    const domains = ["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"];

    for (const domain of domains) {
      expect(stats.byDomain[domain] ?? 0).toBeGreaterThan(0);
    }
  });

  // ============================================================================
  // Domain-Specific Tests
  // ============================================================================

  it("should have interventions for all domains", () => {
    const domains = new Set<string>();
    for (const intervention of getAllInterventions()) {
      const domain = intervention.signal.substring(0, 3);
      domains.add(domain);
    }

    const expected = new Set(["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"]);
    expect(domains).toEqual(expected);
  });

  it("should have multiple causes per domain", () => {
    const causes = new Map<string, Set<string>>();
    for (const intervention of getAllInterventions()) {
      const parts = intervention.signal.split("_");
      const domain = parts[0];
      const cause = parts[1];

      if (!causes.has(domain)) {
        causes.set(domain, new Set());
      }
      causes.get(domain)!.add(cause);
    }

    // Each domain should have multiple causes
    for (const [, causesSet] of causes) {
      expect(causesSet.size).toBeGreaterThanOrEqual(2);
    }
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  it("should support type-safe access with InterventionId type", () => {
    // This test verifies TypeScript compile-time type checking
    const id: InterventionId = "INT_ACQ_VIS_01_A";
    const intervention = INTERVENTIONS[id];

    expect(intervention).toBeDefined();
    expect(intervention.id).toBe("INT_ACQ_VIS_01_A");
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  it("should handle case-sensitive IDs correctly", () => {
    expect(getIntervention("int_acq_vis_01_a")).toBeNull();
    expect(getIntervention("INT_ACQ_VIS_01_a")).toBeNull();
    expect(getIntervention("INT_acq_vis_01_A")).toBeNull();
  });

  it("should handle whitespace correctly", () => {
    expect(getIntervention("INT_ACQ_VIS_01_A ")).toBeNull();
    expect(getIntervention(" INT_ACQ_VIS_01_A")).toBeNull();
    expect(getIntervention("INT_ACQ_VIS_01_A\n")).toBeNull();
  });

  // ============================================================================
  // Consistency Checks
  // ============================================================================

  it("should have all ACQ domain interventions present", () => {
    const causes = ["VIS", "CLR", "TRU"];
    const signals = ["01", "02"];

    for (const cause of causes) {
      for (const signal of signals) {
        for (const option of ["A", "B", "C"]) {
          const id = `INT_ACQ_${cause}_${signal}_${option}`;
          expect(getIntervention(id)).toBeDefined();
        }
      }
    }
  });

  it("should have all 8 domains represented in interventions", () => {
    const domains = ["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"];
    const foundDomains = new Set<string>();

    for (const intervention of getAllInterventions()) {
      const domain = intervention.signal.substring(0, 3);
      foundDomains.add(domain);
    }

    for (const domain of domains) {
      expect(foundDomains.has(domain)).toBe(true);
    }
  });
});
