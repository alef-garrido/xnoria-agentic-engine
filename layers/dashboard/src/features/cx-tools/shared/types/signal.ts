/**
 * signal.ts - FlatSignal domain types
 *
 * Relocated from the radar repo's deprecated `domain/signals.ts`
 * (which was a backward-compat wrapper around signalBuilder and
 * read language from localStorage). The radar consumes the type-safe
 * `buildFlatSignals("en")` output directly.
 */

export type DomainCode =
  "ACQ" | "SAL" | "ONB" | "PRD" | "SUP" | "COM" | "RET" | "EXP" | "ADQ" | "VTA" | "PRO" | "SOP";

export interface FlatSignal {
  id: string; // e.g. ACQ_CLR_01
  label: string;
  severity: number;
  level: number;
  domain: DomainCode;
  domainName: string;
  domainColor: string;
  causeCode: string; // e.g. CLR
  causeName: string;
  indicators: Array<{ id: string; name: string }>;
  interventions: Array<{ id: string; name: string }>;
}
