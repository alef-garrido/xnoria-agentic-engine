"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Inbox,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale } from "@/i18n/locale";

interface PendingAction {
  log_id: string;
  action_id: string;
  stage: string;
  session_id: string;
  payload_in: Record<string, unknown>;
  meta: Record<string, unknown>;
  created_at: string;
  manual_action: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export function HITLQueue() {
  const t = useTranslations("hitl");
  const [pending, setPending] = useState<PendingAction[] | null>(null);
  const [error, setError] = useState(false);
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Track operator edits per action — key: log_id, value: edited payload
  const [editedPayloads, setEditedPayloads] = useState<Record<string, Record<string, unknown>>>({});

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/filter/hitl");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPending(data.pending ?? []);
      setError(false);
    } catch {
      if (!pendingRef.current) setError(true);
    }
  }, []);

  useEffect(() => {
    setTimeout(fetchPending, 0);
    const interval = setInterval(fetchPending, 10_000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const handleApprove = async (logId: string) => {
    setActionInProgress(logId);
    try {
      // Build request body — include payload override if operator edited it
      const edited = editedPayloads[logId];
      const body: Record<string, unknown> = {};
      if (edited) {
        body.payload = edited;
      }

      const res = await fetch(`/api/filter/hitl/${logId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setPending((prev) => prev?.filter((a) => a.log_id !== logId) ?? null);
        // Clean up edited state
        setEditedPayloads((prev) => {
          const next = { ...prev };
          delete next[logId];
          return next;
        });
        const action = pending?.find((a) => a.log_id === logId);
        const isManual = action?.manual_action;
        addToast(
          isManual
            ? t("markedComplete")
            : edited
              ? t("approvedWithEdits")
              : t("approvedDispatched"),
          "success"
        );
      } else {
        addToast(data.error ?? t("failedToApprove"), "error");
      }
    } catch {
      addToast(t("approveNetworkError"), "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (logId: string) => {
    setActionInProgress(logId);
    try {
      const res = await fetch(`/api/filter/hitl/${logId}/reject`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setPending((prev) => prev?.filter((a) => a.log_id !== logId) ?? null);
        addToast(t("actionRejected"), "success");
      } else {
        addToast(data.error ?? t("failedToReject"), "error");
      }
    } catch {
      addToast(t("rejectNetworkError"), "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="text-center py-16" style={{ color: "var(--error)" }}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">{t("failedToLoad")}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {t("filterNotRunning")}
        </p>
      </div>
    );
  }

  // Loading state
  if (!pending) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl"
            style={{ backgroundColor: "var(--card-elevated)" }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (pending.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox
          className="w-14 h-14 mx-auto mb-4"
          style={{ color: "var(--text-muted)", opacity: 0.4 }}
        />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("noPending")}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {t("noPendingDetail")}
        </p>
        <button
          onClick={fetchPending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t("refresh")}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Toast notifications */}
      <div
        style={{
          position: "fixed",
          top: "64px",
          right: "24px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor:
                toast.type === "success"
                  ? "var(--positive-soft)"
                  : "var(--negative-soft)",
              color:
                toast.type === "success" ? "var(--positive)" : "var(--negative)",
              fontSize: "13px",
              fontWeight: 500,
              border: `1px solid ${
                toast.type === "success" ? "var(--positive)" : "var(--negative)"
              }`,
              animation: "fadeIn 0.2s ease",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Queue count */}
      <div
        className="flex items-center justify-between px-5 py-3 mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        <span className="text-xs font-medium">
          {t("awaitingReview", { count: pending.length })}
        </span>
        <button
          onClick={fetchPending}
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <RefreshCw className="w-3 h-3" />
          {t("refresh")}
        </button>
      </div>

      {/* Pending action cards */}
      <div className="space-y-3 px-4 pb-4">
        {pending.map((action) => {
          const isExpanded = expandedId === action.log_id;
          const isProcessing = actionInProgress === action.log_id;

          return (
            <div
              key={action.log_id}
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--warning)",
                opacity: isProcessing ? 0.6 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              {/* Card header */}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Action ID + Stage badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "var(--warning-soft)",
                          color: "var(--warning)",
                        }}
                      >
                        <Clock
                          className="w-3 h-3"
                          style={{ marginRight: "4px" }}
                        />
                        {t("pending")}
                      </span>
                      {action.manual_action && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "var(--info-soft)",
                            color: "var(--info)",
                          }}
                        >
                          {t("manual")}
                        </span>
                      )}
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {action.action_id}
                      </span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "var(--info-soft)",
                          color: "var(--info)",
                        }}
                      >
                        {action.stage}
                      </span>
                    </div>

                    {/* Contact / Key payload info */}
                    {Boolean(action.payload_in?.contact_id) && (
                      <div
                        className="text-xs mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>{t("contact")}</span>
                        {String(action.payload_in.contact_id)}
                      </div>
                    )}

                    {/* Agent reasoning */}
                    {Boolean(action.meta?.triggered_by) && (
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>{t("reasoning")}</span>
                        {String(action.meta.triggered_by)}
                      </div>
                    )}

                    {/* Reason from payload */}
                    {Boolean(action.payload_in?.reason) && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>{t("reason")}</span>
                        {String(action.payload_in.reason)}
                      </div>
                    )}

                    {/* Manual action instructions */}
                    {action.manual_action && (
                      <div
                        className="mt-3 p-3 rounded-lg"
                        style={{
                          backgroundColor: "var(--info-soft)",
                          border: "1px solid var(--info)",
                        }}
                      >
                        <div
                          className="text-xs font-semibold mb-1"
                          style={{ color: "var(--info)" }}
                        >
                          {t("manualAction")}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {t("manualActionDetail")}
                        </div>
                      </div>
                    )}

                    {/* Editable message field (hidden for manual actions) */}
                    {!action.manual_action && Boolean(action.payload_in?.message) && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <Pencil className="w-3 h-3 inline-block mr-1" style={{ verticalAlign: "text-bottom" }} />
                            {t("outreachMessage")}
                          </span>
                          {editedPayloads[action.log_id] && (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: "var(--info-soft)",
                                color: "var(--info)",
                                fontSize: "10px",
                              }}
                            >
                              {t("edited")}
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={4}
                          defaultValue={String(action.payload_in.message)}
                          onChange={(e) => {
                            const newMessage = e.target.value;
                            const original = String(action.payload_in.message);
                            if (newMessage === original) {
                              // Reverted to original — remove override
                              setEditedPayloads((prev) => {
                                const next = { ...prev };
                                delete next[action.log_id];
                                return next;
                              });
                            } else {
                              setEditedPayloads((prev) => ({
                                ...prev,
                                [action.log_id]: {
                                  ...action.payload_in,
                                  message: newMessage,
                                },
                              }));
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "var(--radius-md)",
                            border: editedPayloads[action.log_id]
                              ? "1.5px solid var(--info)"
                              : "1px solid var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-body)",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            resize: "vertical",
                            outline: "none",
                            transition: "border-color 0.2s ease",
                          }}
                        />
                        {editedPayloads[action.log_id] && (
                          <button
                            onClick={() => {
                              setEditedPayloads((prev) => {
                                const next = { ...prev };
                                delete next[action.log_id];
                                return next;
                              });
                              // Reset the textarea to original value
                              const textarea = document.querySelector(
                                `textarea[data-log-id="${action.log_id}"]`
                              ) as HTMLTextAreaElement | null;
                              if (textarea) {
                                textarea.value = String(action.payload_in.message);
                              }
                            }}
                            className="flex items-center gap-1 mt-1 text-xs"
                            style={{ color: "var(--text-muted)", cursor: "pointer" }}
                          >
                            <RotateCcw className="w-3 h-3" />
                            {t("resetToOriginal")}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Session + time */}
                    <div
                      className="flex items-center gap-3 mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>
                        {t("session", { sessionId: action.session_id.substring(0, 8) + "…" })}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(action.created_at), {
                          addSuffix: true,
                          locale: getLocale() === "es" ? es : undefined,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      onClick={() => handleApprove(action.log_id)}
                      disabled={isProcessing}
                      title={action.manual_action ? t("markComplete") : t("approve")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: action.manual_action ? "var(--info-soft)" : "var(--positive-soft)",
                        color: action.manual_action ? "var(--info)" : "var(--positive)",
                        border: `1px solid ${action.manual_action ? "var(--info)" : "var(--positive)"}`,
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                      }}
                    >
                      <Check className="w-4 h-4" />
                      {action.manual_action ? t("markComplete") : t("approve")}
                    </button>
                    <button
                      onClick={() => handleReject(action.log_id)}
                      disabled={isProcessing}
                      title={t("reject")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--negative-soft)",
                        color: "var(--negative)",
                        border: "1px solid var(--negative)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                      }}
                    >
                      <X className="w-4 h-4" />
                      {t("reject")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expand/collapse payload */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : action.log_id)
                }
                className="w-full flex items-center justify-center gap-1 py-2 text-xs"
                style={{
                  color: "var(--text-muted)",
                  borderTop: "1px solid var(--border)",
                  backgroundColor: "var(--surface-elevated)",
                  cursor: "pointer",
                }}
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
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "var(--bg)",
                    borderTop: "1px solid var(--border)",
                    maxHeight: "300px",
                    overflow: "auto",
                  }}
                >
                  <div
                    className="text-xs mb-2 font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t("payload")}
                  </div>
                  <pre
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(action.payload_in, null, 2)}
                  </pre>

                  {Object.keys(action.meta).length > 0 && (
                    <>
                      <div
                        className="text-xs mt-3 mb-2 font-semibold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t("meta")}
                      </div>
                      <pre
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                          margin: 0,
                        }}
                      >
                        {JSON.stringify(action.meta, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
