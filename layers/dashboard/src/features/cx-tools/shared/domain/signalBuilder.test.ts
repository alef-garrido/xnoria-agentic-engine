/**
 * Unit tests for signalBuilder
 * Ported from the CX Churn Wheel repo (src/domain/signalBuilder.test.ts).
 * Adapted for the dashboard: EN-only (no Spanish builder tests).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  buildFlatSignals,
  getCachedSignals,
  clearSignalCache,
  getSignalById,
  getSignalsByDomain,
  getSignalsByCause,
  getSignalsBySeverity,
  getSignalsByIntervention,
  getSignalStats,
  validateSignalBuilder,
} from "./signalBuilder";

describe("SignalBuilder", () => {
  beforeEach(() => {
    clearSignalCache();
  });

  // ============================================================================
  // Build Tests
  // ============================================================================

  it("should build flat signals for English", () => {
    const signals = buildFlatSignals("en");
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]).toHaveProperty("id");
    expect(signals[0]).toHaveProperty("label");
    expect(signals[0]).toHaveProperty("domain");
  });

  it("should have proper FlatSignal structure", () => {
    const signals = buildFlatSignals("en");
    const signal = signals[0];

    expect(signal).toHaveProperty("id");
    expect(signal).toHaveProperty("label");
    expect(signal).toHaveProperty("severity");
    expect(signal).toHaveProperty("level");
    expect(signal).toHaveProperty("domain");
    expect(signal).toHaveProperty("domainName");
    expect(signal).toHaveProperty("domainColor");
    expect(signal).toHaveProperty("causeCode");
    expect(signal).toHaveProperty("causeName");
    expect(signal).toHaveProperty("indicators");
    expect(signal).toHaveProperty("interventions");
  });

  // ============================================================================
  // Intervention Resolution Tests
  // ============================================================================

  it("should resolve all interventions correctly", () => {
    const signals = buildFlatSignals("en");

    for (const signal of signals) {
      for (const intervention of signal.interventions) {
        expect(intervention.id).toBeDefined();
        expect(intervention.name).toBeDefined();
        expect(intervention.name.length).toBeGreaterThan(0);
      }
    }
  });

  // ============================================================================
  // Translation Tests
  // ============================================================================

  it("should have English labels for all signals", () => {
    const signals = buildFlatSignals("en");

    for (const signal of signals) {
      expect(signal.label).toBeDefined();
      expect(signal.label.length).toBeGreaterThan(0);
      expect(signal.domainName.length).toBeGreaterThan(0);
      expect(signal.causeName.length).toBeGreaterThan(0);
    }
  });

  it("should have translations for all indicators", () => {
    const signals = buildFlatSignals("en");

    for (const signal of signals) {
      for (const indicator of signal.indicators) {
        expect(indicator.name).toBeDefined();
        expect(indicator.name.length).toBeGreaterThan(0);
      }
    }
  });

  // ============================================================================
  // Lookup Tests
  // ============================================================================

  it("getSignalById should return signal for valid ID", () => {
    const signals = buildFlatSignals("en");
    const firstSignal = signals[0];

    const found = getSignalById(firstSignal.id, "en");
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstSignal.id);
  });

  it("getSignalById should return undefined for invalid ID", () => {
    const found = getSignalById("FAKE_SIGNAL_01", "en");
    expect(found).toBeUndefined();
  });

  it("getSignalsByDomain should return signals for domain", () => {
    const acqSignals = getSignalsByDomain("ACQ", "en");
    expect(acqSignals.length).toBeGreaterThan(0);

    for (const signal of acqSignals) {
      expect(signal.domain).toBe("ACQ");
    }
  });

  it("getSignalsByCause should return signals for cause", () => {
    const signals = getSignalsByCause("ACQ", "CLR", "en");
    expect(signals.length).toBeGreaterThan(0);

    for (const signal of signals) {
      expect(signal.domain).toBe("ACQ");
      expect(signal.causeCode).toBe("CLR");
    }
  });

  // ============================================================================
  // Filtering Tests
  // ============================================================================

  it("getSignalsBySeverity should filter by severity threshold", () => {
    const highSeverity = getSignalsBySeverity(0.8, "en");
    expect(highSeverity.length).toBeGreaterThan(0);

    for (const signal of highSeverity) {
      expect(signal.severity).toBeGreaterThanOrEqual(0.8);
    }
  });

  it("getSignalsByIntervention should return signals with intervention", () => {
    const enSignals = buildFlatSignals("en");
    const firstSignal = enSignals[0];

    if (firstSignal.interventions.length > 0) {
      const interventionId = firstSignal.interventions[0].id;
      const signals = getSignalsByIntervention(interventionId, "en");

      expect(signals.length).toBeGreaterThan(0);
      expect(signals.some((s) => s.id === firstSignal.id)).toBe(true);
    }
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  it("getSignalStats should return correct counts", () => {
    const stats = getSignalStats("en");

    expect(stats.totalSignals).toBeGreaterThan(0);
    expect(stats.totalDomains).toBe(8); // 8 domains
    expect(stats.totalCauses).toBeGreaterThan(0);
  });

  it("getSignalStats should have correct severity distribution", () => {
    const signals = buildFlatSignals("en");
    const stats = getSignalStats("en");

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const signal of signals) {
      if (signal.severity > 0.8) {
        criticalCount++;
      } else if (signal.severity > 0.6) {
        highCount++;
      } else if (signal.severity > 0.4) {
        mediumCount++;
      } else {
        lowCount++;
      }
    }

    expect(stats.signalsBySeverity.critical).toBe(criticalCount);
    expect(stats.signalsBySeverity.high).toBe(highCount);
    expect(stats.signalsBySeverity.medium).toBe(mediumCount);
    expect(stats.signalsBySeverity.low).toBe(lowCount);
  });

  it("getSignalStats should have correct average severity", () => {
    const signals = buildFlatSignals("en");
    const stats = getSignalStats("en");

    let sum = 0;
    for (const signal of signals) {
      sum += signal.severity;
    }
    const expected = sum / signals.length;

    expect(stats.avgSeverity).toBeCloseTo(expected, 2);
  });

  it("getSignalStats should track signals by domain", () => {
    const stats = getSignalStats("en");

    expect(stats.signalsByDomain["ACQ"]).toBeGreaterThan(0);
    expect(stats.signalsByDomain["SAL"]).toBeGreaterThan(0);
    expect(stats.signalsByDomain["ONB"]).toBeGreaterThan(0);
    expect(stats.signalsByDomain["PRD"]).toBeGreaterThan(0);
    expect(stats.signalsByDomain["SUP"]).toBeGreaterThan(0);
    expect(stats.signalsByDomain["COM"]).toBeGreaterThan(0);
    expect(stats.signalsByDomain["RET"]).toBeGreaterThan(0);
    expect(stats.signalsByDomain["EXP"]).toBeGreaterThan(0);
  });

  // ============================================================================
  // Caching Tests
  // ============================================================================

  it("getCachedSignals should cache results", () => {
    const first = getCachedSignals("en");
    const second = getCachedSignals("en");

    // Should be the same array reference (cached)
    expect(first).toBe(second);
  });

  it("clearSignalCache should invalidate cache", () => {
    const first = getCachedSignals("en");
    clearSignalCache();
    const second = getCachedSignals("en");

    // Should be different array references after cache clear
    expect(first).not.toBe(second);
    // But with same data
    expect(first.length).toBe(second.length);
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  it("validateSignalBuilder should succeed with valid structure", () => {
    const validation = validateSignalBuilder();

    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it("validateSignalBuilder should check intervention presence", () => {
    const validation = validateSignalBuilder();

    // Some signals may have no interventions, but that's okay
    // The test just verifies the validation function works
    expect(validation).toHaveProperty("valid");
    expect(validation).toHaveProperty("errors");
    expect(validation).toHaveProperty("warnings");
  });

  // ============================================================================
  // Domain Coverage Tests
  // ============================================================================

  it("should have signals for all 8 domains", () => {
    const signals = buildFlatSignals("en");
    const domains = new Set<string>();

    for (const signal of signals) {
      domains.add(signal.domain);
    }

    const expected = new Set(["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"]);
    expect(domains).toEqual(expected);
  });

  it("should have well-formed signal IDs", () => {
    const signals = buildFlatSignals("en");
    const signalIdPattern = /^[A-Z]{3}_[A-Z]{3}_\d{2}$/;

    for (const signal of signals) {
      expect(signal.id).toMatch(signalIdPattern);
    }
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  it("should have colors for all domains", () => {
    const signals = buildFlatSignals("en");
    const domainColors = new Set<string>();

    for (const signal of signals) {
      expect(signal.domainColor).toMatch(/^#[0-9A-F]{6}$/i);
      domainColors.add(signal.domainColor);
    }

    // Should have multiple distinct colors
    expect(domainColors.size).toBeGreaterThan(1);
  });

  it("should handle signals with no interventions gracefully", () => {
    const signals = buildFlatSignals("en");

    // Find a signal (some may have no interventions)
    const signalWithoutInterventions = signals.find(
      (s) => s.interventions.length === 0
    );
    if (signalWithoutInterventions) {
      expect(signalWithoutInterventions.interventions).toEqual([]);
    }
  });
});
