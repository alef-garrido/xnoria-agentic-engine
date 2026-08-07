"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface FilterAction {
  id: string;
  action_id: string;
  stage: string;
  n8n_workflow_id: string;
  requires_hitl: boolean;
  manual_action: boolean;
  enabled: boolean;
  description: string | null;
  description_es?: string | null;
  created_at: string;
  updated_at: string;
}

export type ToggleField = "enabled" | "requires_hitl" | "manual_action";

interface ActionRowProps {
  action: FilterAction;
  /** Localized description (already resolved by locale). */
  description: string;
  /** True while this row is in delete-confirmation mode. */
  deleting: boolean;
  onToggle: (field: ToggleField, value: boolean) => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

const TOGGLE_COLORS: Record<ToggleField, string> = {
  requires_hitl: "var(--warning)",
  manual_action: "var(--info)",
  enabled: "var(--positive)",
};

export function ActionRow({
  action,
  description,
  deleting,
  onToggle,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ActionRowProps) {
  const t = useTranslations("allowlist");

  return (
    <tr className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-hover)]">
      {/* Action ID */}
      <td className="px-4 py-3 font-mono text-[13px] font-semibold text-[var(--text-primary)] whitespace-nowrap">
        {action.action_id}
      </td>

      {/* Stage */}
      <td className="px-4 py-3">
        <Badge className="bg-[var(--info-soft)] text-[var(--info)]">{action.stage}</Badge>
      </td>

      {/* n8n Workflow */}
      <td className="px-4 py-3 font-mono text-[12px] text-[var(--text-secondary)] whitespace-nowrap">
        {action.n8n_workflow_id}
      </td>

      {/* HITL toggle */}
      <td className="px-4 py-3">
        <ToggleSwitch
          checked={action.requires_hitl}
          onChange={(v) => onToggle("requires_hitl", v)}
          activeColor={TOGGLE_COLORS.requires_hitl}
        />
      </td>

      {/* Manual action toggle */}
      <td className="px-4 py-3">
        <ToggleSwitch
          checked={action.manual_action}
          onChange={(v) => onToggle("manual_action", v)}
          activeColor={TOGGLE_COLORS.manual_action}
        />
      </td>

      {/* Enabled toggle */}
      <td className="px-4 py-3">
        <ToggleSwitch
          checked={action.enabled}
          onChange={(v) => onToggle("enabled", v)}
          activeColor={TOGGLE_COLORS.enabled}
        />
      </td>

      {/* Description */}
      <td className="px-4 py-3 text-[12px] text-[var(--text-secondary)] max-w-[280px]">
        <span className="line-clamp-2">{description}</span>
      </td>

      {/* Delete */}
      <td className="px-4 py-3">
        {deleting ? (
          <div className="flex items-center gap-2">
            <Button onClick={onConfirmDelete} variant="danger" className="text-[11px]">
              {t("confirm")}
            </Button>
            <button
              onClick={onCancelDelete}
              className="text-[var(--text-muted)] text-[11px] cursor-pointer bg-transparent border-none"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={onRequestDelete}
            className="p-1 rounded-sm text-[var(--text-muted)] cursor-pointer bg-transparent border-none flex hover:text-[var(--negative)] hover:bg-[var(--negative-soft)]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
