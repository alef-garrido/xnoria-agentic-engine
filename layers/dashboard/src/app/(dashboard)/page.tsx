"use client";

import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BRANDING } from "@/config/branding";
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

interface OverviewStats {
  activityTotal: number;
  sessionTotal: number;
  servicesRunning: number;
  servicesTotal: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [actRes, sessRes, sysRes] = await Promise.all([
          fetch("/api/activity?limit=1&page=1"),
          fetch("/api/sessions?limit=1&page=1"),
          fetch("/api/system"),
        ]);

        const [actData, sessData, sysData] = await Promise.all([
          actRes.ok ? actRes.json() : null,
          sessRes.ok ? sessRes.json() : null,
          sysRes.ok ? sysRes.json() : null,
        ]);

        const running = sysData?.services?.filter((s: any) => s.status === "running").length ?? 0;

        setStats({
          activityTotal: actData?.total ?? 0,
          sessionTotal: sessData?.total ?? 0,
          servicesRunning: running,
          servicesTotal: sysData?.services?.length ?? 4,
        });
        setError(false);
      } catch (err) {
        if (!stats) setError(true);
      }
    };

    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
            letterSpacing: "-1.5px",
          }}
        >
          🧠 {BRANDING.appTitle} Overview
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          CX Intelligence Engine — system health and recent activity
        </p>
      </div>

      {/* Stats Cards */}
      {error ? (
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
            Unable to fetch overview data. Ensure services are running.
          </p>
        </div>
      ) : !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl"
              style={{ backgroundColor: "var(--card)" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activity Count */}
          <Link
            href="/activity"
            className="rounded-xl p-5 flex items-center justify-between group"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-col gap-1">
              <div
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                <Activity className="w-4 h-4" style={{ color: "var(--info)" }} />
                Filter Log Events
              </div>
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                }}
              >
                {stats.activityTotal.toLocaleString()}
              </div>
            </div>
            <ArrowRight
              className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            />
          </Link>

          {/* Session Count */}
          <Link
            href="/sessions"
            className="rounded-xl p-5 flex items-center justify-between group"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-col gap-1">
              <div
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                <History className="w-4 h-4" style={{ color: "var(--accent)" }} />
                Cognitive Sessions
              </div>
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                }}
              >
                {stats.sessionTotal.toLocaleString()}
              </div>
            </div>
            <ArrowRight
              className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            />
          </Link>

          {/* Services Status */}
          <Link
            href="/system"
            className="rounded-xl p-5 flex items-center justify-between group"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-col gap-1">
              <div
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                <Server className="w-4 h-4" style={{ color: "var(--positive)" }} />
                Core Services
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--text-primary)",
                  }}
                >
                  {stats.servicesRunning}/{stats.servicesTotal}
                </span>
                {stats.servicesRunning === stats.servicesTotal ? (
                  <CheckCircle
                    className="w-5 h-5"
                    style={{ color: "var(--positive)" }}
                  />
                ) : (
                  <XCircle
                    className="w-5 h-5"
                    style={{ color: "var(--negative)" }}
                  />
                )}
              </div>
            </div>
            <ArrowRight
              className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            />
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="accent-line" />
            <h2
              className="text-base font-semibold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
              }}
            >
              Recent Activity
            </h2>
          </div>
          <Link
            href="/activity"
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            View all →
          </Link>
        </div>
        <div className="p-0">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
