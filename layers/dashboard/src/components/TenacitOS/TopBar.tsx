"use client";

import { BRANDING } from "@/config/branding";
import { useTranslations } from "next-intl";

export function TopBar() {
  const t = useTranslations("topbar");
  return (
    <>
      <div
        className="fixed top-0 right-0 z-[45] flex items-center justify-between h-[var(--layout-topbar-h)] px-5 bg-[var(--surface)] border-b border-[var(--border)]"
        style={{ left: "var(--layout-sidebar-w)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[20px]">🧠</span>
          <h1 className="font-[var(--font-heading)] text-[16px] font-bold text-[var(--text-primary)] -tracking-[0.5px]">
            {BRANDING.agentName}
          </h1>
          {BRANDING.subtitle && (
            <span className="font-[var(--font-body)] text-[10px] font-medium text-[var(--text-muted)] px-1.5 py-0.5 bg-[var(--surface-elevated)] rounded border border-[var(--border)]">
              {BRANDING.subtitle}
            </span>
          )}
          {/* Version Badge */}
          <div className="bg-[var(--accent-soft)] rounded px-2 py-0.5">
            <span className="font-[var(--font-body)] text-[9px] font-bold text-[var(--accent)] tracking-wide">
              v1.0
            </span>
          </div>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-3">
          {/* User Area */}
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--accent)]">
              <span className="font-[var(--font-heading)] text-[12px] font-bold text-[var(--text-primary)]">
                X
              </span>
            </div>
            <span className="font-[var(--font-body)] text-[12px] font-medium text-[var(--text-secondary)]">
              {t("admin")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
