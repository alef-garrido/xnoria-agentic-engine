"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  STAGE_META,
  getStageAverageSeverity,
  type JourneyStage,
} from "@/lib/compass";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StageHealthMetrics {
  stage: string;
  period_days: number;
  total_actions: number;
  executed: number;
  rejected: number;
  pending_hitl: number;
  execution_rate: number;
  hitl_total: number;
  hitl_approved: number;
  hitl_rejected: number;
  hitl_approval_rate: number;
  avg_review_minutes: number | null;
  top_rejection_code: string | null;
}

// ---------------------------------------------------------------------------
// Threshold constants — adjust without code change
// ---------------------------------------------------------------------------
const THRESHOLDS = {
  executionRate:    { healthy: 0.85, warning: 0.60 },
  avgSeverity:     { healthy: 0.5,  warning: 0.7  },
  hitlApproval:    { healthy: 0.80, warning: 0.60 },
} as const;

type StatusLevel = "healthy" | "warning" | "critical";

function getStatus(value: number, threshold: { healthy: number; warning: number }, invert = false): StatusLevel {
  if (invert) {
    // Lower is better (severity)
    if (value < threshold.healthy) return "healthy";
    if (value <= threshold.warning) return "warning";
    return "critical";
  }
  // Higher is better (rates)
  if (value > threshold.healthy) return "healthy";
  if (value >= threshold.warning) return "warning";
  return "critical";
}

const STATUS_COLORS: Record<StatusLevel, string> = {
  healthy:  "var(--positive)",
  warning:  "var(--warning)",
  critical: "var(--negative)",
};

const STATUS_ICONS: Record<StatusLevel, typeof CheckCircle> = {
  healthy:  CheckCircle,
  warning:  AlertTriangle,
  critical: XCircle,
};

