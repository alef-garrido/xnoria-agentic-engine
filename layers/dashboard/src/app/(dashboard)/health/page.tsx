"use client";

import { useTranslations } from "next-intl";
import { JourneyHealthMap } from "@/components/JourneyHealthMap";
import { Activity } from "lucide-react";

export default function HealthPage() {
  const t = useTranslations("journey");
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 font-[var(--font-heading)] text-[var(--text-primary)] -tracking-[1.5px]">
          <Activity className="w-7 h-7 inline-block mr-2 text-[var(--accent)] align-text-bottom" />
          {t("title")}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">{t("subtitle")}</p>
      </div>

      {/* Health Map */}
      <JourneyHealthMap />
    </div>
  );
}
