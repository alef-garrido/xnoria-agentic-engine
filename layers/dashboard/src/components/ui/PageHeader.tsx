import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional leading element rendered before the title (e.g. an emoji). */
  leading?: ReactNode;
  /** Optional right-aligned element (e.g. a polling indicator). */
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, leading, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 font-[var(--font-heading)] text-[var(--text-primary)] -tracking-[1.5px]">
          {leading} {title}
        </h1>
        {subtitle && <p className="text-[var(--text-secondary)] text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