// Active stages to display (expand as phases add stages)
const ACTIVE_STAGES: JourneyStage[] = ["ACQ", "SAL", "SUP", "RET"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function JourneyHealthMap() {
  const [metrics, setMetrics] = useState<StageHealthMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`/api/filter/health?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch health metrics");
      const data = await res.json();
      setMetrics(data.metrics ?? []);
      setError(false);
      setLastUpdated(new Date());
    } catch {
      if (metrics.length === 0) setError(true);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Get metrics for a specific stage, or return null/empty
  function getStageMetrics(stage: JourneyStage): StageHealthMetrics | null {
    return metrics.find((m) => m.stage === stage) ?? null;
  }

  // Compute combined status for a stage
  function getCombinedStatus(stage: JourneyStage): StatusLevel {
    const m = getStageMetrics(stage);
    const severity = getStageAverageSeverity(stage);
    const severityStatus = getStatus(severity, THRESHOLDS.avgSeverity, true);

    if (!m || m.total_actions === 0) return severityStatus;

    const execStatus = getStatus(m.execution_rate, THRESHOLDS.executionRate);
    const hitlStatus = m.hitl_total > 0
      ? getStatus(m.hitl_approval_rate, THRESHOLDS.hitlApproval)
      : "healthy";

    const statuses = [severityStatus, execStatus, hitlStatus];
    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("warning")) return "warning";
    return "healthy";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <AlertTriangle
          className="w-10 h-10 mx-auto mb-3"
          style={{ color: "var(--warning)" }}
        />
        <p style={{ color: "var(--text-secondary)" }}>
          Unable to fetch health metrics. Ensure the filter service is running.
        </p>
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
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchHealth()}
            style={{
              padding: "6px",
              borderRadius: "6px",
              cursor: "pointer",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s ease",
            }}
            aria-label="Refresh"
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
          const m = getStageMetrics(stage);
          const severity = getStageAverageSeverity(stage);
          const status = getCombinedStatus(stage);
          const StatusIcon = STATUS_ICONS[status];

          return (
            <div
              key={stage}
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderTop: `3px solid ${meta.color}`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${meta.color}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: `${meta.color}20`,
                      color: meta.color,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stage}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {meta.name}
                  </span>
                </div>
                <StatusIcon
                  className="w-4 h-4"
                  style={{ color: STATUS_COLORS[status] }}
                />
              </div>

              {loading ? (
                <div
                  className="animate-pulse"
                  style={{
                    height: "48px",
                    borderRadius: "8px",
                    backgroundColor: "var(--card-elevated)",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                      }}
                    >
                      Actions
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {m?.total_actions ?? 0}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                      }}
                    >
                      Exec Rate
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: m
                          ? STATUS_COLORS[
                              getStatus(
                                m.execution_rate,
                                THRESHOLDS.executionRate
                              )
                            ]
                          : "var(--text-muted)",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {m ? `${Math.round(m.execution_rate * 100)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                      }}
                    >
                      Severity
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color:
                          STATUS_COLORS[
                            getStatus(severity, THRESHOLDS.avgSeverity, true)
                          ],
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {severity.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* 2. Action Volume Chart (table-based for zero dependencies)          */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="accent-line" />
          <TrendingUp className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Action Volume by Stage
          </h2>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Last {days} days
          </span>
        </div>

        <div className="p-5">
          {loading ? (
            <div
              className="animate-pulse"
              style={{
                height: "120px",
                borderRadius: "8px",
                backgroundColor: "var(--card-elevated)",
              }}
            />
          ) : metrics.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: "var(--text-muted)", fontSize: "14px" }}
            >
              No action data for this period.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ACTIVE_STAGES.map((stage) => {
                const m = getStageMetrics(stage);
                const meta = STAGE_META[stage];
                const total = m?.total_actions ?? 0;
                const maxTotal = Math.max(
                  ...ACTIVE_STAGES.map(
                    (s) => getStageMetrics(s)?.total_actions ?? 0
                  ),
                  1
                );

                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span
                      style={{
                        width: "40px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: meta.color,
                        textAlign: "right",
                      }}
                    >
                      {stage}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "28px",
                        backgroundColor: "var(--card-elevated)",
                        borderRadius: "6px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
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
                          {m?.executed ?? 0} exec / {m?.rejected ?? 0} rej /{" "}
                          {m?.pending_hitl ?? 0} hitl
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        width: "40px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        textAlign: "right",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
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
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="accent-line" />
          <Shield className="w-5 h-5" style={{ color: "var(--info)" }} />
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
            }}
          >
            Decision Quality
          </h2>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            HITL metrics — last {days} days
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  "Stage",
                  "HITL Actions",
                  "Approved",
                  "Rejected",
                  "Approval Rate",
                  "Top Rejection",
                  "Avg Review",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center" }}>
                    <div
                      className="animate-pulse"
                      style={{
                        height: "20px",
                        borderRadius: "4px",
                        backgroundColor: "var(--card-elevated)",
                        width: "60%",
                        margin: "0 auto",
                      }}
                    />
                  </td>
                </tr>
              ) : ACTIVE_STAGES.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No decision data available.
                  </td>
                </tr>
              ) : (
                ACTIVE_STAGES.map((stage) => {
                  const m = getStageMetrics(stage);
                  const meta = STAGE_META[stage];
                  const approvalStatus = m && m.hitl_total > 0
                    ? getStatus(m.hitl_approval_rate, THRESHOLDS.hitlApproval)
                    : "healthy";

                  return (
                    <tr
                      key={stage}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--card-elevated)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: `${meta.color}20`,
                            color: meta.color,
                          }}
                        >
                          {stage}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {m?.hitl_total ?? 0}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--positive)",
                          fontWeight: 600,
                        }}
                      >
                        {m?.hitl_approved ?? 0}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--negative)",
                          fontWeight: 600,
                        }}
                      >
                        {m?.hitl_rejected ?? 0}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: STATUS_COLORS[approvalStatus],
                            fontFamily: "var(--font-heading)",
                          }}
                        >
                          {m && m.hitl_total > 0
                            ? `${Math.round(m.hitl_approval_rate * 100)}%`
                            : "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-secondary)",
                          fontSize: "12px",
                          fontFamily: "monospace",
                        }}
                      >
                        {m?.top_rejection_code ?? "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div className="flex items-center gap-1">
                          <Clock
                            className="w-3.5 h-3.5"
                            style={{ color: "var(--text-muted)" }}
                          />
                          <span style={{ color: "var(--text-secondary)" }}>
                            {m?.avg_review_minutes != null
                              ? `${m.avg_review_minutes} min`
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
