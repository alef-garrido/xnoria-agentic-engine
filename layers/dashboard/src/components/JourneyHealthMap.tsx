"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { STAGE_META, getStageAverageSeverity } from "@/lib/compass";
import { ACTIVE_STAGES } from "@/lib/constants";
import {
  HEALTH_THRESHOLDS,
  getCombinedStatus,
  getStageMetrics,
  getStatus,
  type StageHealthMetrics,
  type StatusLevel,
} from "@/lib/healthStatus";
import { usePolling } from "@/hooks/usePolling";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";

const STATUS_COLORS: Record<StatusLevel, string> = {
  healthy: "var(--positive)",
  warning: "var(--warning)",
  critical: "var(--negative)",
};

const STATUS_ICONS: Record<StatusLevel, LucideIcon> = {
  healthy: CheckCircle,
  warning: AlertTriangle,
  critical: XCircle,
};

// ---------------------------------------------------------------------------
// Local presentational components
// ---------------------------------------------------------------------------

function PanelHeader({
  icon,
  title,
  caption,
}: {
  icon: ReactNode;
  title: string;
  caption?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
      <div className="accent-line" />
      {icon}
      <h2 className="text-base font-semibold font-[var(--font-heading)] text-[var(--text-primary)]">
        {title}
      </h2>
      {caption && <span className="text-[var(--text-muted)] text-[12px]">{caption}</span>}
    </div>
  );
}

function StageChip({ stage, color }: { stage: string; color: string }) {
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded tracking-wide"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {stage}
    </span>
  );
}

