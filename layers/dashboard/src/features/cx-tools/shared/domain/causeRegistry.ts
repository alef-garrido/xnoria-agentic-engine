export type CauseCode = "VIS" | "CLR" | "FRC" | "CAP" | "TRU" | "VAL" | "REL" | "RES" | "CST" | "GRW" | "UNK";

export interface CauseMeta {
    code: CauseCode;
    label: string;
    color: string;
}

export const CAUSE_REGISTRY: Record<CauseCode, CauseMeta> = {
    VIS: { code: "VIS", label: "Visibility", color: "#FFD166" },
    CLR: { code: "CLR", label: "Clarity", color: "#8338EC" },
    FRC: { code: "FRC", label: "Friction", color: "#FF9F1C" },
    CAP: { code: "CAP", label: "Capability", color: "#06D6A0" },
    TRU: { code: "TRU", label: "Trust", color: "#3A86FF" },
    VAL: { code: "VAL", label: "Value Perception", color: "#F72585" },
    REL: { code: "REL", label: "Relationship", color: "#EF476F" },
    RES: { code: "RES", label: "Responsiveness", color: "#2EC4B6" },
    CST: { code: "CST", label: "Consistency", color: "#4CC9F0" },
    GRW: { code: "GRW", label: "Growth Alignment", color: "#A7C957" },
    UNK: { code: "UNK", label: "Unknown", color: "#888888" },
};

export function getCauseMeta(code: string): CauseMeta {
    const extracted = code.includes("-") ? code.split("-")[1] : code.includes("_") ? code.split("_")[1] : code;
    return CAUSE_REGISTRY[extracted as CauseCode] || { code: "UNK", label: "Unknown", color: "#888888" };
}
