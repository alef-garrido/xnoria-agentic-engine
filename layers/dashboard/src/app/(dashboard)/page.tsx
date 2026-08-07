"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { BRANDING } from "@/config/branding";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePolling } from "@/hooks/usePolling";
import { apiFetch } from "@/lib/client-api";
import {
  Activity,
  History,
  Server,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface OverviewStats {
  activityTotal: number;
  sessionTotal: number;
  servicesRunning: number;
  servicesTotal: number;
}

export default function DashboardPage() {
  const t = useTranslations("home");

  const { data: stats, error } = usePolling(
    async () => {
      const [actData, sessData, sysData] = await Promise.all([
        apiFetch<{ total?: number }>("/api/activity?limit=1&page=1").catch(() => null),
        apiFetch<{ total?: number }>("/api/sessions?limit=1&page=1").catch(() => null),
        apiFetch<{ services?: Array<{ status: string }> }>("/api/system").catch(() => null),
      ]);

      if (actData === null && sessData === null && sysData === null) {
        throw new Error("Failed to load overview");
      }

      const running =
        sysData?.services?.filter((s: { status: string }) => s.status === "running").length ?? 0;

      return {
        activityTotal: actData?.total ?? 0,
        sessionTotal: sessData?.total ?? 0,
        servicesRunning: running,
        servicesTotal: sysData?.services?.length ?? 4,
      } satisfies OverviewStats;
    },
    { intervalMs: 15_000 }
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        leading="🧠"
        title={`${BRANDING.appTitle} ${t("overview")}`}
        subtitle={t("subtitle")}
      />

      {/* Stats Cards */}
      {error ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[var(--warning)]" />
          <p className="text-[var(--text-secondary)]">{t("unableToFetch")}</p>
        </Card>
      ) : !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activity Count */}
          <Link
            href="/activity"
            className="rounded-xl p-5 flex items-center justify-between group bg-[var(--card)] border border-[var(--border)]"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <Activity className="w-4 h-4 text-[var(--info)]" />
                {t("filterLogEvents")}
              </div>
              <div className="text-2xl font-bold font-[var(--font-heading)] text-[var(--text-primary)]">
                {stats.activityTotal.toLocaleString()}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]" />
          </Link>

          {/* Session Count */}
          <Link
            href="/sessions"
            className="rounded-xl p-5 flex items-center justify-between group bg-[var(--card)] border border-[var(--border)]"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <History className="w-4 h-4 text-[var(--accent)]" />
                {t("cognitiveSessions")}
              </div>
              <div className="text-2xl font-bold font-[var(--font-heading)] text-[var(--text-primary)]">
                {stats.sessionTotal.toLocaleString()}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]" />
          </Link>

          {/* Services Status */}
          <Link
            href="/system"
            className="rounded-xl p-5 flex items-center justify-between group bg-[var(--card)] border border-[var(--border)]"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <Server className="w-4 h-4 text-[var(--positive)]" />
                {t("coreServices")}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-[var(--font-heading)] text-[var(--text-primary)]">
                  {stats.servicesRunning}/{stats.servicesTotal}
                </span>
                {stats.servicesRunning === stats.servicesTotal ? (
                  <CheckCircle className="w-5 h-5 text-[var(--positive)]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[var(--negative)]" />
                )}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]" />
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="accent-line" />
            <h2 className="text-base font-semibold font-[var(--font-heading)] text-[var(--text-primary)]">
              {t("recentActivity")}
            </h2>
          </div>
          <Link href="/activity" className="text-sm font-medium text-[var(--accent)]">
            {t("viewAll")}
          </Link>
        </div>
        <ActivityFeed />
      </Card>
    </div>
  );
}
