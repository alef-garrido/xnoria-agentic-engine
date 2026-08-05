"use client";

import { Server, Activity, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePolling } from "@/hooks/usePolling";
import { apiFetch } from "@/lib/client-api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <span className="text-sm capitalize text-[var(--text-secondary)]">{status}</span>
    </div>
  );
}

function bytesToGB(bytes: number) {
  return (bytes / 1024 / 1024 / 1024).toFixed(1);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold mb-4 font-[var(--font-heading)] text-[var(--text-primary)]">
      {children}
    </h2>
  );
}

export default function SystemMonitorPage() {
  const t = useTranslations("system");
  const { data, error } = usePolling(
    async () => apiFetch<SystemData>("/api/system"),
    { intervalMs: 10_000 }
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("title")}
        action={
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Activity className="w-4 h-4 animate-pulse text-[var(--positive)]" />
            {t("polling")}
          </div>
        }
      />

      {error ? (
        <div className="text-center py-12 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[var(--negative)]">{t("fetchFailed")}</p>
        </div>
      ) : !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Services Grid */}
          <div>
            <SectionTitle>{t("coreServices")}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {data.services.map((service) => (
                <Card key={service.name} className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-[var(--accent)]" />
                      <h3 className="font-semibold text-[var(--text-primary)]">{service.name}</h3>
                    </div>
                    <StatusIndicator status={service.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                        {t("uptime")}
                      </span>
                      <span className="text-sm truncate text-[var(--text-secondary)]">
                        {service.uptime || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                        {t("restarts")}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {service.restartCount}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Host Metrics Grid */}
          <div>
            <SectionTitle>{t("hostMetrics")}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <Cpu className="w-4 h-4" /> {t("cpuLoad")}
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {data.host.cpuPercent.toFixed(2)}
                  </div>
                </div>
              </Card>

              <Card className="p-5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <MemoryStick className="w-4 h-4" /> {t("memoryOutput")}
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {bytesToGB(data.host.ramUsed)}{" "}
                    <span className="text-sm font-normal text-[var(--text-muted)]">
                      / {bytesToGB(data.host.ramTotal)} GB
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <HardDrive className="w-4 h-4" /> {t("diskUtilization")}
                  </div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {data.host.diskTotal ? (
                      <>
                        {bytesToGB(data.host.diskUsed)}{" "}
                        <span className="text-sm font-normal text-[var(--text-muted)]">
                          / {bytesToGB(data.host.diskTotal)} GB
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-normal text-[var(--warning)]">
                        {t("notAvailable")}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
