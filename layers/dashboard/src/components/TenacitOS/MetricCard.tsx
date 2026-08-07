/**
 * MetricCard Component
 * Based on Component/MetricCard from tenacios-design.json
 */

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  change?: string;
  changeColor?: "positive" | "negative" | "warning" | "secondary";
}

export function MetricCard({
  icon: Icon,
  value,
  label,
  change,
  changeColor = "positive",
}: MetricCardProps) {
  const changeColorMap = {
    positive: "var(--positive)",
    negative: "var(--negative)",
    warning: "var(--warning)",
    secondary: "var(--text-secondary)",
  };

  return (
    <div className="flex flex-col gap-2 bg-[var(--surface)] rounded-[12px] p-4">
      {/* Top Row: Icon + Change */}
      <div className="flex justify-between items-center">
        <Icon className="w-5 h-5 text-[var(--text-muted)]" />
        {change && (
          <span
            className="font-[var(--font-body)] text-[11px] font-semibold"
            style={{ color: changeColorMap[changeColor] }}
          >
            {change}
          </span>
        )}
      </div>

      {/* Metric Value */}
      <div className="font-[var(--font-heading)] text-[28px] font-bold -tracking-[1.5px] text-[var(--text-primary)]">
        {value}
      </div>

      {/* Metric Label */}
      <div className="font-[var(--font-body)] text-[12px] font-medium text-[var(--text-secondary)]">
        {label}
      </div>
    </div>
  );
}
