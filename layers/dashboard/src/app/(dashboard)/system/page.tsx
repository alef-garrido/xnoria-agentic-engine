"use client";

import { useEffect, useState } from "react";
import { Server, Activity, ArrowUpRight, Cpu, MemoryStick, HardDrive } from "lucide-react";

interface Service {
  name: string;
  status: string;
  uptime: string;
  restartCount: number;
}

interface Host {
  cpuPercent: number;
  ramUsed: number;
  ramTotal: number;
  diskUsed: number;
  diskTotal: number;
}

interface SystemData {
  services: Service[];
  host: Host;
}

function StatusIndicator({ status }: { status: string }) {
  let color = "var(--negative)"; // Default missing/stopped
  
  if (status === "running") color = "var(--positive)";
  else if (status.includes("unhealthy") || status === "restarting") color = "var(--warning)";

  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-2.5 h-2.5 rounded-full" 
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
      />
      <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
        {status}
      </span>
    </div>
  );
}

function bytesToGB(bytes: number) {
  return (bytes / 1024 / 1024 / 1024).toFixed(1);
}

export default function SystemMonitorPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const res = await fetch(`/api/system`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json);
        setError(false);
      } catch (err) {
        if (!data) setError(true);
      }
    };

    fetchSystem();
    const interval = setInterval(fetchSystem, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 
          className="text-2xl font-bold tracking-tight"
          style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)'
          }}
        >
          System Monitor
        </h1>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Activity className="w-4 h-4 animate-pulse" style={{ color: 'var(--positive)' }} />
          Polling every 10s
        </div>
      </div>

      {error ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--error)' }}>Failed to fetch system metrics. Ensure Docker API is mounted.</p>
        </div>
      ) : !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl" style={{ backgroundColor: 'var(--card)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Services Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Core Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {data.services.map((service) => (
                <div 
                  key={service.name}
                  className="rounded-xl p-5 flex flex-col gap-4"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {service.name}
                      </h3>
                    </div>
                    <StatusIndicator status={service.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Uptime</span>
                      <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{service.uptime || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Restarts</span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{service.restartCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Host Metrics Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4 mt-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Host Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="rounded-xl p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <Cpu className="w-4 h-4" /> CPU Load
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {(data.host.cpuPercent).toFixed(2)}
                  </div>
                </div>
              </div>

              <div 
                className="rounded-xl p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <MemoryStick className="w-4 h-4" /> Memory Output
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {bytesToGB(data.host.ramUsed)} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {bytesToGB(data.host.ramTotal)} GB</span>
                  </div>
                </div>
              </div>

              <div 
                className="rounded-xl p-5 flex items-center justify-between"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <HardDrive className="w-4 h-4" /> Disk Utilization
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {data.host.diskTotal ? (
                      <>{bytesToGB(data.host.diskUsed)} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {bytesToGB(data.host.diskTotal)} GB</span></>
                    ) : (
                      <span className="text-base font-normal" style={{ color: 'var(--warning)' }}>Not Available</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
