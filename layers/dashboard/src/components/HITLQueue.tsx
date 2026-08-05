"use client";

import { useState } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePolling } from "@/hooks/usePolling";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { PendingActionCard, type PendingAction } from "./hitl/PendingActionCard";

export function HITLQueue() {
  const t = useTranslations("hitl");
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  // Track operator edits per action — key: log_id, value: edited payload
  const [editedPayloads, setEditedPayloads] = useState<Record<string, Record<string, unknown>>>({});

  const {
    data: pending,
    error,
    setData,
    refresh,
  } = usePolling(
    async () => {
      const res = await fetch("/api/filter/hitl");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return (data.pending ?? []) as PendingAction[];
    },
    { intervalMs: 10_000 }
  );

  const clearEditedPayload = (logId: string) => {
    setEditedPayloads((prev) => {
      const next = { ...prev };
      delete next[logId];
      return next;
    });
  };

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
        setData((prev) => prev?.filter((a) => a.log_id !== logId) ?? null);
        clearEditedPayload(logId);
        const action = pending?.find((a) => a.log_id === logId);
        const isManual = action?.manual_action;
        toast(
          isManual
            ? t("markedComplete")
            : edited
              ? t("approvedWithEdits")
              : t("approvedDispatched"),
          "success"
        );
      } else {
        toast(data.error ?? t("failedToApprove"), "error");
      }
    } catch {
      toast(t("approveNetworkError"), "error");
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
        setData((prev) => prev?.filter((a) => a.log_id !== logId) ?? null);
        toast(t("actionRejected"), "success");
      } else {
        toast(data.error ?? t("failedToReject"), "error");
      }
    } catch {
      toast(t("rejectNetworkError"), "error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEditedChange = (logId: string) => (next: string | null) => {
    if (next === null) {
      clearEditedPayload(logId);
      return;
    }
    const action = pending?.find((a) => a.log_id === logId);
    if (!action) return;
    setEditedPayloads((prev) => ({
      ...prev,
      [logId]: { ...action.payload_in, message: next },
    }));
  };

  // Error state
  if (error) {
    return (
      <div className="text-center py-16 text-[var(--negative)]">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">{t("failedToLoad")}</p>
        <p className="text-xs mt-1 text-[var(--text-muted)]">{t("filterNotRunning")}</p>
      </div>
    );
  }

  // Loading state
  if (!pending) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  // Empty state
  if (pending.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox className="w-14 h-14 mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
        <p className="text-sm text-[var(--text-secondary)]">{t("noPending")}</p>
        <p className="text-xs mt-1 text-[var(--text-muted)]">{t("noPendingDetail")}</p>
        <button
          onClick={refresh}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t("refresh")}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Queue count */}
      <div className="flex items-center justify-between px-5 py-3 mb-2 text-[var(--text-secondary)]">
        <span className="text-xs font-medium">
          {t("awaitingReview", { count: pending.length })}
        </span>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          {t("refresh")}
        </button>
      </div>

      {/* Pending action cards */}
      <div className="space-y-3 px-4 pb-4">
        {pending.map((action) => {
          const editedPayload = editedPayloads[action.log_id];
          return (
            <PendingActionCard
              key={action.log_id}
              action={action}
              isExpanded={expandedId === action.log_id}
              isProcessing={actionInProgress === action.log_id}
              edited={Boolean(editedPayload)}
              editedValue={String(editedPayload?.message ?? "")}
              onToggleExpand={() =>
                setExpandedId((current) => (current === action.log_id ? null : action.log_id))
              }
              onEditedChange={handleEditedChange(action.log_id)}
              onApprove={() => handleApprove(action.log_id)}
              onReject={() => handleReject(action.log_id)}
            />
          );
        })}
      </div>
    </>
  );
}
