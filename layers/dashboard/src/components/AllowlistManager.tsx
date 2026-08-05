"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale } from "@/i18n/locale";

interface FilterAction {
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

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

const STAGES = ["ACQ", "SAL", "ONB", "PRD", "SUP", "COM", "RET", "EXP"];

export function AllowlistManager() {
  const t = useTranslations("allowlist");
  const [actions, setActions] = useState<FilterAction[] | null>(null);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  });

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/filter/allowlist");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setActions(data.actions ?? []);
      setError(false);
    } catch {
      if (!actionsRef.current) setError(true);
    }
  }, []);

  useEffect(() => {
    setTimeout(fetchActions, 0);
  }, [fetchActions]);

  const handleToggle = async (
    id: string,
    field: "enabled" | "requires_hitl" | "manual_action",
    value: boolean
  ) => {
    // Optimistic update
    setActions(
      (prev) =>
        prev?.map((a) => (a.id === id ? { ...a, [field]: value } : a)) ?? null
    );

    try {
      const res = await fetch(`/api/filter/allowlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        // Revert
        setActions(
          (prev) =>
            prev?.map((a) =>
              a.id === id ? { ...a, [field]: !value } : a
            ) ?? null
        );
        addToast(t("failedToUpdate"), "error");
      }
    } catch {
      // Revert
      setActions(
        (prev) =>
          prev?.map((a) =>
            a.id === id ? { ...a, [field]: !value } : a
          ) ?? null
      );
      addToast(t("networkError"), "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/filter/allowlist/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setActions((prev) => prev?.filter((a) => a.id !== id) ?? null);
        addToast(t("actionDeleted"), "success");
      } else {
        addToast(t("failedToDelete"), "error");
      }
    } catch {
      addToast(t("networkError"), "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleCreate = async (data: {
    action_id: string;
    stage: string;
    n8n_workflow_id: string;
    requires_hitl: boolean;
    manual_action: boolean;
    description: string;
  }) => {
    try {
      const res = await fetch("/api/filter/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setActions((prev) => [...(prev ?? []), result.action]);
        addToast(t("actionCreated"), "success");
        setShowAddModal(false);
      } else {
        const err = await res.json();
        addToast(err.error ?? t("failedToCreate"), "error");
      }
    } catch {
      addToast(t("networkError"), "error");
    }
  };

  // Filter logic
  const locale = getLocale();
  const searchText = (a: FilterAction) =>
    locale === "es" && a.description_es
      ? `${a.description} ${a.description_es}`
      : (a.description ?? "");
  const filtered = actions?.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.action_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchText(a).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !stageFilter || a.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

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
  if (!actions) {
    return (
      <div className="animate-pulse space-y-2 p-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg"
            style={{ backgroundColor: "var(--card-elevated)" }}
          />
        ))}
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
              boxShadow: "var(--shadow-md)",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-5 py-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full"
            style={{ paddingLeft: "36px", fontSize: "13px", padding: "8px 12px 8px 36px" }}
          />
        </div>

        {/* Stage filter */}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="input"
          style={{
            fontSize: "13px",
            padding: "8px 12px",
            minWidth: "100px",
            cursor: "pointer",
          }}
        >
          <option value="">{t("allStages")}</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={fetchActions}
          className="btn-outline"
          style={{ padding: "8px 12px", fontSize: "12px" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Add */}
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: "12px" }}
        >
          <Plus className="w-4 h-4" />
          {t("addAction")}
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                textAlign: "left",
              }}
            >
              {[
                t("colActionId"),
                t("colStage"),
                t("colWorkflow"),
                t("colHitl"),
                t("colManual"),
                t("colEnabled"),
                t("colDescription"),
                "",
              ].map(
                (header) => (
                  <th
                    key={header}
                    style={{
                      padding: "10px 16px",
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered?.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12"
                  style={{ color: "var(--text-muted)", fontSize: "13px" }}
                >
                  {t("noMatch")}
                </td>
              </tr>            ) : (
              filtered?.map((action) => (
                <tr
                  key={action.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Action ID */}
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {action.action_id}
                  </td>

                  {/* Stage */}
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: "var(--info-soft)",
                        color: "var(--info)",
                      }}
                    >
                      {action.stage}
                    </span>
                  </td>

                  {/* n8n Workflow */}
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {action.n8n_workflow_id}
                  </td>

                  {/* HITL toggle */}
                  <td style={{ padding: "12px 16px" }}>
                    <ToggleSwitch
                      checked={action.requires_hitl}
                      onChange={(v) =>
                        handleToggle(action.id, "requires_hitl", v)
                      }
                      activeColor="var(--warning)"
                    />
                  </td>

                  {/* Manual action toggle */}
                  <td style={{ padding: "12px 16px" }}>
                    <ToggleSwitch
                      checked={action.manual_action}
                      onChange={(v) =>
                        handleToggle(action.id, "manual_action", v)
                      }
                      activeColor="var(--info)"
                    />
                  </td>

                  {/* Enabled toggle */}
                  <td style={{ padding: "12px 16px" }}>
                    <ToggleSwitch
                      checked={action.enabled}
                      onChange={(v) => handleToggle(action.id, "enabled", v)}
                      activeColor="var(--positive)"
                    />
                  </td>

                  {/* Description */}
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      maxWidth: "280px",
                    }}
                  >
                    <span className="line-clamp-2">
                      {locale === "es"
                        ? (action.description_es ?? action.description ?? "—")
                        : (action.description ?? "—")}
                    </span>
                  </td>

                  {/* Delete */}
                  <td style={{ padding: "12px 16px" }}>
                    {deleteConfirmId === action.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(action.id)}
                          className="btn-danger"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          {t("confirm")}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "11px",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                          }}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(action.id)}
                        style={{
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                          padding: "4px",
                          borderRadius: "var(--radius-sm)",
                          display: "flex",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--negative)";
                          e.currentTarget.style.backgroundColor =
                            "var(--negative-soft)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Action Modal */}
      {showAddModal && (
        <AddActionModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}

// =============================================================================
// Toggle Switch Component
// =============================================================================
function ToggleSwitch({
  checked,
  onChange,
  activeColor = "var(--positive)",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        backgroundColor: checked ? activeColor : "var(--surface-elevated)",
        border: `1px solid ${checked ? activeColor : "var(--border-strong)"}`,
        position: "relative",
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "18px" : "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor: checked ? "white" : "var(--text-muted)",
          transition: "all 0.2s ease",
        }}
      />
    </button>
  );
}

// =============================================================================
// Add Action Modal
// =============================================================================
function AddActionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    action_id: string;
    stage: string;
    n8n_workflow_id: string;
    requires_hitl: boolean;
    manual_action: boolean;
    description: string;
  }) => Promise<void>;
}) {
  const t = useTranslations("allowlist");
  const [actionId, setActionId] = useState("");
  const [stage, setStage] = useState("ACQ");
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-xl"
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          margin: "16px",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3
            className="text-base font-semibold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            {t("addNewAction")}
          </h3>
          <button
            onClick={onClose}
            style={{
              color: "var(--text-muted)",
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Action ID */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("actionId")}
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder={t("actionIdPlaceholder")}
              value={actionId}
              onChange={(e) => setActionId(e.target.value)}
              required
              style={{ fontSize: "13px" }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {t("actionIdHint")}
            </p>
          </div>

          {/* Stage */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("stage")}
            </label>
            <select
              className="input w-full"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              style={{ fontSize: "13px", cursor: "pointer" }}
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
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("workflowId")}
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder={t("workflowPlaceholder")}
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              required
              style={{ fontSize: "13px" }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {t("workflowHint")}
            </p>
          </div>

          {/* Requires HITL toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("requiresHitl")}
              </label>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("requiresHitlHint")}
              </p>
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
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("manualAction")}
              </label>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("manualActionHint")}
              </p>
            </div>
            <ToggleSwitch
              checked={isManualAction}
              onChange={setIsManualAction}
              activeColor="var(--info)"
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("description")}
            </label>
            <textarea
              className="input w-full"
              rows={2}
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: "13px", resize: "vertical" }}
            />
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-3 pt-2"
            style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || !actionId || !workflowId}
              className="btn-primary"
              style={{
                padding: "8px 20px",
                fontSize: "13px",
                opacity: submitting || !actionId || !workflowId ? 0.5 : 1,
              }}
            >
              {submitting ? t("creating") : t("createAction")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
