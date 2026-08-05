import { cxTokens } from "./cxTokens";

/**
 * Radar-specific tokens — derived from the shared cxTokens.
 * Keeps existing imports stable while centralising the source of truth.
 */
export const radarTokens = {
  grid: {
    stroke: `rgba(255, 255, 255, ${cxTokens.stroke.grid.opacity})`,
    strokeWidth: cxTokens.stroke.grid.width,
  },
  axes: {
    stroke: `rgba(255, 255, 255, ${cxTokens.stroke.axis.opacity})`,
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
