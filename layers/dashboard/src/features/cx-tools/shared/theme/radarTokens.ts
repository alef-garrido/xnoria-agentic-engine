import { cxTokens } from "./cxTokens";

/**
 * Radar-specific tokens — derived from the shared cxTokens.
 * Keeps existing imports stable while centralising the source of truth.
 */
export const radarTokens = {
  grid: {
    stroke: `var(--gridline-soft)`,
    strokeWidth: cxTokens.stroke.grid.width,
  },
  axes: {
    stroke: `var(--gridline)`,
    strokeWidth: cxTokens.stroke.axis.width,
  },
  point: {
    baseRadius: 6,
    hoverRadius: 10,
  },
  opacity: {
    dimmed: cxTokens.opacity.dimmed,
    inactive: cxTokens.opacity.inactive,
  },
};
