"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("cxtools");
  const tool = pathname.split("/")[2];
  const toolLabel = tool ? t(`tool${tool.charAt(0).toUpperCase()}${tool.slice(1)}` as never) : "";

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex items-center gap-2 pb-4 text-sm"
        style={{
          borderBottom: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>{t("toolsSection")}</span>
        {toolLabel && (
          <>
            <span style={{ color: "var(--text-muted)" }}>›</span>
            <span style={{ color: "var(--text-primary)" }}>{toolLabel}</span>
          </>
        )}
      </div>
      {children}
    </div>
  );
}
