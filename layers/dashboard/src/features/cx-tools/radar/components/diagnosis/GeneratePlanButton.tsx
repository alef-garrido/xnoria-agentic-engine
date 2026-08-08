"use client";

import { Sparkles, Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface GeneratePlanButtonProps {
  busy: boolean;
  onGenerate: () => void;
}

export default function GeneratePlanButton({ busy, onGenerate }: GeneratePlanButtonProps) {
  const t = useTranslations("diagnosis");

  return (
    <div>
      <Button disabled={busy} onClick={onGenerate} className="w-full">
        {busy ? (
          <Hourglass className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {busy ? t("planGenerating") : t("planGenerate")}
      </Button>
    </div>
  );
}
