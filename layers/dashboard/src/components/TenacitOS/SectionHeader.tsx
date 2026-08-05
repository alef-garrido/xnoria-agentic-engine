/**
 * SectionHeader Component
 * Based on Component/SectionHeader from tenacios-design.json
 */

interface SectionHeaderProps {
  label: string;
}

export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 font-[var(--font-body)]">
      {/* Accent Line */}
      <div className="accent-line" />

      {/* Section Label */}
      <span className="text-[11px] font-bold tracking-[2px] text-[var(--text-secondary)] uppercase">
        {label}
      </span>
    </div>
  );
}
