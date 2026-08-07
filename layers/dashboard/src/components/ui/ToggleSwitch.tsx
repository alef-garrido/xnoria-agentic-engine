"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
  ariaLabel?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  activeColor = "var(--positive)",
  ariaLabel,
}: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="relative w-[36px] h-[20px] rounded-[10px] cursor-pointer transition-all duration-200 shrink-0"
      style={{
        backgroundColor: checked ? activeColor : "var(--surface-elevated)",
        border: `1px solid ${checked ? activeColor : "var(--border-strong)"}`,
      }}
    >
      <span
        className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-200"
        style={{
          left: checked ? "18px" : "2px",
          backgroundColor: checked ? "white" : "var(--text-muted)",
        }}
      />
    </button>
  );
}
