/**
 * Integration testing for the CX visualization tools
 *
 * Ported from the CX Churn Wheel repo (src/test/phase6-integration.test.ts).
 * Adapted for the dashboard: EN-only (Spanish-language assertions dropped),
 * typed signal access via getCachedSignals("en").
 *
 * Tests cover:
 * 1. CX Compass (Wheel View)
 * 2. CX Cause Atlas (Matrix View)
 * 3. CX Signal Radar (Explorer View)
 * 4. Data integrity validation
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getCachedSignals, buildFlatSignals } from "@/features/cx-tools/shared/domain/signalBuilder";
import { validateWheelStructure } from "@/features/cx-tools/shared/domain/schemaValidation";
import {
  getInterventionOrThrow,
  validateInterventionId,
} from "@/features/cx-tools/shared/domain/interventionRegistry";
import type { FlatSignal } from "@/features/cx-tools/shared/types/signal";

describe("CX Tools Integration Testing", () => {
  let signals_en: FlatSignal[];

  beforeAll(() => {
    signals_en = getCachedSignals("en");
  });

  describe("CX Compass (Wheel Visualization)", () => {
    it("should have all signals loaded", () => {
      expect(signals_en).toBeDefined();
      expect(signals_en.length).toBeGreaterThan(0);
    });

    it("should have all 8 domains represented", () => {
      const domains = new Set(signals_en.map((s) => s.domain));
      expect(domains.size).toBe(8);
      expect(Array.from(domains)).toEqual(
        expect.arrayContaining(["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"])
      );
    });

    it("should have causes for each domain", () => {
      const causesByDomain = signals_en.reduce<Record<string, Set<string>>>((acc, signal) => {
        const domainCauses = acc[signal.domain] || new Set();
        domainCauses.add(signal.causeCode);
        acc[signal.domain] = domainCauses;
        return acc;
      }, {});

      Object.entries(causesByDomain).forEach(([domain, causes]) => {
        expect(causes.size).toBeGreaterThan(0);
        void domain;
      });
    });

    it("should have signals with valid severity and level", () => {
      signals_en.forEach((signal) => {
        expect(signal.severity).toBeGreaterThanOrEqual(0);
        expect(signal.severity).toBeLessThanOrEqual(1);
        expect(signal.level).toBeGreaterThanOrEqual(0);
        expect(signal.level).toBeLessThanOrEqual(3);
      });
    });

    it("should have all signals with color coding", () => {
      signals_en.forEach((signal) => {
        expect(signal.domainColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe("CX Cause Atlas (Matrix Visualization)", () => {
    it("should have all signals accessible by domain and cause", () => {
      signals_en.forEach((signal) => {
        expect(signal.domain).toBeDefined();
        expect(signal.causeCode).toBeDefined();
        expect(signal.causeCode).toMatch(/^[A-Z]{3}$/);
      });
    });

    it("should have proper domain-cause mapping", () => {
      const domainCauseMap = signals_en.reduce<Record<string, FlatSignal[]>>((acc, signal) => {
        const key = `${signal.domain}-${signal.causeCode}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(signal);
        return acc;
      }, {});

      Object.values(domainCauseMap).forEach((signalsInCell) => {
        expect(signalsInCell.length).toBeGreaterThan(0);
        expect(signalsInCell[0].domainName).toBeDefined();
        expect(signalsInCell[0].causeName).toBeDefined();
      });
    });

    it("should support drilling from matrix to compass", () => {
      // Verify all signals have the data needed for matrix-to-compass drill
      signals_en.forEach((signal) => {
        expect(signal.id).toBeDefined();
        expect(signal.label).toBeDefined();
        expect(signal.domain).toBeDefined();
        expect(signal.domainName).toBeDefined();
      });
    });
  });

  describe("CX Signal Radar (Multi-Dimensional Explorer)", () => {
    it("should have indicators for each signal", () => {
      signals_en.forEach((signal) => {
        expect(signal.indicators).toBeDefined();
        expect(Array.isArray(signal.indicators)).toBe(true);
      });
    });

    it("should have interventions for each signal", () => {
      signals_en.forEach((signal) => {
        expect(signal.interventions).toBeDefined();
        expect(Array.isArray(signal.interventions)).toBe(true);
        // Allow some signals to have empty interventions (data as-is)
        expect(signal.interventions).toEqual(expect.any(Array));
      });

      // But ensure most signals have interventions
      const withInterventions = signals_en.filter(
        (s) => s.interventions && s.interventions.length > 0
      );
      expect(withInterventions.length).toBeGreaterThan(signals_en.length * 0.8); // At least 80%
    });

    it("should support multi-signal selection and plotting", () => {
      // All signals should be selectable and have valid data for radar plotting
      signals_en.forEach((signal) => {
        expect(signal.domain).toBeDefined(); // For radar axis positioning
        expect(signal.severity).toBeDefined(); // For radar radius scaling
      });
    });

    it("should have unique domain colors for radar axes", () => {
      const domains = signals_en.reduce<Array<{ domain: string; color: string }>>((acc, signal) => {
        const existing = acc.find((d) => d.domain === signal.domain);
        if (!existing) {
          acc.push({
            domain: signal.domain,
            color: signal.domainColor,
          });
        }
        return acc;
      }, []);

      expect(domains.length).toBe(8);
      const colors = new Set(domains.map((d) => d.color));
      expect(colors.size).toBe(8); // All domains should have unique colors
    });
  });

  describe("Translation Completeness", () => {
    it("should have complete English translations", () => {
      signals_en.forEach((signal) => {
        expect(signal.label).toBeDefined();
        expect(signal.label.length).toBeGreaterThan(0);
        expect(typeof signal.label).toBe("string");
        expect(signal.domainName).toBeDefined();
        expect(signal.causeName).toBeDefined();
      });
    });

    it("should build English signals consistently", () => {
      const built = buildFlatSignals("en");
      expect(built.length).toBe(signals_en.length);
      expect(built[0].id).toBe(signals_en[0].id);
    });
  });

  describe("Data Integrity & Validation", () => {
    it("should pass schema validation at startup", () => {
      const { valid, errors } = validateWheelStructure();
      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it("should have all interventions properly referenced and accessible", () => {
      const interventionIds = new Set<string>();

      signals_en.forEach((signal) => {
        signal.interventions?.forEach((int) => {
          expect(int.id).toBeDefined();
          expect(int.name).toBeDefined();
          interventionIds.add(int.id);

          // Verify intervention can be retrieved
          const retrieved = getInterventionOrThrow(int.id);
          expect(retrieved.id).toBe(int.id);
        });
      });

      expect(interventionIds.size).toBeGreaterThan(50); // Should have 130+ interventions
    });

    it("should validate all intervention IDs at build time", () => {
      signals_en.forEach((signal) => {
        signal.interventions?.forEach((int) => {
          expect(validateInterventionId(int.id)).toBe(true);
        });
      });
    });

    it("should have consistent indicator metadata across signals", () => {
      signals_en.forEach((signal) => {
        signal.indicators?.forEach((indicator) => {
          expect(indicator.id).toBeDefined();
          expect(indicator.name).toBeDefined();
          expect(indicator.id).toMatch(/^[A-Z]{3}_[A-Z]{3}_\d{2}_[A-Z]{2}$/);
        });
      });
    });
  });

  describe("Performance Benchmarks", () => {
    it("should load all signals efficiently", () => {
      const start = performance.now();
      const testSignals = getCachedSignals("en");
      const end = performance.now();

      expect(testSignals.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100); // Should load in under 100ms
    });

    it("should filter signals efficiently", () => {
      const start = performance.now();
      const highSeverity = signals_en.filter((s) => s.severity > 0.7);
      const end = performance.now();

      expect(highSeverity.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(50); // Should filter in under 50ms
    });
  });

  describe("Accessibility & Error Handling", () => {
    it("should never have undefined interventions displayed", () => {
      signals_en.forEach((signal) => {
        expect(Array.isArray(signal.interventions)).toBe(true);
        signal.interventions?.forEach((int) => {
          expect(int).toBeDefined();
          expect(int.id).toBeTruthy();
          expect(int.name).toBeTruthy();
        });
      });
    });

    it("should have all signals properly categorized", () => {
      signals_en.forEach((signal) => {
        expect(signal.domain).toMatch(/^[A-Z]{3}$/);
        expect(signal.causeCode).toMatch(/^[A-Z]{3}$/);
        expect(signal.id).toMatch(/^[A-Z]{3}_[A-Z]{3}_\d{2}$/);
      });
    });

    it("should support empty/null gracefully (if applicable)", () => {
      // Verify no required fields are null/undefined for rendering
      signals_en.forEach((signal) => {
        expect(signal.id).toBeTruthy();
        expect(signal.label).toBeTruthy();
        expect(signal.domain).toBeTruthy();
        expect(signal.domainName).toBeTruthy();
        expect(signal.interventions).toBeDefined();
      });
    });
  });
});