function StageStat({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div>
      <div className="text-[11px] text-[var(--text-muted)] mb-0.5">{label}</div>
      <div
        className="text-[18px] font-bold font-[var(--font-heading)]"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JourneyHealthMap() {
  const t = useTranslations("journey");
  const [days, setDays] = useState(30);

  const { data, error, refresh } = usePolling(
    async () => {
      const fetched = await apiFetch<{ metrics?: StageHealthMetrics[] }>(
        `/api/filter/health?days=${days}`
      );
      return {
        metrics: fetched.metrics ?? [],
        fetchedAt: new Date(),
      };
    },
    { intervalMs: 30_000 }
  );

  const metrics = data?.metrics ?? [];
  const loading = !data;
  const lastUpdated = data?.fetchedAt ?? null;

  // Error state
  if (error) {
    return (
      <div className="rounded-xl p-8 text-center bg-[var(--card)] border border-[var(--border)]">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[var(--warning)]" />
        <p className="text-[var(--text-secondary)]">{t("fetchFailed")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--border)",
                backgroundColor: days === d ? "var(--accent)" : "var(--card)",
                color: days === d ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "all 0.2s ease",
              }}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[var(--text-muted)] text-[12px]">
              {t("updated", { time: lastUpdated.toLocaleTimeString() })}
            </span>
          )}
          <button
            onClick={refresh}
            className="p-1.5 rounded-md cursor-pointer border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] flex items-center transition-all"
            aria-label={t("refresh")}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 1. Stage Summary Strip                                              */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${ACTIVE_STAGES.length}, 1fr)`,
          gap: "16px",
        }}
      >
        {ACTIVE_STAGES.map((stage) => {
          const meta = STAGE_META[stage];
          const m = getStageMetrics(metrics, stage);
          const severity = getStageAverageSeverity(stage);
          const status = getCombinedStatus(metrics, stage);
          const StatusIcon = STATUS_ICONS[status];

          return (
            <div
              key={stage}
              className="stage-card rounded-xl p-5 bg-[var(--card)] border border-[var(--border)]"
              style={
                {
                  borderTop: `3px solid ${meta.color}`,
                  "--stage-accent": meta.color,
                } as CSSProperties
              }
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StageChip stage={stage} color={meta.color} />
                  <span className="text-[13px] text-[var(--text-secondary)] font-medium">
                    {meta.name}
                  </span>
                </div>
                <StatusIcon className="w-4 h-4" style={{ color: STATUS_COLORS[status] }} />
              </div>

              {loading ? (
                <Skeleton className="h-12 rounded-lg" />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <StageStat label={t("actions")} value={m?.total_actions ?? 0} />
                  <StageStat
                    label={t("execRate")}
                    value={m ? `${Math.round(m.execution_rate * 100)}%` : "—"}
                    color={
                      m
                        ? STATUS_COLORS[
                            getStatus(m.execution_rate, HEALTH_THRESHOLDS.executionRate)
                          ]
                        : undefined
                    }
                  />
                  <StageStat
                    label={t("severity")}
                    value={severity.toFixed(2)}
                    color={STATUS_COLORS[getStatus(severity, HEALTH_THRESHOLDS.avgSeverity, true)]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 2. Action Volume Chart (table-based for zero dependencies)          */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
        <PanelHeader
          icon={<TrendingUp className="w-5 h-5 text-[var(--accent)]" />}
          title={t("actionVolume")}
          caption={t("lastDays", { days })}
        />

        <div className="p-5">
          {loading ? (
            <Skeleton className="h-[120px] rounded-lg" />
          ) : metrics.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-[14px]">
              {t("noActionData")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ACTIVE_STAGES.map((stage) => {
                const m = getStageMetrics(metrics, stage);
                const meta = STAGE_META[stage];
                const total = m?.total_actions ?? 0;
                const maxTotal = Math.max(
                  ...ACTIVE_STAGES.map((s) => getStageMetrics(metrics, s)?.total_actions ?? 0),
                  1
                );

                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span
                      className="w-10 text-[12px] font-bold text-right"
                      style={{ color: meta.color }}
                    >
                      {stage}
                    </span>
                    <div className="flex-1 h-7 rounded-md overflow-hidden relative bg-[var(--card-elevated)]">
                      {/* Executed bar */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${total > 0 ? (total / maxTotal) * 100 : 0}%`,
                          backgroundColor: meta.color,
                          borderRadius: "6px",
                          opacity: 0.8,
                          transition: "width 0.5s ease",
                        }}
                      />
                      {total > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            left: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#fff",
                            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          }}
                        >
                          {m?.executed ?? 0} {t("exec")} / {m?.rejected ?? 0} {t("rej")} /{" "}
                          {m?.pending_hitl ?? 0} {t("hitl")}
                        </div>
                      )}
                    </div>
                    <span className="w-10 text-[13px] font-bold text-right font-[var(--font-heading)] text-[var(--text-primary)]">
                      {total}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 3. Decision Quality Panel                                           */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
        <PanelHeader
          icon={<Shield className="w-5 h-5 text-[var(--info)]" />}
          title={t("decisionQuality")}
          caption={t("hitlMetrics", { days })}
        />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[
                  t("colStage"),
                  t("colHitlActions"),
                  t("colApproved"),
                  t("colRejected"),
                  t("colApprovalRate"),
                  t("colTopRejection"),
                  t("colAvgReview"),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-semibold text-[var(--text-muted)] text-[11px] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    <Skeleton className="h-5 rounded w-3/5 mx-auto" />
                  </td>
                </tr>
              ) : ACTIVE_STAGES.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[var(--text-muted)]">
                    {t("noDecisionData")}
                  </td>
                </tr>
              ) : (
                ACTIVE_STAGES.map((stage) => {
                  const m = getStageMetrics(metrics, stage);
                  const meta = STAGE_META[stage];
                  const approvalStatus =
                    m && m.hitl_total > 0
                      ? getStatus(m.hitl_approval_rate, HEALTH_THRESHOLDS.hitlApproval)
                      : "healthy";

                  return (
                    <tr
                      key={stage}
                      className="border-b border-[var(--border)] transition-colors hover:bg-[var(--card-elevated)]"
                    >
                      <td className="px-4 py-3">
                        <StageChip stage={stage} color={meta.color} />
                      </td>
                      <td className="px-4 py-3 font-semibold font-[var(--font-heading)] text-[var(--text-primary)]">
                        {m?.hitl_total ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[var(--positive)] font-semibold">
                        {m?.hitl_approved ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[var(--negative)] font-semibold">
                        {m?.hitl_rejected ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-bold font-[var(--font-heading)]"
                          style={{ color: STATUS_COLORS[approvalStatus] }}
                        >
                          {m && m.hitl_total > 0
                            ? `${Math.round(m.hitl_approval_rate * 100)}%`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-[12px] font-mono">
                        {m?.top_rejection_code ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="text-[var(--text-secondary)]">
                            {m?.avg_review_minutes != null
                              ? `${m.avg_review_minutes} ${t("min")}`
                              : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
