"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, MemoryStick, Clock } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";

interface SystemStats {
  cpu: number;
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  activeServices: number;
  totalServices: number;
  uptime: string;
}

export function StatusBar() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    ram: { used: 0, total: 4 },
    disk: { used: 0, total: 100 },
    activeServices: 0,
    totalServices: 4,
    uptime: "0d 0h",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/system");
        if (res.ok) {
          const data = await res.json();
          const runningServices = data.services.filter((s: any) => s.status === 'running').length;
          
          setStats({
            cpu: data.host.cpuPercent * 100,
            ram: { used: data.host.ramUsed / 1e9, total: data.host.ramTotal / 1e9 },
            disk: { used: data.host.diskUsed, total: data.host.diskTotal || 100 },
            activeServices: runningServices,
            totalServices: data.services.length,
            uptime: data.services[0]?.uptime || "0s",
          });
        }
      } catch (error) {
        clientLogger.error("Failed to fetch system stats", { error });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    return () => clearInterval(interval);
  }, []);

  const cpuColor = stats.cpu < 60 ? "var(--positive)" : stats.cpu < 85 ? "var(--warning)" : "var(--negative)";
  const ramPercent = (stats.ram.used / stats.ram.total) * 100;
  const ramColor = ramPercent < 60 ? "var(--positive)" : ramPercent < 85 ? "var(--warning)" : "var(--negative)";
  const diskPercent = (stats.disk.used / stats.disk.total) * 100;
  const diskColor = diskPercent < 60 ? "var(--positive)" : diskPercent < 85 ? "var(--warning)" : "var(--negative)";

  // StatusMetric component
  const StatusMetric = ({ icon: Icon, label, value, barPercent, color }: any) => (
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
        padding: "0 16px 0 272px", // 256px sidebar + 16px gap
        gap: "16px",
        zIndex: 40,
      }}
    >
      {/* CPU */}
      <StatusMetric icon={Cpu} label="CPU" value={`${stats.cpu.toFixed(0)}%`} barPercent={stats.cpu} color={cpuColor} />

      {/* RAM */}
      <StatusMetric
        icon={MemoryStick}
        label="RAM"
        value={`${stats.ram.used.toFixed(1)}/${stats.ram.total.toFixed(0)}GB`}
        barPercent={ramPercent}
        color={ramColor}
      />

      {/* Disk */}
      <StatusMetric
        icon={HardDrive}
        label="DISK"
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
          SVC: {stats.activeServices}/{stats.totalServices}
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
          Uptime: {stats.uptime}
        </span>
      </div>
    </div>
  );
}
