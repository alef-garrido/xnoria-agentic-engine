"use client";

import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { FunnelGlyph } from "./FunnelGlyph";
import { useTranslations } from "next-intl";

export default function DetailPanel() {
  const {
    selectedCause,
    selectedDomain,
    selectedSignal,
    viewState,
    resetToHome,
    selectDomain,
    selectCause,
  } = useWheel();
  const { uiStrings, getIntervention } = useCompassData();
  const t = useTranslations("cxtools");

  const isOpen =
    (viewState === "cause" || viewState === "signal") && !!selectedCause && !!selectedDomain;

  const handleClose = () => {
    if (viewState === "signal" && selectedCause) {
      selectCause(selectedCause);
    } else if (selectedDomain) {
      selectDomain(selectedDomain);
    } else {
      resetToHome();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && selectedCause && selectedDomain && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 h-full w-full sm:w-[400px] z-50 overflow-y-auto border-l bg-[var(--card-elevated)] text-[var(--text-primary)] border-[var(--border)]"
        >
          <div className="p-6">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label={t("closeDetail")}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Code badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold font-mono tracking-wider text-white"
                style={{ backgroundColor: selectedDomain.color }}
              >
                {viewState === "signal" && selectedSignal
                  ? selectedSignal.id.split("_").pop()
                  : selectedCause.code}
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {selectedDomain.name} {viewState === "signal" && `> ${selectedCause.name}`}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-6 text-center font-[var(--font-heading)]">
              {viewState === "signal" && selectedSignal ? selectedSignal.name : selectedCause.name}
            </h2>

            {/* Signal Context Block */}
            {viewState === "signal" && selectedSignal && (
              <div className="mb-6 p-4 rounded-md bg-[var(--surface)]/30 border border-[var(--border)]/50">
                <p className="text-xs text-[var(--text-secondary)] mb-3 uppercase tracking-wider font-semibold">
                  {t("belongsTo")}
                </p>
                <div className="flex flex-col gap-2 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]" />
                    <span>
                      <span className="text-[var(--text-secondary)]">{t("labelCause")}</span>{" "}
                      {selectedCause.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selectedDomain.color }}
                    />
                    <span>
                      <span className="text-[var(--text-secondary)]">{t("labelDomain")}</span>{" "}
                      {selectedDomain.name}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Funnel Glyph Visual Core */}
            {(viewState === "cause" || (viewState === "signal" && selectedSignal)) && (
              <div className="mb-6 flex justify-center bg-[var(--surface)]/10 rounded-xl border border-[var(--border)]/30 shadow-inner">
                <FunnelGlyph
                  color={selectedDomain.color}
                  signals={
                    viewState === "signal" && selectedSignal
                      ? [selectedSignal]
                      : selectedCause.signals
                  }
                />
              </div>
            )}

            {/* Signals */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[var(--text-secondary)]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {uiStrings.signals}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {selectedCause.signals.map((s) => {
                  const isHighlighted = viewState === "signal" && selectedSignal?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`flex flex-col p-2.5 rounded-md border shadow-sm w-full transition-colors ${
                        isHighlighted
                          ? "bg-[var(--surface)]/80 border-[var(--border)]"
                          : "bg-[var(--surface)]/30 border-[var(--border)]/50 hover:bg-[var(--surface)]/50"
                      }`}
                      style={
                        isHighlighted
                          ? { borderLeftColor: selectedDomain.color, borderLeftWidth: 3 }
                          : {}
                      }
                    >
                      <span className="font-mono text-[10px] text-[var(--text-secondary)] font-semibold tracking-wider mb-1">
                        {s.id}
                      </span>
                      <span className={`text-sm ${isHighlighted ? "font-bold" : "font-medium"}`}>
                        {s.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Indicators */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {uiStrings.indicators}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(viewState === "signal" && selectedSignal?.indicators
                  ? selectedSignal.indicators
                  : selectedCause.indicators
                ).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-[var(--surface)] p-2.5 rounded-md border border-[var(--border)] shadow-sm w-full"
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

            {/* Interventions */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {uiStrings.interventions}
                </h3>
              </div>
              <ul className="space-y-2">
                {(viewState === "signal" && selectedSignal?.interventions
                  ? selectedSignal.interventions
                  : selectedCause.interventions
                ).map((intId) => {
                  const int = typeof intId === "object" ? intId : getIntervention(intId);
                  if (!int || !int.id) return null;

                  const displayName = int.name;

                  return (
                    <li
                      key={int.id}
                      className="flex flex-col p-3 rounded-md bg-[var(--surface)]/50 border border-transparent hover:border-[var(--border)]/50 transition-colors"
                    >
                      <span className="font-mono text-[10px] text-[var(--text-secondary)] mb-1.5">
                        {int.id.replace("INT_", "")}
                      </span>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-4 h-4 rounded-sm border-2 border-[var(--text-secondary)]/30 flex-shrink-0" />
                        <span className="text-sm">{displayName}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
