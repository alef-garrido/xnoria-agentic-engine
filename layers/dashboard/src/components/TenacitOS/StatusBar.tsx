"use client";

import type { ComponentType, CSSProperties } from "react";
import { Cpu, HardDrive, MemoryStick, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePolling } from "@/hooks/usePolling";
import { apiFetch } from "@/lib/client-api";

interface SystemStats {
  cpu: number;
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  activeServices: number;
  totalServices: number;
  uptime: string;
}

interface StatusMetricProps {
  icon: ComponentType<{ style?: CSSProperties; className?: string }>;
  label: string;
  value: string;
  barPercent?: number;
  color: string;
}

function StatusMetric({ icon: Icon, label, value, barPercent, color }: StatusMetricProps) {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
      <span className="font-[var(--font-body)] text-[11px] font-semibold tracking-[1px] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="font-[var(--font-body)] text-[11px] font-semibold text-[var(--text-secondary)]">
        {value}
      </span>
      {barPercent !== undefined && (
        <div className="w-[48px] h-1 rounded-[2px] overflow-hidden bg-[var(--surface-elevated)]">
          <div
            className="h-full rounded-[2px]"
            style={{
              width: `${Math.min(100, barPercent)}%`,
              backgroundColor: color,
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
      const data = await apiFetch<{
        services: Array<{ status: string; uptime?: string }>;
        host: {
          cpuPercent: number;
          ramUsed: number;
          ramTotal: number;
          diskUsed: number;
          diskTotal: number;
        };
      }>("/api/system");
      const runningServices = data.services.filter((s) => s.status === "running").length;

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
    <div className="fixed bottom-0 left-0 right-0 h-[32px] bg-[var(--surface)] border-t border-[var(--border)] flex items-center pl-[calc(var(--layout-sidebar-w)_+_16px)] pr-4 gap-4 z-40">
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
      <div className="w-px h-4 bg-[var(--border)]" />

      {/* Services */}
      <div className="flex items-center gap-1">
        <span className="font-[var(--font-body)] text-[10px] font-medium text-[var(--text-muted)]">
          {t("services")}: {current.activeServices}/{current.totalServices}
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-[var(--border)]" />

      {/* Uptime */}
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
        <span className="font-[var(--font-body)] text-[10px] font-medium text-[var(--text-muted)]">
          {t("uptime")}: {current.uptime}
        </span>
      </div>
    </div>
  );
}
