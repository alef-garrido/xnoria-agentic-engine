"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface ActionButtonsProps {
  isManual: boolean;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function ActionButtons({ isManual, isProcessing, onApprove, onReject }: ActionButtonsProps) {
  const t = useTranslations("hitl");

  return (
    <div className="flex items-center gap-2 shrink-0 pt-1">
      <button
        onClick={onApprove}
        disabled={isProcessing}
        title={isManual ? t("markComplete") : t("approve")}
        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold cursor-pointer disabled:cursor-not-allowed border ${
          isManual
            ? "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info)]"
            : "bg-[var(--positive-soft)] text-[var(--positive)] border-[var(--positive)]"
        }`}
      >
        <Check className="w-4 h-4" />
        {isManual ? t("markComplete") : t("approve")}
      </button>
      <button
        onClick={onReject}
        disabled={isProcessing}
        title={t("reject")}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold cursor-pointer disabled:cursor-not-allowed bg-[var(--negative-soft)] text-[var(--negative)] border border-[var(--negative)]"
      >
        <X className="w-4 h-4" />
        {t("reject")}
      </button>
    </div>
  );
}
