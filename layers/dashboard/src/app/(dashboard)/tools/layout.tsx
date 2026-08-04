"use client";

import { usePathname } from "next/navigation";

const TOOL_LABELS: Record<string, string> = {
  compass: "Compass",
  radar: "Radar",
  matriz: "Matriz",
  editor: "Editor",
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const tool = pathname.split("/")[2];

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex items-center gap-2 pb-4 text-sm"
        style={{
          borderBottom: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>CX Tools</span>
        {tool && TOOL_LABELS[tool] && (
          <>
            <span style={{ color: "var(--text-muted)" }}>›</span>
            <span style={{ color: "var(--text-primary)" }}>{TOOL_LABELS[tool]}</span>
          </>
        )}
      </div>
      {children}
    </div>
  );
}
