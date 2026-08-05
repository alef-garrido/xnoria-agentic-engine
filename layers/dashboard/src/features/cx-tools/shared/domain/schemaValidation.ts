/**
 * schemaValidation.ts - Runtime Data Integrity Validation
 *
 * Ported from the CX Churn Wheel repo (src/domain/schemaValidation.ts).
 * Adapted for the dashboard:
 * - EN-only translations (no Spanish completeness checks)
 *
 * Validates:
 * - Intervention references (all IDs exist in registry)
 * - Duplicate signal IDs (no conflicts)
 * - Translation key completeness (all keys have non-empty en translations)
 * - Domain consistency (codes match structure)
 * - Cause consistency (codes match structure)
 * - Signal severity/level ranges
 */

import { WHEEL_STRUCTURE } from "@/features/cx-tools/shared/data/wheelStructure";
import {
  INTERVENTIONS,
  validateInterventionId,
  type InterventionId,
} from "@/features/cx-tools/shared/domain/interventionRegistry";
import { TRANSLATIONS } from "@/features/cx-tools/shared/i18n/translations";

/**
 * Severity levels for validation errors
 */
export type ErrorSeverity = "error" | "warning";

/**
 * Validation error with context and severity
 */
export interface ValidationError {
  severity: ErrorSeverity;
  message: string;
  context?: {
    signal?: string;
    cause?: string;
    domain?: string;
    intervention?: string;
    translationKey?: string;
  };
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalDomains: number;
    totalCauses: number;
    totalSignals: number;
    totalInterventions: number;
    totalTranslationKeys: number;
    errorsCount: number;
    warningsCount: number;
  };
}

/**
 * Main validation function - validates entire wheel structure
 *
 * Runs all validators and collects results
 *
 * @returns ValidationResult with all errors/warnings found
 */
