"use client";

import type { ComponentType, CSSProperties } from "react";
import { Cpu, HardDrive, MemoryStick, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePolling } from "@/hooks/usePolling";

interface SystemStats {
  cpu: number;
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  activeServices: number;
  totalServices: number;
  uptime: string;
}

interface StatusMetricProps {
  icon: ComponentType<{ style?: CSSProperties }>;
  label: string;
  value: string;
  barPercent?: number;
  color: string;
}

function StatusMetric({ icon: Icon, label, value, barPercent, color }: StatusMetricProps) {
  return (
    <div className="flex items-center gap-1.5" style={{ height: "24px" }}>
      <Icon style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1px",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        {value}
      </span>
      {barPercent !== undefined && (
        <div
          style={{
            width: "48px",
            height: "4px",
            backgroundColor: "var(--surface-elevated)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, barPercent)}%`,
              height: "100%",
              backgroundColor: color,
              borderRadius: "2px",
            }}
          />
        </div>
      )}
    </div>
  );
}

const DEFAULT_STATS: SystemStats = {
  cpu: 0,
  ram: { used: 0, total: 4 },
  disk: { used: 0, total: 100 },
  activeServices: 0,
  totalServices: 4,
  uptime: "0d 0h",
};

export function StatusBar() {
  const t = useTranslations("statusbar");

  const { data: stats } = usePolling(
    async () => {
      const res = await fetch("/api/system");
      if (!res.ok) throw new Error("Failed to fetch system stats");
      const data = await res.json();
      const runningServices = data.services.filter(
        (s: { status: string }) => s.status === "running"
      ).length;

      return {
        cpu: data.host.cpuPercent * 100,
        ram: { used: data.host.ramUsed / 1e9, total: data.host.ramTotal / 1e9 },
        disk: { used: data.host.diskUsed, total: data.host.diskTotal || 100 },
        activeServices: runningServices,
        totalServices: data.services.length,
        uptime: data.services[0]?.uptime || "0s",
      } satisfies SystemStats;
    },
    { intervalMs: 10_000, keepStaleOnError: false }
  );

  const current = stats ?? DEFAULT_STATS;
  const cpuColor =
    current.cpu < 60 ? "var(--positive)" : current.cpu < 85 ? "var(--warning)" : "var(--negative)";
  const ramPercent = (current.ram.used / current.ram.total) * 100;
  const ramColor =
    ramPercent < 60 ? "var(--positive)" : ramPercent < 85 ? "var(--warning)" : "var(--negative)";
  const diskPercent = (current.disk.used / current.disk.total) * 100;
  const diskColor =
    diskPercent < 60 ? "var(--positive)" : diskPercent < 85 ? "var(--warning)" : "var(--negative)";

  return (
    <div
      className="status-bar"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "32px",
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px 0 calc(var(--layout-sidebar-w) + 16px)",
        gap: "16px",
        zIndex: 40,
      }}
    >
      {/* CPU */}
      <StatusMetric
        icon={Cpu}
        label={t("cpu")}
        value={`${current.cpu.toFixed(0)}%`}
        barPercent={current.cpu}
        color={cpuColor}
      />

      {/* RAM */}
      <StatusMetric
        icon={MemoryStick}
        label={t("ram")}
        value={`${current.ram.used.toFixed(1)}/${current.ram.total.toFixed(0)}GB`}
        barPercent={ramPercent}
        color={ramColor}
      />

      {/* Disk */}
      <StatusMetric
        icon={HardDrive}
        label={t("disk")}
        value={`${diskPercent.toFixed(0)}%`}
        barPercent={diskPercent}
        color={diskColor}
      />

      {/* Separator */}
      <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border)" }} />

      {/* Services */}
      <div className="flex items-center gap-1">
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            color: "var(--text-muted)",
          }}
        >
          {t("services")}: {current.activeServices}/{current.totalServices}
        </span>
      </div>

      {/* Separator */}
      <div style={{ width: "1px", height: "16px", backgroundColor: "var(--border)" }} />

      {/* Uptime */}
      <div className="flex items-center gap-1">
        <Clock style={{ width: "12px", height: "12px", color: "var(--text-muted)" }} />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 500,
            color: "var(--text-muted)",
          }}
        >
          {t("uptime")}: {current.uptime}
        </span>
      </div>
    </div>
  );
}
