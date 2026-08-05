"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { STAGES } from "@/lib/constants";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Button } from "@/components/ui/Button";
import { Input, inputClass } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface NewActionInput {
  action_id: string;
  stage: string;
  n8n_workflow_id: string;
  requires_hitl: boolean;
  manual_action: boolean;
  description: string;
}

interface AddActionModalProps {
  onClose: () => void;
  onCreate: (data: NewActionInput) => Promise<void>;
}

export function AddActionModal({ onClose, onCreate }: AddActionModalProps) {
  const t = useTranslations("allowlist");
  const [actionId, setActionId] = useState("");
  const [stage, setStage] = useState<string>("ACQ");
  const [workflowId, setWorkflowId] = useState("");
  const [requiresHitl, setRequiresHitl] = useState(false);
  const [isManualAction, setIsManualAction] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionId || !workflowId) return;

    setSubmitting(true);
    await onCreate({
      action_id: actionId,
      stage,
      n8n_workflow_id: workflowId,
      requires_hitl: requiresHitl,
      manual_action: isManualAction,
      description,
    });
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rounded-xl w-full max-w-[480px] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-md)] m-4">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-base font-semibold font-[var(--font-heading)] text-[var(--text-primary)]">
            {t("addNewAction")}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] cursor-pointer bg-transparent border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Action ID */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
              {t("actionId")}
            </label>
            <Input
              type="text"
              className="w-full"
              placeholder={t("actionIdPlaceholder")}
              value={actionId}
              onChange={(e) => setActionId(e.target.value)}
              required
            />
            <p className="text-xs mt-1 text-[var(--text-muted)]">{t("actionIdHint")}</p>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
              {t("stage")}
            </label>
            <select
              className={cn(inputClass, "w-full cursor-pointer")}
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* n8n Workflow ID */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
              {t("workflowId")}
            </label>
            <Input
              type="text"
              className="w-full"
              placeholder={t("workflowPlaceholder")}
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              required
            />
            <p className="text-xs mt-1 text-[var(--text-muted)]">{t("workflowHint")}</p>
          </div>

          {/* Requires HITL toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                {t("requiresHitl")}
              </label>
              <p className="text-xs text-[var(--text-muted)]">{t("requiresHitlHint")}</p>
            </div>
            <ToggleSwitch
              checked={requiresHitl}
              onChange={setRequiresHitl}
              activeColor="var(--warning)"
            />
          </div>

          {/* Manual action toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                {t("manualAction")}
              </label>
              <p className="text-xs text-[var(--text-muted)]">{t("manualActionHint")}</p>
            </div>
            <ToggleSwitch
              checked={isManualAction}
              onChange={setIsManualAction}
              activeColor="var(--info)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
              {t("description")}
            </label>
            <textarea
              className={cn(inputClass, "w-full resize-y")}
              rows={2}
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="text-[13px]">
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting || !actionId || !workflowId}
              className="text-[13px] disabled:opacity-50"
            >
              {submitting ? t("creating") : t("createAction")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
