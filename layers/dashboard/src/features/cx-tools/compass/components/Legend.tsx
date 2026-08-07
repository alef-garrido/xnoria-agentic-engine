"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

const subscribe = () => () => {};

export default function Legend() {
  const [open, setOpen] = useState(false);
  // SSR-safe client check — createPortal(document.body) crashes server render
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const { wheelData, domainPrefixes, uiStrings } = useCompassData();
  const t = useTranslations("cxtools");

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-medium rounded-md border transition-colors hover:bg-[var(--chip-surface)] text-[var(--text-primary)] border-[var(--border)]"
        aria-label={t("openLegend")}
      >
        <Info className="w-3 h-3" />
        {uiStrings.legend}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Blurred backdrop */}
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                  onClick={close}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Centered card */}
                <motion.div
                  className="relative w-[380px] max-h-[80vh] overflow-y-auto rounded-xl border p-6 shadow-2xl pointer-events-auto bg-[var(--card-elevated)] border-[var(--border)] text-[var(--text-primary)] z-[10000]"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", damping: 28, stiffness: 350 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={close}
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-[var(--chip-surface)] transition-colors"
                    aria-label={t("closeLegend")}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <h3 className="text-sm font-bold uppercase tracking-wider mb-5 font-[var(--font-heading)]">
                    {uiStrings.causeCodeSystem}
                  </h3>

                  <div className="space-y-3">
                    {wheelData.domains.map((domain) => {
                      const prefix =
                        domainPrefixes[domain.id] || domain.id.slice(0, 3).toUpperCase();
                      return (
                        <div key={domain.id}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: domain.color }}
                            />
                            <span
                              className="font-mono font-bold text-xs"
                              style={{ color: domain.color }}
                            >
                              {prefix}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              = {domain.name}
                            </span>
                          </div>
                          <div className="pl-5 flex flex-wrap gap-1">
                            {domain.causes.map((cause) => (
                              <span
                                key={cause.id}
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                                title={cause.name}
                              >
                                {cause.code}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
