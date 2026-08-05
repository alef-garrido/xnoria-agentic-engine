"use client";

import { useState } from "react";
import { Plus, RefreshCw, AlertTriangle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePolling } from "@/hooks/usePolling";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { STAGES } from "@/lib/constants";
import { getLocale } from "@/i18n/locale";
import { ApiError, apiFetch } from "@/lib/client-api";
import { ActionRow, type FilterAction, type ToggleField } from "./allowlist/ActionRow";
import { AddActionModal, type NewActionInput } from "./allowlist/AddActionModal";

export function AllowlistManager() {
  const t = useTranslations("allowlist");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    data: actions,
    error,
    setData,
    refresh,
  } = usePolling(
    async () => {
      const data = await apiFetch<{ actions?: FilterAction[] }>("/api/filter/allowlist");
      return data.actions ?? [];
    },
    { intervalMs: 0 }
  );

  const revertToggle = (id: string, field: ToggleField, value: boolean) => {
    setData((prev) => prev?.map((a) => (a.id === id ? { ...a, [field]: !value } : a)) ?? null);
  };

  const isNetworkError = (err: unknown) => err instanceof ApiError && err.status === 0;

  const handleToggle = async (id: string, field: ToggleField, value: boolean) => {
    // Optimistic update
    setData((prev) => prev?.map((a) => (a.id === id ? { ...a, [field]: value } : a)) ?? null);

    try {
      await apiFetch(`/api/filter/allowlist/${id}`, {
        method: "PATCH",
        body: { [field]: value },
      });
    } catch (err) {
      revertToggle(id, field, value);
      toast(isNetworkError(err) ? t("networkError") : t("failedToUpdate"), "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/filter/allowlist/${id}`, {
        method: "DELETE",
      });
      setData((prev) => prev?.filter((a) => a.id !== id) ?? null);
      toast(t("actionDeleted"), "success");
    } catch (err) {
      toast(isNetworkError(err) ? t("networkError") : t("failedToDelete"), "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleCreate = async (data: NewActionInput) => {
    try {
      const result = await apiFetch<{ action: FilterAction }>("/api/filter/allowlist", {
        method: "POST",
        body: data,
      });
      setData((prev) => [...(prev ?? []), result.action]);
      toast(t("actionCreated"), "success");
      setShowAddModal(false);
    } catch (err) {
      const body =
        err instanceof ApiError ? (err.data as { error?: string } | undefined) : undefined;
      toast(
        body?.error ?? (isNetworkError(err) ? t("networkError") : t("failedToCreate")),
        "error"
      );
    }
  };

  // Filter logic
  const locale = getLocale();
  const localizedDescription = (a: FilterAction) =>
    locale === "es" && a.description_es ? a.description_es : (a.description ?? "—");

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
      <div className="text-center py-16 text-[var(--negative)]">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">{t("failedToLoad")}</p>
        <p className="text-xs mt-1 text-[var(--text-muted)]">{t("filterNotRunning")}</p>
      </div>
    );
  }

  // Loading state
  if (!actions) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap border-b border-[var(--border)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full text-[13px] pl-9 pr-3 py-2"
          />
        </div>

        {/* Stage filter */}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="input text-[13px] px-3 py-2 min-w-[100px] cursor-pointer"
        >
          <option value="">{t("allStages")}</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Refresh */}
        <button onClick={refresh} className="btn-outline px-3 py-2 text-[12px]">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Add */}
        <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-2 text-[12px]">
          <Plus className="w-4 h-4" />
          {t("addAction")}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              {[
                t("colActionId"),
                t("colStage"),
                t("colWorkflow"),
                t("colHitl"),
                t("colManual"),
                t("colEnabled"),
                t("colDescription"),
                "",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[var(--text-muted)] text-[13px]">
                  {t("noMatch")}
                </td>
              </tr>
            ) : (
              filtered?.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  description={localizedDescription(action)}
                  deleting={deleteConfirmId === action.id}
                  onToggle={(field, value) => handleToggle(action.id, field, value)}
                  onRequestDelete={() => setDeleteConfirmId(action.id)}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                  onConfirmDelete={() => handleDelete(action.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Action Modal */}
      {showAddModal && (
        <AddActionModal onClose={() => setShowAddModal(false)} onCreate={handleCreate} />
      )}
    </>
  );
}
