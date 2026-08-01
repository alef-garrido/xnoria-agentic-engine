/**
 * signalBuilder.ts - Type-Safe Signal Builder (Phase 3)
 * 
 * RFC: CX Diagnostic Compass Architecture Refactoring
 * 
 * This file transforms the validated data structure into FlatSignal format.
 * All intervention references are validated at build time and runtime.
 * 
 * Benefits:
 * - Compile-time validation of all intervention IDs
 * - Type-safe translation key resolution
 * - Single source of truth (no duplicate data)
 * - Clear error messages for data issues
 * - Caches built signals for performance
 */

import { WHEEL_STRUCTURE } from "@/lib/radar/data/wheelStructure";
import { validateInterventionId, getInterventionOrThrow } from "@/lib/radar/domain/interventionRegistry";
import { translate, type Language } from "@/lib/radar/i18n/translations";
import type { FlatSignal, DomainCode } from "@/lib/radar/types/signal";

/**
 * Build all flat signals from the wheel structure
 * Resolves all translations and intervention references
 * Throws if any intervention references are invalid
 * 
 * @param language - "en" for English, "es" for Spanish
 * @returns Array of FlatSignal objects ready for components
 * @throws Error if any intervention ID is invalid
 */
export function buildFlatSignals(language: Language): FlatSignal[] {
  const signals: FlatSignal[] = [];

  for (const domain of WHEEL_STRUCTURE.domains) {
    const domainCode = domain.code as DomainCode;
    const domainName = translate(domain.name_key, language);
    const domainColor = domain.color;

    for (const cause of domain.causes) {
      const causeName = translate(cause.name_key, language);
      const causeCode = cause.code;

      for (const signal of cause.signals) {
        // Resolve all interventions with type-safe access
        const resolvedInterventions = signal.intervention_ids
          .map((intId) => {
            // Validate intervention exists
            if (!validateInterventionId(intId)) {
              throw new Error(
                `Invalid intervention reference "${intId}" in signal "${signal.id}". ` +
                `Intervention does not exist in the intervention registry. ` +
                `Check interventionRegistry.ts for available interventions.`
              );
            }

            // Get the intervention (guaranteed to exist after validation)
            const intervention = getInterventionOrThrow(intId);

            return {
              id: intervention.id,
              name: intervention.translations[language] || intervention.translations.en,
            };
          });

        // Build the flat signal with full type safety
        signals.push({
          id: signal.id,
          label: translate(signal.name_key, language),
          severity: signal.severity ?? 0.5,
          level: signal.level ?? 0,
          domain: domainCode,
          domainName,
          domainColor,
          causeCode,
          causeName,
          indicators: signal.indicators.map((ind) => ({
            id: ind.id,
            name: translate(ind.name_key, language),
          })),
          interventions: resolvedInterventions,
        });
      }
    }
  }

  return signals;
}

/**
 * Cached signals to avoid rebuilding on every render
 * Invalidated when language changes
 */
const signalCache = new Map<Language, FlatSignal[]>();

/**
 * Get cached signals or build them if not cached
 * Use this in React components with language context
 * 
 * @param language - Current language setting
 * @returns Array of FlatSignal objects (cached)
 */
export function getCachedSignals(language: Language): FlatSignal[] {
  if (!signalCache.has(language)) {
    signalCache.set(language, buildFlatSignals(language));
  }
  return signalCache.get(language)!;
}

/**
 * Clear the signal cache
 * Useful for testing or forcing a rebuild
 */
export function clearSignalCache(): void {
  signalCache.clear();
}

/**
 * Get signal by ID
 * Useful for lookups in detail views
 * 
 * @param signalId - e.g. "ACQ_VIS_01"
 * @param language - Current language setting
 * @returns FlatSignal or undefined if not found
 */
export function getSignalById(
  signalId: string,
  language: Language
): FlatSignal | undefined {
  const signals = getCachedSignals(language);
  return signals.find((s) => s.id === signalId);
}

/**
 * Get all signals for a specific domain
 * Useful for domain-specific views
 * 
 * @param domainCode - e.g. "ACQ"
 * @param language - Current language setting
 * @returns Array of FlatSignal objects for the domain
 */
export function getSignalsByDomain(
  domainCode: DomainCode,
  language: Language
): FlatSignal[] {
  const signals = getCachedSignals(language);
  return signals.filter((s) => s.domain === domainCode);
}

/**
 * Get all signals for a specific cause
 * Useful for cause-specific analysis
 * 
 * @param domainCode - e.g. "ACQ"
 * @param causeCode - e.g. "CLR"
 * @param language - Current language setting
 * @returns Array of FlatSignal objects for the cause
 */
