"use client";

import { useCallback, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Stethoscope,
  Mail,
  AlertTriangle,
  XCircle,
  Hourglass,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale } from "@/i18n/locale";
import { apiFetch } from "@/lib/client-api";
import { clientLogger } from "@/lib/client-logger";
import { usePolling } from "@/hooks/usePolling";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WHEEL_STRUCTURE } from "@/features/cx-tools/shared/data/wheelStructure";
import { translate } from "@/features/cx-tools/shared/i18n/translations";
import { getCachedSignals } from "@/features/cx-tools/shared/domain/signalBuilder";
import type { DiagnosisListItemDto, DiagnosisDto, PlanDto } from "@/lib/diagnosis";
import { generateDiagnosisPdf } from "@/features/cx-tools/shared/pdf/generateDiagnosisPdf";
import PlanBlock from "./PlanBlock";
import GeneratePlanButton from "./GeneratePlanButton";

const POLL_MS = 10_000;
const EMAIL_POLL_MS = 5_000;

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: getLocale() === "es" ? es : undefined,
    });
  } catch {
    return iso;
  }
}

function severityColor(severity: number | null): string {
  if (severity === null) return "var(--text-muted)";
  if (severity >= 0.8) return "var(--severity-high)";
  if (severity >= 0.5) return "var(--severity-mid)";
  return "var(--severity-low)";
}

