/**
 * Canonical Domain Order — locked globally.
 *
 * Both Compass slices and Radar axes MUST follow this sequence
 * so the user builds consistent spatial memory across modes.
 */

export const DOMAIN_ORDER = ["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"] as const;

export type DomainCode = (typeof DOMAIN_ORDER)[number];

/** Map a domain prefix → canonical index (0-based). Returns -1 if unknown. */
export function getDomainIndex(domainCode: string): number {
  return (DOMAIN_ORDER as readonly string[]).indexOf(domainCode);
}

/** Angle in degrees for the centre of a domain slice. */
export function getDomainAngle(index: number, total: number = DOMAIN_ORDER.length): number {
  return index * (360 / total);
}
