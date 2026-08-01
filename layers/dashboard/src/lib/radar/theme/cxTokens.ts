/**
 * CX Instrument Design Tokens — Single Source of Truth
 *
 * All visual constants consumed by Compass, Radar, and future modes.
 * Domain colors match the canonical palette in wheelDataEn / wheelDataEs.
 */

export const cxTokens = {
    color: {
        domain: {
            ACQ: "#3A86FF",
            SAL: "#8338EC",
            ONB: "#06D6A0",
            PRD: "#118AB2",
            SUP: "#FF9F1C",
            COM: "#F72585",
            RET: "#2EC4B6",
            EXP: "#EF476F",
        } as Record<string, string>,
    },

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
