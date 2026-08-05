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
        <h1
          className="text-2xl md:text-3xl font-bold tracking-tight mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
            letterSpacing: "-1.5px",
          }}
        >
          {leading} {title}
        </h1>
        {subtitle && <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
