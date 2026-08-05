"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  activeColor = "var(--positive)",
}: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        backgroundColor: checked ? activeColor : "var(--surface-elevated)",
        border: `1px solid ${checked ? activeColor : "var(--border-strong)"}`,
        position: "relative",
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "18px" : "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor: checked ? "white" : "var(--text-muted)",
          transition: "all 0.2s ease",
        }}
      />
    </button>
  );
}
