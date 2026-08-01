import { cxTokens } from "@/lib/radar/theme/cxTokens";

/**
 * Compass-specific tokens — derived from the shared cxTokens.
 * Keeps existing imports stable while centralising the source of truth.
 */
export const compassTokens = {
    ring: {
        strokeWidth: cxTokens.stroke.emphasis.width,
        opacity: cxTokens.opacity.dimmed,
    },
    tick: {
        major: { length: 14, width: cxTokens.stroke.emphasis.width, opacity: cxTokens.stroke.emphasis.opacity },
        minor: { length: 6, width: cxTokens.stroke.grid.width, opacity: 0.15 },
    },
    label: {
        size: 12,
        opacity: cxTokens.opacity.active,
        tracking: "0.08em",
    },
    innerGrid: {
        strokeWidth: cxTokens.stroke.grid.width,
        opacity: cxTokens.opacity.inactive,
        count: 3,
    },
    needle: {
        width: cxTokens.stroke.emphasis.width,
        opacity: cxTokens.opacity.active,
    },
};
