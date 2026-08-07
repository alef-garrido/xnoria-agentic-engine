"use client";

import { Pencil, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useTranslations } from "next-intl";

interface PayloadEditorProps {
  /** Current textarea value (derived from the parent's edited payload state). */
  value: string;
  /** The original message — typing back to this clears the override. */
  original: string;
  /** Whether the payload has been edited relative to the original. */
  edited: boolean;
  /** `null` clears the override (restores original); a string sets it. */
  onEditedChange: (next: string | null) => void;
}

export function PayloadEditor({ value, original, edited, onEditedChange }: PayloadEditorProps) {
  const t = useTranslations("hitl");

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-[var(--text-muted)]">
          <Pencil className="w-3 h-3 inline-block mr-1 align-text-bottom" />
          {t("outreachMessage")}
        </span>
        {edited && (
          <Badge className="bg-[var(--info-soft)] text-[var(--info)]">{t("edited")}</Badge>
        )}
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onEditedChange(next === original ? null : next);
        }}
        className="w-full px-3 py-2.5 rounded-md bg-[var(--bg)] text-[var(--text-primary)] text-[13px] leading-relaxed resize-y outline-none transition-colors"
        style={{
          border: edited ? "1.5px solid var(--info)" : "1px solid var(--border)",
        }}
      />
      {edited && (
        <button
          onClick={() => onEditedChange(null)}
          className="flex items-center gap-1 mt-1 text-xs text-[var(--text-muted)] cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          {t("resetToOriginal")}
        </button>
      )}
    </div>
  );
}
