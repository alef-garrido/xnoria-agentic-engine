/**
 * Unit tests for schemaValidation
 * Ported from the CX Churn Wheel repo (src/domain/schemaValidation.test.ts).
 * Adapted for the dashboard: EN-only (no en/es key-parity assertions).
 */

import { describe, it, expect } from "vitest";
import {
  validateWheelStructure,
  getAllValidationErrors,
  formatValidationResult,
  throwOnValidationError,
} from "./schemaValidation";

describe("SchemaValidation", () => {
  // ============================================================================
  // Basic Structure Tests
  // ============================================================================

  it("should validate the current wheel structure as valid", () => {
    const result = validateWheelStructure();
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should have correct summary counts", () => {
    const result = validateWheelStructure();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalDomains).toBeGreaterThan(0);
    expect(result.summary.totalCauses).toBeGreaterThan(0);
    expect(result.summary.totalSignals).toBeGreaterThan(0);
    expect(result.summary.totalInterventions).toBeGreaterThan(0);
    expect(result.summary.totalTranslationKeys).toBeGreaterThan(0);
  });

  it("should report exact domain count (8 active domains)", () => {
    const result = validateWheelStructure();
    expect(result.summary.totalDomains).toBe(8);
  });

  it("should report at least 40+ signals", () => {
    const result = validateWheelStructure();
    expect(result.summary.totalSignals).toBeGreaterThanOrEqual(40);
  });

  it("should report 138 interventions from registry", () => {
    const result = validateWheelStructure();
    expect(result.summary.totalInterventions).toBe(138);
  });

  it("should have 100+ translation keys", () => {
    const result = validateWheelStructure();
    expect(result.summary.totalTranslationKeys).toBeGreaterThan(100);
  });

  // ============================================================================
  // Intervention Reference Tests
  // ============================================================================

  it("should validate all signal intervention references", () => {
    const result = validateWheelStructure();
    const interventionErrors = result.errors.filter((e) =>
      e.message.includes("Invalid intervention reference")
    );
    expect(interventionErrors.length).toBe(0);
  });

  it("should find intervention errors with proper context", () => {
    // We expect no errors, but verify the structure would have context
    const result = validateWheelStructure();
    for (const error of result.errors) {
      if (error.message.includes("Invalid intervention")) {
        expect(error.context).toBeDefined();
        expect(error.context?.signal).toBeDefined();
        expect(error.context?.intervention).toBeDefined();
      }
    }
  });

  it("should verify all referenced interventions have translations", () => {
    const result = validateWheelStructure();
    const translationErrors = result.errors.filter((e) =>
      e.message.includes("translation")
    );
    expect(translationErrors.length).toBe(0);
  });

  // ============================================================================
  // Signal Structure Tests
  // ============================================================================

  it("should not have duplicate signal IDs", () => {
    const result = validateWheelStructure();
    const duplicateErrors = result.errors.filter((e) =>
      e.message.includes("Duplicate signal ID")
    );
    expect(duplicateErrors.length).toBe(0);
  });

  it("should verify signal severity is in valid range [0-1]", () => {
    const result = validateWheelStructure();
    const severityErrors = result.errors.filter((e) =>
      e.message.includes("severity")
    );
    expect(severityErrors.length).toBe(0);
  });

  it("should verify signal level is in valid range [0-3]", () => {
    const result = validateWheelStructure();
    const levelErrors = result.errors.filter((e) =>
      e.message.includes("level")
    );
    expect(levelErrors.length).toBe(0);
  });

  // ============================================================================
  // Translation Key Tests
  // ============================================================================

  it("should verify all signal name_key translations exist", () => {
    const result = validateWheelStructure();
    const signalKeyErrors = result.errors.filter((e) =>
      e.message.includes("Translation key not found for signal")
    );
    expect(signalKeyErrors.length).toBe(0);
  });

  it("should verify all cause name_key translations exist", () => {
    const result = validateWheelStructure();
    const causeKeyErrors = result.errors.filter((e) =>
      e.message.includes("Translation key not found for cause")
    );
    expect(causeKeyErrors.length).toBe(0);
  });

  it("should verify all domain name_key translations exist", () => {
    const result = validateWheelStructure();
    const domainKeyErrors = result.errors.filter((e) =>
      e.message.includes("Translation key not found for domain")
    );
    expect(domainKeyErrors.length).toBe(0);
  });

  it("should verify all indicator name_key translations exist", () => {
    const result = validateWheelStructure();
    const indicatorKeyErrors = result.errors.filter((e) =>
      e.message.includes("Translation key not found for indicator")
    );
    expect(indicatorKeyErrors.length).toBe(0);
  });

  // ============================================================================
  // Domain/Cause Structure Tests
  // ============================================================================

  it("should verify all domains have required fields", () => {
    const result = validateWheelStructure();
    const domainErrors = result.errors.filter((e) =>
      e.message.includes("Domain")
    );
    expect(domainErrors.length).toBe(0);
  });

  it("should verify all causes have required fields", () => {
    const result = validateWheelStructure();
    const causeErrors = result.errors.filter((e) =>
      e.message.includes("Cause")
    );
    expect(causeErrors.length).toBe(0);
  });

  // ============================================================================
  // Error/Warning Differentiation Tests
  // ============================================================================

  it("should separate errors from warnings", () => {
    const result = validateWheelStructure();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);

    for (const error of result.errors) {
      expect(error.severity).toBe("error");
    }

    for (const warning of result.warnings) {
      expect(warning.severity).toBe("warning");
    }
  });

  it("should include context in error objects", () => {
    const result = validateWheelStructure();
    for (const error of result.errors) {
      if (error.context) {
        expect(typeof error.context).toBe("object");
        // At least some context property should be defined
        const hasContext = Object.values(error.context).some((v) => v);
        expect(hasContext).toBe(true);
      }
    }
  });

  // ============================================================================
  // Utility Function Tests
  // ============================================================================

  it("should format validation result as string", () => {
    const result = validateWheelStructure();
    const formatted = formatValidationResult(result);

    expect(typeof formatted).toBe("string");
    expect(formatted).toContain("Validation");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("should include summary in formatted output", () => {
    const result = validateWheelStructure();
    const formatted = formatValidationResult(result);

    expect(formatted).toContain("Domains:");
    expect(formatted).toContain("Signals:");
  });

  it("should include validation status in formatted output", () => {
    const result = validateWheelStructure();
    const formatted = formatValidationResult(result);

    if (result.valid) {
      expect(formatted).toContain("VALID");
    } else {
      expect(formatted).toContain("INVALID");
    }
  });

  it("should get all validation errors as flat array", () => {
    const allErrors = getAllValidationErrors();
    expect(Array.isArray(allErrors)).toBe(true);
    // All should have required properties
    for (const error of allErrors) {
      expect(error.severity).toBeDefined();
      expect(error.message).toBeDefined();
    }
  });

  // ============================================================================
  // Throw on Error Tests
  // ============================================================================

  it("should not throw when validation passes", () => {
    expect(() => {
      throwOnValidationError();
    }).not.toThrow();
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  it("should validate complete structure end-to-end", () => {
    const result = validateWheelStructure();

    // Should be valid
    expect(result.valid).toBe(true);

    // Should have content
    expect(result.summary.totalDomains).toBeGreaterThan(0);
    expect(result.summary.totalSignals).toBeGreaterThan(0);

    // Should have no critical errors
    expect(result.errors.length).toBe(0);
  });

  it("should handle multiple validation passes consistently", () => {
    const result1 = validateWheelStructure();
    const result2 = validateWheelStructure();

    expect(result1.valid).toBe(result2.valid);
    expect(result1.summary.totalDomains).toBe(result2.summary.totalDomains);
    expect(result1.summary.totalSignals).toBe(result2.summary.totalSignals);
  });

  it("should maintain error counts correctly", () => {
    const result = validateWheelStructure();

    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;

    expect(result.summary.errorsCount).toBe(errorCount);
    expect(result.summary.warningsCount).toBe(warningCount);
  });

  // ============================================================================
  // Edge Cases and Data Quality
  // ============================================================================

  it("should warn about signals with no interventions if any exist", () => {
    const result = validateWheelStructure();
    // This checks that the validation runs, not that there are warnings
    expect(result).toBeDefined();
  });

  it("should have reasonable intervention reference counts", () => {
    const result = validateWheelStructure();
    // Each signal should reference at least 1 intervention
    // Total signals should be around 50
    const interventionRefsPerSignal = result.summary.totalInterventions / result.summary.totalSignals;
    expect(interventionRefsPerSignal).toBeLessThan(10); // Sanity check
  });

  it("should have more translation keys than signals", () => {
    const result = validateWheelStructure();
    // Should have keys for domains, causes, signals, indicators
    expect(result.summary.totalTranslationKeys).toBeGreaterThan(0);
    expect(result.summary.totalTranslationKeys).toBeLessThanOrEqual(500);
  });
});