export function getSignalsByCause(
  domainCode: DomainCode,
  causeCode: string,
  language: Language
): FlatSignal[] {
  const signals = getCachedSignals(language);
  return signals.filter(
    (s) => s.domain === domainCode && s.causeCode === causeCode
  );
}

/**
 * Get all signals with severity above threshold
 * Useful for highlighting critical issues
 * 
 * @param minSeverity - Minimum severity (0-1)
 * @param language - Current language setting
 * @returns Array of FlatSignal objects above threshold
 */
export function getSignalsBySeverity(
  minSeverity: number,
  language: Language
): FlatSignal[] {
  const signals = getCachedSignals(language);
  return signals.filter((s) => s.severity >= minSeverity);
}

/**
 * Get all signals for a specific intervention
 * Useful for intervention detail views
 * 
 * @param interventionId - e.g. "INT_ACQ_VIS_01_A"
 * @param language - Current language setting
 * @returns Array of FlatSignal objects that include this intervention
 */
export function getSignalsByIntervention(
  interventionId: string,
  language: Language
): FlatSignal[] {
  const signals = getCachedSignals(language);
  return signals.filter((s) =>
    s.interventions.some((int) => int.id === interventionId)
  );
}

/**
 * Get statistics about signals
 * Useful for dashboards and analytics
 * 
 * @param language - Current language setting
 * @returns Object with signal statistics
 */
export function getSignalStats(language: Language): {
  totalSignals: number;
  totalDomains: number;
  totalCauses: number;
  avgSeverity: number;
  maxSeverity: number;
  minSeverity: number;
  signalsByDomain: Record<string, number>;
  signalsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
} {
  const signals = getCachedSignals(language);
  const domainCodes = new Set<string>();
  const causeCodes = new Set<string>();

  let totalSeverity = 0;
  let maxSeverity = 0;
  let minSeverity = 1;

  const severityBuckets = {
    critical: 0, // > 0.8
    high: 0, // 0.6 - 0.8
    medium: 0, // 0.4 - 0.6
    low: 0, // < 0.4
  };

  const signalsByDomain: Record<string, number> = {};

  for (const signal of signals) {
    domainCodes.add(signal.domain);
    causeCodes.add(`${signal.domain}_${signal.causeCode}`);

    totalSeverity += signal.severity;
    maxSeverity = Math.max(maxSeverity, signal.severity);
    minSeverity = Math.min(minSeverity, signal.severity);

    if (signal.severity > 0.8) {
      severityBuckets.critical++;
    } else if (signal.severity > 0.6) {
      severityBuckets.high++;
    } else if (signal.severity > 0.4) {
      severityBuckets.medium++;
    } else {
      severityBuckets.low++;
    }

    signalsByDomain[signal.domain] = (signalsByDomain[signal.domain] || 0) + 1;
  }

  return {
    totalSignals: signals.length,
    totalDomains: domainCodes.size,
    totalCauses: causeCodes.size,
    avgSeverity: signals.length > 0 ? totalSeverity / signals.length : 0,
    maxSeverity,
    minSeverity,
    signalsByDomain,
    signalsBySeverity: severityBuckets,
  };
}

/**
 * Validate all signals can be built without errors
 * Run at app startup to catch data issues early
 * 
 * @returns Object with validation result and any errors
 */
export function validateSignalBuilder(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Try building signals in both languages
    const enSignals = buildFlatSignals("en");
    const esSignals = buildFlatSignals("es");

    // Verify counts match
    if (enSignals.length !== esSignals.length) {
      errors.push(
        `Signal count mismatch: EN=${enSignals.length}, ES=${esSignals.length}`
      );
    }

    // Verify all signals have interventions
    for (const signal of enSignals) {
      if (signal.interventions.length === 0) {
        warnings.push(`Signal ${signal.id} has no interventions`);
      }

      // Verify intervention names are present
      for (const intervention of signal.interventions) {
        if (!intervention.name || intervention.name.length === 0) {
          errors.push(
            `Signal ${signal.id}: intervention ${intervention.id} has no name`
          );
        }
      }
    }

    // Verify all domains are represented
    const domainsFound = new Set<string>();
    for (const signal of enSignals) {
      domainsFound.add(signal.domain);
    }
    const expectedDomains = new Set(["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"]);
    for (const domain of expectedDomains) {
      if (!domainsFound.has(domain as DomainCode)) {
        warnings.push(`Domain ${domain} has no signals`);
      }
    }
  } catch (error) {
    errors.push(
      `Failed to build signals: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
