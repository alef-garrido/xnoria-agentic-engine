export const STAGES = ["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"] as const;

export type JourneyStage = (typeof STAGES)[number];

export const ACTIVE_STAGES: readonly JourneyStage[] = ["ACQ", "SAL", "SUP", "RET"];

export const TOAST_DURATION_MS = 4000;
