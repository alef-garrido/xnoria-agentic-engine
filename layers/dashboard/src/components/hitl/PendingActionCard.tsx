"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale } from "@/i18n/locale";
import { ActionButtons } from "./ActionButtons";
import { PayloadEditor } from "./PayloadEditor";

export interface PendingAction {
  log_id: string;
  action_id: string;
  stage: string;
  session_id: string;
  payload_in: Record<string, unknown>;
  meta: Record<string, unknown>;
  created_at: string;
  manual_action: boolean;
}

interface PendingActionCardProps {
  action: PendingAction;
  isExpanded: boolean;
  isProcessing: boolean;
  /** True when the operator has edited this action's payload. */
  edited: boolean;
  /** Current edited message value (when `edited`). */
  editedValue: string;
  onToggleExpand: () => void;
  onEditedChange: (next: string | null) => void;
  onApprove: () => void;
  onReject: () => void;
}

export function PendingActionCard({
  action,
  isExpanded,
  isProcessing,
  edited,
  editedValue,
  onToggleExpand,
  onEditedChange,
  onApprove,
  onReject,
}: PendingActionCardProps) {
  const t = useTranslations("hitl");
  const originalMessage = action.payload_in.message ? String(action.payload_in.message) : "";

  return (
    <div
      className="rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]"
      style={{
        borderLeft: "3px solid var(--warning)",
        opacity: isProcessing ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Action ID + Stage badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="badge bg-[var(--warning-soft)] text-[var(--warning)]">
                <Clock className="w-3 h-3 mr-1 inline-block align-text-bottom" />
                {t("pending")}
              </span>
              {action.manual_action && (
                <span className="badge bg-[var(--info-soft)] text-[var(--info)]">
                  {t("manual")}
                </span>
              )}
              <span className="text-sm font-semibold font-mono text-[var(--text-primary)]">
                {action.action_id}
              </span>
              <span className="badge bg-[var(--info-soft)] text-[var(--info)]">{action.stage}</span>
            </div>

            {/* Contact / Key payload info */}
            {Boolean(action.payload_in?.contact_id) && (
              <div className="text-xs mb-1 text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">{t("contact")}</span>
                {String(action.payload_in.contact_id)}
              </div>
            )}

            {/* Agent reasoning */}
            {Boolean(action.meta?.triggered_by) && (
              <div className="text-xs text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">{t("reasoning")}</span>
                {String(action.meta.triggered_by)}
              </div>
            )}

            {/* Reason from payload */}
            {Boolean(action.payload_in?.reason) && (
              <div className="text-xs mt-1 text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">{t("reason")}</span>
                {String(action.payload_in.reason)}
              </div>
            )}

            {/* Manual action instructions */}
            {action.manual_action && (
              <div className="mt-3 p-3 rounded-lg bg-[var(--info-soft)] border border-[var(--info)]">
                <div className="text-xs font-semibold mb-1 text-[var(--info)]">
                  {t("manualAction")}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {t("manualActionDetail")}
                </div>
              </div>
            )}

            {/* Editable message field (hidden for manual actions) */}
            {!action.manual_action && originalMessage && (
              <PayloadEditor
                value={edited ? editedValue : originalMessage}
                original={originalMessage}
                edited={edited}
                onEditedChange={onEditedChange}
              />
            )}

            {/* Session + time */}
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
              <span>{t("session", { sessionId: action.session_id.substring(0, 8) + "…" })}</span>
              <span>
                {formatDistanceToNow(new Date(action.created_at), {
                  addSuffix: true,
                  locale: getLocale() === "es" ? es : undefined,
                })}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <ActionButtons
            isManual={action.manual_action}
            isProcessing={isProcessing}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      </div>

      {/* Expand/collapse payload */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-[var(--text-muted)] border-t border-[var(--border)] bg-[var(--surface-elevated)] cursor-pointer"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" /> {t("hidePayload")}
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" /> {t("viewFullPayload")}
          </>
        )}
      </button>

      {/* Expanded payload view */}
      {isExpanded && (
        <div className="p-3 max-h-[300px] overflow-auto bg-[var(--bg)] border-t border-[var(--border)]">
          <div className="text-xs mb-2 font-semibold text-[var(--text-muted)]">{t("payload")}</div>
          <pre className="font-mono text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap break-all m-0">
            {JSON.stringify(action.payload_in, null, 2)}
          </pre>

          {Object.keys(action.meta).length > 0 && (
            <>
              <div className="text-xs mt-3 mb-2 font-semibold text-[var(--text-muted)]">
                {t("meta")}
              </div>
              <pre className="font-mono text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap break-all m-0">
                {JSON.stringify(action.meta, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
