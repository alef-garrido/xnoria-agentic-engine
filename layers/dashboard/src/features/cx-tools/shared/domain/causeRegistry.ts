export type CauseCode =
  "VIS" | "CLR" | "FRC" | "CAP" | "TRU" | "VAL" | "REL" | "RES" | "CST" | "GRW" | "UNK";

export interface CauseMeta {
  code: CauseCode;
  label: string;
  color: string;
}

export const CAUSE_REGISTRY: Record<CauseCode, CauseMeta> = {
  VIS: { code: "VIS", label: "Visibility", color: "#0080FF" },
  CLR: { code: "CLR", label: "Clarity", color: "#9933FF" },
  FRC: { code: "FRC", label: "Friction", color: "#FF8000" },
  CAP: { code: "CAP", label: "Capability", color: "#00CC66" },
  TRU: { code: "TRU", label: "Trust", color: "#4080BF" },
  VAL: { code: "VAL", label: "Value Perception", color: "#FFD500" },
  REL: { code: "REL", label: "Relationship", color: "#FF33CC" },
  RES: { code: "RES", label: "Responsiveness", color: "#FF3333" },
  CST: { code: "CST", label: "Consistency", color: "#00CCCC" },
  GRW: { code: "GRW", label: "Growth Alignment", color: "#33CC00" },
  UNK: { code: "UNK", label: "Unknown", color: "#888888" },
};

export function getCauseMeta(code: string): CauseMeta {
  const extracted = code.includes("-")
    ? code.split("-")[1]
    : code.includes("_")
      ? code.split("_")[1]
      : code;
  return (
    CAUSE_REGISTRY[extracted as CauseCode] || { code: "UNK", label: "Unknown", color: "#888888" }
  );
}
