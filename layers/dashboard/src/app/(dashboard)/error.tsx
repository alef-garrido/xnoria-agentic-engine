"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function DashboardError({ reset }: { reset: () => void }) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertTriangle className="w-10 h-10 text-[var(--warning)]" />
      <h1 className="text-xl font-bold font-[var(--font-heading)] text-[var(--text-primary)]">
        {t("errorTitle")}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-md">{t("errorBody")}</p>
      <div className="flex items-center gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Link href="/">
          <Button variant="outline">{t("backToDashboard")}</Button>
        </Link>
      </div>
    </div>
  );
}
