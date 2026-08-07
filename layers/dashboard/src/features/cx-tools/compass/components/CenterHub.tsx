"use client";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export default function CenterHub() {
  const { resetToHome, hoveredLabel, viewState } = useWheel();
  const { wheelData } = useCompassData();
  const t = useTranslations("cxtools");
  const { center } = wheelData;

  return (
    <g
      className="cursor-pointer"
      onClick={resetToHome}
      tabIndex={0}
      role="button"
      aria-label={t("resetHome")}
      onKeyDown={(e) => e.key === "Enter" && resetToHome()}
    >
      <circle cx={0} cy={0} r={120} fill="var(--surface)" stroke="var(--border)" strokeWidth={2} />
      <foreignObject x={-95} y={-65} width={190} height={130}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AnimatePresence mode="wait">
            {hoveredLabel ? (
              <motion.span
                key="hover"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-heading)]"
              >
                {hoveredLabel}
              </motion.span>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-lg font-bold uppercase tracking-widest text-[var(--text-primary)] font-[var(--font-heading)]">
                  {center.name}
                </span>
                {viewState === "home" && (
                  <span className="text-sm leading-tight px-2 text-[var(--text-secondary)]">
                    {center.description}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </foreignObject>
    </g>
  );
}