export function validateWheelStructure(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Collect stats
  let totalDomains = 0;
  let totalCauses = 0;
  let totalSignals = 0;

  // === Validate Intervention References ===
  for (const domain of WHEEL_STRUCTURE.domains) {
    totalDomains++;

    for (const cause of domain.causes) {
      totalCauses++;

      for (const signal of cause.signals) {
        totalSignals++;

        // Validate each intervention ID exists
        for (const intId of signal.intervention_ids) {
          if (!validateInterventionId(intId)) {
            errors.push({
              severity: "error",
              message: `Invalid intervention reference "${intId}"`,
              context: {
                signal: signal.id,
                cause: cause.code,
                domain: domain.code,
                intervention: intId,
              },
            });
          }
        }

        // Validate at least one intervention
        if (signal.intervention_ids.length === 0) {
          warnings.push({
            severity: "warning",
            message: `Signal has no interventions defined`,
            context: {
              signal: signal.id,
              cause: cause.code,
              domain: domain.code,
            },
          });
        }

        // Validate signal severity is in range
        if (signal.severity < 0 || signal.severity > 1) {
          errors.push({
            severity: "error",
            message: `Signal severity out of range [0-1]: ${signal.severity}`,
            context: {
              signal: signal.id,
              cause: cause.code,
              domain: domain.code,
            },
          });
        }

        // Validate signal level is in range
        if (signal.level < 0 || signal.level > 3) {
          errors.push({
            severity: "error",
            message: `Signal level out of range [0-3]: ${signal.level}`,
            context: {
              signal: signal.id,
              cause: cause.code,
              domain: domain.code,
            },
          });
        }

        // Validate indicators exist
        if (signal.indicators.length < 1) {
          warnings.push({
            severity: "warning",
            message: `Signal has no indicators defined`,
            context: {
              signal: signal.id,
              cause: cause.code,
              domain: domain.code,
            },
          });
        }
      }
    }
  }

  // === Validate No Duplicate Signal IDs ===
  const signalIdFrequency = new Map<string, number>();
  for (const domain of WHEEL_STRUCTURE.domains) {
    for (const cause of domain.causes) {
      for (const signal of cause.signals) {
        signalIdFrequency.set(signal.id, (signalIdFrequency.get(signal.id) ?? 0) + 1);
      }
    }
  }

  for (const [signalId, count] of signalIdFrequency.entries()) {
    if (count > 1) {
      errors.push({
        severity: "error",
        message: `Duplicate signal ID found ${count} times: "${signalId}"`,
        context: { signal: signalId },
      });
    }
  }

  // === Validate Translation Key Completeness ===
  const translationErrors = validateTranslationKeys();
  errors.push(...translationErrors.filter((e) => e.severity === "error"));
  warnings.push(...translationErrors.filter((e) => e.severity === "warning"));

  // === Validate Domain Structure ===
  for (const domain of WHEEL_STRUCTURE.domains) {
    if (!domain.code || domain.code.length === 0) {
      errors.push({
        severity: "error",
        message: `Domain missing code`,
        context: { domain: domain.id },
      });
    }

    if (!domain.name_key || domain.name_key.length === 0) {
      errors.push({
        severity: "error",
        message: `Domain missing name_key`,
        context: { domain: domain.code },
      });
    }

    if (!domain.color || domain.color.length === 0) {
      errors.push({
        severity: "error",
        message: `Domain missing color`,
        context: { domain: domain.code },
      });
    }

    // Validate cause structure
    for (const cause of domain.causes) {
      if (!cause.code || cause.code.length === 0) {
        errors.push({
          severity: "error",
          message: `Cause missing code`,
          context: { cause: cause.id, domain: domain.code },
        });
      }

      if (!cause.name_key || cause.name_key.length === 0) {
        errors.push({
          severity: "error",
          message: `Cause missing name_key`,
          context: { cause: cause.code, domain: domain.code },
        });
      }
    }
  }

  // === Validate Intervention Registry Completeness ===
  // Check that all referenced interventions have translations
  for (const domain of WHEEL_STRUCTURE.domains) {
    for (const cause of domain.causes) {
      for (const signal of cause.signals) {
        for (const intId of signal.intervention_ids) {
          if (intId in INTERVENTIONS) {
            const intervention = INTERVENTIONS[intId as InterventionId];
            if (!intervention.translations.en) {
              errors.push({
                severity: "error",
                message: `Intervention missing English translation`,
                context: { intervention: intId },
              });
            }
          }
        }
      }
    }
  }

  const summary = {
    totalDomains,
    totalCauses,
    totalSignals,
    totalInterventions: Object.keys(INTERVENTIONS).length,
    totalTranslationKeys: Object.keys(TRANSLATIONS.en).length,
    errorsCount: errors.length,
    warningsCount: warnings.length,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

/**
 * Validate that all translation keys have non-empty English values
 *
 * @returns Array of validation errors for missing/incomplete translations
 */
function validateTranslationKeys(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check all EN keys have non-empty values
  for (const [key, value] of Object.entries(TRANSLATIONS.en)) {
    if (!value) {
      errors.push({
        severity: "warning",
        message: `Empty English translation for key "${key}"`,
        context: { translationKey: key },
      });
    }
  }

  // Validate all signal/cause/domain keys are referenced
  errors.push(...validateDataStructureKeyReferences());

  return errors;
}

/**
 * Validate that all translation keys referenced in data structure exist
 *
 * @returns Array of validation errors for missing translation keys
 */
function validateDataStructureKeyReferences(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check center keys
  if (!(WHEEL_STRUCTURE.center.name_key in TRANSLATIONS.en)) {
    errors.push({
      severity: "error",
      message: `Translation key not found: "${WHEEL_STRUCTURE.center.name_key}"`,
      context: { translationKey: WHEEL_STRUCTURE.center.name_key },
    });
  }

  // Check domain/cause/signal/indicator keys
  for (const domain of WHEEL_STRUCTURE.domains) {
    if (!(domain.name_key in TRANSLATIONS.en)) {
      errors.push({
        severity: "error",
        message: `Translation key not found for domain: "${domain.name_key}"`,
        context: { translationKey: domain.name_key, domain: domain.code },
      });
    }

    for (const cause of domain.causes) {
      if (!(cause.name_key in TRANSLATIONS.en)) {
        errors.push({
          severity: "error",
          message: `Translation key not found for cause: "${cause.name_key}"`,
          context: {
            translationKey: cause.name_key,
            cause: cause.code,
            domain: domain.code,
          },
        });
      }

      for (const signal of cause.signals) {
        if (!(signal.name_key in TRANSLATIONS.en)) {
          errors.push({
            severity: "error",
            message: `Translation key not found for signal: "${signal.name_key}"`,
            context: {
              translationKey: signal.name_key,
              signal: signal.id,
              cause: cause.code,
              domain: domain.code,
            },
          });
        }

        for (const indicator of signal.indicators) {
          if (!(indicator.name_key in TRANSLATIONS.en)) {
            errors.push({
              severity: "error",
              message: `Translation key not found for indicator: "${indicator.name_key}"`,
              context: {
                translationKey: indicator.name_key,
                signal: signal.id,
                cause: cause.code,
                domain: domain.code,
              },
            });
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Get all validation errors (both errors and warnings)
 *
 * @returns Array of all validation errors
 */
export function getAllValidationErrors(): ValidationError[] {
  const result = validateWheelStructure();
  return [...result.errors, ...result.warnings];
}

/**
 * Format validation errors for console output
 *
 * @param result - Validation result to format
 * @returns Formatted string for logging
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push("=== Wheel Structure Validation ===");
  lines.push("");
  lines.push(`Status: ${result.valid ? "✅ VALID" : "❌ INVALID"}`);
  lines.push("");

  lines.push("Summary:");
  lines.push(`  Domains: ${result.summary.totalDomains}`);
  lines.push(`  Causes: ${result.summary.totalCauses}`);
  lines.push(`  Signals: ${result.summary.totalSignals}`);
  lines.push(`  Interventions: ${result.summary.totalInterventions}`);
  lines.push(`  Translation Keys: ${result.summary.totalTranslationKeys}`);
  lines.push("");

  if (result.errors.length > 0) {
    lines.push(`❌ Errors (${result.summary.errorsCount}):`);
    for (const error of result.errors) {
      lines.push(`  - ${error.message}`);
      if (error.context) {
        const contextStr = Object.entries(error.context)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        if (contextStr) lines.push(`    (${contextStr})`);
      }
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push(`⚠️  Warnings (${result.summary.warningsCount}):`);
    for (const warning of result.warnings) {
      lines.push(`  - ${warning.message}`);
      if (warning.context) {
        const contextStr = Object.entries(warning.context)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        if (contextStr) lines.push(`    (${contextStr})`);
      }
    }
    lines.push("");
  }

  if (result.valid) {
    lines.push("✅ All validation checks passed!");
  } else {
    lines.push(`❌ Validation failed with ${result.summary.errorsCount} errors`);
  }

  return lines.join("\n");
}

/**
 * Helper function to throw on validation errors
 * Useful for startup validation that should fail the app
 *
 * @throws Error if validation fails
 */
export function throwOnValidationError(): void {
  const result = validateWheelStructure();
  if (!result.valid) {
    const errorList = result.errors
      .map((e) => `${e.message}${e.context ? ` (${JSON.stringify(e.context)})` : ""}`)
      .join("\n");
    throw new Error(`Wheel structure validation failed:\n${errorList}`);
  }
}