export default function DiagnosisPanel({ contactId }: { contactId: string | null }) {
  const t = useTranslations("diagnosis");
  const { toast } = useToast();
  const locale = getLocale();
  const language = locale === "es" ? "es" : "en";

  const [email, setEmail] = useState("");
  const [emailDiagId, setEmailDiagId] = useState<string | null>(null);
  const [emailDiagnosis, setEmailDiagnosis] = useState<DiagnosisDto | null>(null);
  const [emailPlan, setEmailPlan] = useState<PlanDto | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [busyContactId, setBusyContactId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [executingKey, setExecutingKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const signals = useMemo(() => getCachedSignals(language), [language]);

  const stageNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of WHEEL_STRUCTURE.domains) {
      map[d.code] = translate(d.name_key, language);
    }
    return map;
  }, [language]);

  const fetcher = useCallback(async () => {
    if (!contactId) return { diagnoses: [] as DiagnosisListItemDto[] };
    const data = await apiFetch<{ diagnoses?: DiagnosisListItemDto[] }>(
      `/api/diagnose?contact_id=${encodeURIComponent(contactId)}`
    );
    return { diagnoses: data.diagnoses ?? [] };
  }, [contactId]);

  const { data, error, loading, refresh } = usePolling(fetcher, {
    intervalMs: POLL_MS,
    keepStaleOnError: false,
  });

  /* Email diagnosis polling — poll the single row until terminal */
  const emailFetcher = useCallback(async () => {
    if (!emailDiagId) return { id: null };
    const next = await apiFetch<DiagnosisDto>(`/api/diagnose/${emailDiagId}`);
    setEmailDiagnosis(next);
    return { id: next.status };
  }, [emailDiagId]);

  usePolling(emailFetcher, { intervalMs: EMAIL_POLL_MS, keepStaleOnError: true });

  const allDiagnoses = useMemo(() => {
    const merged: Array<DiagnosisListItemDto | DiagnosisDto> = [
      emailDiagnosis,
      ...(data?.diagnoses ?? []),
    ].filter((d): d is DiagnosisListItemDto | DiagnosisDto => d !== null);
    const seen = new Set<string>();
    return merged.filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true)));
  }, [emailDiagnosis, data]);

  const active = useMemo(() => {
    if (allDiagnoses.length === 0) return null;
    const id = selectedId && allDiagnoses.some((d) => d.id === selectedId) ? selectedId : null;
    return allDiagnoses.find((d) => d.id === id) ?? allDiagnoses[0];
  }, [allDiagnoses, selectedId]);

  const runDiagnosis = async (target: { contactId?: string; email?: string }) => {
    try {
      if (target.contactId) setBusyContactId(target.contactId);
      else setEmailBusy(true);
      const res = await apiFetch<{ id: string; status: string }>("/api/diagnose", {
        method: "POST",
        body: target,
      });
      if (target.email) {
        setEmailDiagId(res.id);
        setEmailDiagnosis(null);
        setEmailPlan(null);
        setSelectedId(res.id);
      } else {
        await refresh();
      }
    } catch (err) {
      clientLogger.error("Failed to run diagnosis", { err, target });
      toast(t("runFailed"), "error");
    } finally {
      setBusyContactId(null);
      setEmailBusy(false);
    }
  };

  const generatePlan = async (diagnosis: DiagnosisDto) => {
    if (!diagnosis || generatingId) return;
    setGeneratingId(diagnosis.id);
    try {
      const res = await apiFetch<{ plan_id: string; status: string }>(
        `/api/diagnose/${diagnosis.id}/plan`,
        { method: "POST", body: {} }
      );
      toast(t("planGenerated"));
      if (diagnosis === emailDiagnosis) {
        const plan = await apiFetch<PlanDto>(`/api/diagnose/plan/${res.plan_id}`);
        setEmailPlan(plan);
      } else {
        await refresh();
      }
    } catch (err) {
      clientLogger.error("Failed to generate plan", { err, diagnosisId: diagnosis.id });
      toast(t("planFailed"), "error");
    } finally {
      setGeneratingId(null);
    }
  };

  const executePlanItem = async (planId: string, index: number) => {
    const key = `${planId}:${index}`;
    if (executingKey) return;
    setExecutingKey(key);
    try {
      const res = await apiFetch<{
        status?: string;
        error?: string;
        details?: { message?: string };
      }>(`/api/diagnose/plan/${planId}/execute`, { method: "POST", body: { index } });

      if (res.status === "executed") {
        toast(t("executed"));
      } else if (res.status === "pending_hitl") {
        toast(t("pendingHitl"));
      } else if (res.error) {
        toast(t("execRejected"), "error");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      clientLogger.error("Failed to execute plan item", { err, planId, index });
      toast(`${t("execFailed")}${message ? `: ${message}` : ""}`, "error");
    } finally {
      setExecutingKey(null);
    }
  };

  const exportPdf = async () => {
    if (!active || !active.result) return;
    setExporting(true);
    try {
      const plan: PlanDto | null =
        "plan" in active ? (active as DiagnosisListItemDto).plan : emailPlan;
      await generateDiagnosisPdf({ diagnosis: active, plan, stageNames, signals, language });
      toast(t("pdfDownloaded"));
    } catch (err) {
      clientLogger.error("Failed to generate diagnosis PDF", { err });
      toast(t("pdfFailed"), "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rounded-2xl bg-[var(--card)] border border-[var(--border)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--accent-soft)]">
            <Stethoscope className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-[var(--font-heading)] text-[var(--text-primary)]">
              {t("sectionTitle")}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">{t("sectionSubtitle")}</p>
          </div>
        </div>
        {contactId && (
          <div className="flex items-center gap-2">
            <Button
              disabled={busyContactId !== null}
              onClick={() => void runDiagnosis({ contactId })}
              className="text-[12px] px-4 py-2"
            >
              {busyContactId !== null ? t("diagnosing") : t("runDiagnosis")}
            </Button>
          </div>
        )}
      </div>

      {/* By-email toolbar */}
      <div className="px-5 pb-5">
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-[var(--card-elevated)] border border-[var(--border)]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
            <Mail className="w-3 h-3" /> {t("byEmailTitle")}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("byEmailPlaceholder")}
              className="sm:flex-1"
            />
            <Button
              disabled={emailBusy || !email.trim()}
              onClick={() => void runDiagnosis({ email: email.trim() })}
              className="sm:w-auto"
            >
              {emailBusy ? t("diagnosing") : t("diagnose")}
            </Button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">{t("byEmailHint")}</p>
        </div>
      </div>

      {/* History + active diagnosis */}
      <div className="grid lg:grid-cols-2 gap-0 lg:gap-6 p-5 pt-0">
        {/* History list */}
        <div className="flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
              <FileText className="w-3 h-3" /> {t("diagnosisHistory")}
            </div>
            {contactId && (
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                {contactId}
              </span>
            )}
          </div>

          {loading && allDiagnoses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
              {t("loading")}
            </div>
          ) : error && allDiagnoses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <AlertTriangle className="w-4 h-4" /> {t("feedError")}
            </div>
          ) : allDiagnoses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-[320px] p-4">
                <Stethoscope className="w-8 h-8 mx-auto mb-3 opacity-40 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-secondary)]">{t("noDiagnoses")}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[400px] pr-1">
              {allDiagnoses.map((d) => {
                const isActive = d.id === active?.id;
                const planFor: PlanDto | null =
                  "plan" in d ? d.plan : d === emailDiagnosis ? emailPlan : null;
                const statusColor =
                  d.status === "completed"
                    ? "var(--positive)"
                    : d.status === "failed"
                      ? "var(--negative)"
                      : "var(--text-muted)";
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className="text-left rounded-xl p-3 transition-colors"
                    style={{
                      backgroundColor: isActive ? "var(--card-elevated)" : "transparent",
                      border: `1px solid ${isActive ? "var(--border-strong)" : "var(--border)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold truncate text-[var(--text-primary)]">
                        {d.email ?? d.contact_id}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]"
                        style={{ color: statusColor }}
                      >
                        {(d.status === "queued" || d.status === "running") && (
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: "var(--text-muted)" }}
                          />
                        )}
                        {d.status === "queued"
                          ? t("statusQueued")
                          : d.status === "running"
                            ? t("statusRunning")
                            : d.status === "completed"
                              ? t("statusCompleted")
                              : t("statusFailed")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {d.triggered_by ?? "dashboard"} · {timeAgo(d.created_at)}
                      </span>
                      {planFor && (
                        <span className="text-[10px] font-mono text-[var(--accent)]">
                          {planFor.items.length} → {planFor.status}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active diagnosis detail */}
        <div className="flex flex-col min-h-[220px] border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-4 lg:pt-0 lg:pl-6">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
              {t("noSelection")}
            </div>
          ) : active.status === "queued" || active.status === "running" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm text-[var(--text-muted)]">
              <Hourglass className="w-6 h-6 animate-pulse" />
              <span>{t("statusWorking")}…</span>
            </div>
          ) : active.status === "failed" ? (
            <div className="flex items-start gap-2 p-4 rounded-xl border border-[var(--negative)] bg-[var(--negative-soft)] text-sm text-[var(--negative)]">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t("statusFailed")}</p>
                <p className="text-xs mt-0.5 break-words">
                  {t("failReason", { reason: active.fail_reason ?? "—" })}
                </p>
              </div>
            </div>
          ) : active.result ? (
            <div className="flex flex-col gap-3">
              {/* Verdict */}
              <div className="rounded-xl p-4 bg-[var(--card-elevated)] border border-[var(--border)]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent)]">
                    {t("verdictSummary")}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {t("generatedBy", { model: active.model ?? "—" })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                  {active.result.summary}
                </p>
                {active.result.low_data && (
                  <p className="mt-2 text-[11px] text-[var(--warning)]">{t("lowData")}</p>
                )}
              </div>

              {/* Findings */}
              {active.result.findings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                    <AlertTriangle className="w-3 h-3" /> {t("findings")}
                    <span className="ml-auto font-mono normal-case text-[var(--text-secondary)]">
                      {active.result.findings.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                    {active.result.findings.map((f) => {
                      const color = severityColor(f.severity);
                      return (
                        <div
                          key={f.signal_id + f.cause_code}
                          className="rounded-xl p-3 bg-[var(--card-elevated)] border border-[var(--border)]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold" style={{ color }}>
                              {f.signal_id}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {f.cause_code ?? "?"} · {Math.round(f.confidence * 100)}%{" "}
                              {t("confidence")}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1 rounded-full overflow-hidden bg-[var(--border)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(f.severity * 100)}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed line-clamp-2 text-[var(--text-muted)]">
                            {f.evidence}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stage health */}
              {active.result.stage_health.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                    <RefreshCw className="w-3 h-3" /> {t("stageHealth")}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {active.result.stage_health.map((sh) => {
                      const meta = stageNames[sh.stage];
                      const weakestScore = Math.min(
                        ...active.result!.stage_health.map((s) => s.score)
                      );
                      const isWeakest = sh.score === weakestScore;
                      return (
                        <div
                          key={sh.stage}
                          className="rounded-lg px-3 py-2 bg-[var(--card-elevated)] border border-[var(--border)]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-[var(--text-secondary)]">
                              {sh.stage}
                            </span>
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: severityColor(sh.score) }}
                            >
                              {Math.round(sh.score * 100)}%
                              {isWeakest && (
                                <span className="ml-1 text-[var(--text-muted)] font-normal">
                                  ({t("weakest")})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-1 h-1 rounded-full overflow-hidden bg-[var(--border)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(sh.score * 100)}%`,
                                backgroundColor: severityColor(sh.score),
                              }}
                            />
                          </div>
                          {meta && (
                            <p className="mt-1 text-[10px] truncate text-[var(--text-muted)]">
                              {meta}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Plan */}
              {"plan" in active && (active as DiagnosisListItemDto).plan ? (
                <PlanBlock
                  plan={(active as DiagnosisListItemDto).plan!}
                  stageNames={stageNames}
                  executingKey={executingKey}
                  onExecute={(planId, index) => void executePlanItem(planId, index)}
                />
              ) : active === emailDiagnosis && emailPlan ? (
                <PlanBlock
                  plan={emailPlan}
                  stageNames={stageNames}
                  executingKey={executingKey}
                  onExecute={(planId, index) => void executePlanItem(planId, index)}
                />
              ) : (
                <GeneratePlanButton
                  busy={generatingId === active.id}
                  onGenerate={() => void generatePlan(active)}
                />
              )}

              {/* Export */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={exporting}
                  onClick={() => void exportPdf()}
                  className="text-[12px] px-4 py-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {exporting ? t("exporting") : t("exportPdf")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <AlertTriangle className="w-4 h-4" /> {active.status}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
