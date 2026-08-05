/**
 * CX Instrument Design Tokens — Single Source of Truth
 *
 * All visual constants consumed by Compass, Radar, and future modes.
 * Domain colors come from the canonical wheel structure (wheelStructure.ts)
 * via `wheelData.color` — see signalBuilder.ts. They are not duplicated here.
 */

export const cxTokens = {
  stroke: {
    grid: { width: 1, opacity: 0.1 },
    axis: { width: 1, opacity: 0.14 },
    emphasis: { width: 2, opacity: 0.4 },
  },

  opacity: {
    inactive: 0.06,
    base: 0.2,
    active: 0.6,
    point: 0.9,
    dimmed: 0.25,
  },

  spacing: {
    unit: 4,
    radarPadding: 24,
    wheelPadding: 24,
  },

  motion: {
    fast: 0.15,
    base: 0.3,
    slow: 0.5,
  },
} as const;
