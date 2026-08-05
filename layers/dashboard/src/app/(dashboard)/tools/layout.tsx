"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("cxtools");
  const tool = pathname.split("/")[2];
  const toolLabel = tool ? t(`tool${tool.charAt(0).toUpperCase()}${tool.slice(1)}` as never) : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 pb-4 text-sm border-b border-[var(--border)] text-[var(--text-secondary)]">
        <span className="text-[var(--text-muted)]">{t("toolsSection")}</span>
        {toolLabel && (
          <>
            <span className="text-[var(--text-muted)]">›</span>
            <span className="text-[var(--text-primary)]">{toolLabel}</span>
          </>
        )}
      </div>
      {children}
    </div>
  );
}
