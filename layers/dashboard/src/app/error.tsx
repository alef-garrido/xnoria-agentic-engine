"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function RootError({ reset }: { reset: () => void }) {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <AlertTriangle className="w-10 h-10 text-[var(--warning)]" />
        <h1 className="text-xl font-bold font-[var(--font-heading)] text-[var(--text-primary)]">
          {t("errorTitle")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("errorBody")}</p>
        <Button onClick={reset}>{t("retry")}</Button>
      </div>
    </div>
  );
}
