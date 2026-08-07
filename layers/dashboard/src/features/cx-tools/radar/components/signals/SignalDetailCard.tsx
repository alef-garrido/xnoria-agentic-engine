"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FlatSignal } from "@/features/cx-tools/shared/types/signal";

interface SignalDetailCardProps {
  signal: FlatSignal | null;
  domains: { id: string; name: string; color: string }[];
  causes: { code: string; name: string }[];
}

export function SignalDetailCard({ signal, domains, causes }: SignalDetailCardProps) {
  const t = useTranslations("cxtools");
  if (!signal) {
    return (
      <div className="w-full flex-1 min-h-[400px] flex flex-col items-center justify-center pt-8 px-8 pb-0 text-center rounded-2xl bg-[var(--card)] border border-dashed border-[var(--border-strong)]">
        <div className="w-16 h-16 rounded-full border border-dashed mb-4 border-[var(--border-strong)]" />
        <p className="text-sm text-[var(--text-secondary)]">{t("selectSignalHint")}</p>
      </div>
    );
  }

  const domain = domains.find((d) => signal.domain === d.id);
  const domainColor = domain?.color || "#64748b";
  const causeName = causes.find((c) => c.code === signal.causeCode)?.name || signal.causeCode;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signal.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full h-full flex flex-col"
      >
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider text-white shadow-sm"
            style={{ backgroundColor: domainColor }}
          >
            {signal.id.split("_").pop()}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {domain?.name} &gt; {causeName}
          </span>
        </div>

        <h2 className="text-2xl font-bold mb-6 font-[var(--font-heading)] text-[var(--text-primary)]">
          {signal.label}
        </h2>

        {/* Indicators */}
        {signal.indicators && signal.indicators.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t("indicators")}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {signal.indicators.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-md w-full bg-[var(--card-elevated)] border border-[var(--border)]"
                >
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]">
                    {m.id.split("_").pop()}
                  </span>
                  <span className="text-sm font-medium text-right font-mono capitalize tracking-tight">
                    {m.name.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interventions */}
        {signal.interventions && signal.interventions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t("interventions")}
              </h3>
            </div>
            <ul className="space-y-2">
              {signal.interventions.map((int) => (
                <li
                  key={int.id}
                  className="flex flex-col p-3 rounded-md bg-[var(--card-elevated)] border border-[var(--border)]"
                >
                  <span className="font-mono text-[10px] mb-1.5 text-[var(--text-muted)]">
                    {int.id.replace("INT_", "")}
                  </span>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded-sm border-2 flex-shrink-0 border-[var(--border-strong)]" />
                    <span className="text-sm text-[var(--text-primary)]">{int.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
