"use client";

import { AllowlistManager } from "@/components/AllowlistManager";
import { ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AllowlistPage() {
  const t = useTranslations("allowlist");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 font-[var(--font-heading)] text-[var(--text-primary)] -tracking-[1.5px]">
          <ListChecks className="w-7 h-7 inline-block mr-2 text-[var(--accent)] align-text-bottom" />
          {t("title")}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">{t("subtitle")}</p>
      </div>

      {/* Manager */}
      <div className="rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
        <AllowlistManager />
      </div>
    </div>
  );
}
