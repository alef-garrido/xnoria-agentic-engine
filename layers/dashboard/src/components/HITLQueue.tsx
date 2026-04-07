"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from "lucide-react";

interface PendingAction {
  log_id: string;
  action_id: string;
  stage: string;
  session_id: string;
  payload_in: Record<string, unknown>;
  meta: Record<string, unknown>;
  created_at: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export function HITLQueue() {
  const [pending, setPending] = useState<PendingAction[] | null>(null);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

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
      if (!pending) setError(true);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10_000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const handleApprove = async (logId: string) => {
    setActionInProgress(logId);
    try {
      const res = await fetch(`/api/filter/hitl/${logId}/approve`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setPending((prev) => prev?.filter((a) => a.log_id !== logId) ?? null);
        addToast("Action approved and dispatched", "success");
      } else {
        addToast(data.error ?? "Failed to approve", "error");
      }
    } catch {
      addToast("Network error — could not approve", "error");
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
        addToast("Action rejected", "success");
      } else {
        addToast(data.error ?? "Failed to reject", "error");
      }
    } catch {
      addToast("Network error — could not reject", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="text-center py-16" style={{ color: "var(--error)" }}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Failed to load approval queue</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Ensure the filter service is running
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
          No pending actions
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Actions requiring human approval will appear here
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
          Refresh
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
          {pending.length} action{pending.length !== 1 ? "s" : ""} awaiting review
        </span>
        <button
          onClick={fetchPending}
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
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
                        PENDING
                      </span>
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
                        <span style={{ color: "var(--text-muted)" }}>Contact: </span>
                        {String(action.payload_in.contact_id)}
                      </div>
                    )}

                    {/* Agent reasoning */}
                    {Boolean(action.meta?.triggered_by) && (
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>Reasoning: </span>
                        {String(action.meta.triggered_by)}
                      </div>
                    )}

                    {/* Reason from payload */}
                    {Boolean(action.payload_in?.reason) && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>Reason: </span>
                        {String(action.payload_in.reason)}
                      </div>
                    )}

                    {/* Session + time */}
                    <div
                      className="flex items-center gap-3 mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>
                        Session: {action.session_id.substring(0, 8)}…
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(action.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      onClick={() => handleApprove(action.log_id)}
                      disabled={isProcessing}
                      title="Approve"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--positive-soft)",
                        color: "var(--positive)",
                        border: "1px solid var(--positive)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: isProcessing ? "not-allowed" : "pointer",
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(action.log_id)}
                      disabled={isProcessing}
                      title="Reject"
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
                      Reject
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
                    <ChevronUp className="w-3.5 h-3.5" /> Hide payload
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> View full payload
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
                    PAYLOAD
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
                        META
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
