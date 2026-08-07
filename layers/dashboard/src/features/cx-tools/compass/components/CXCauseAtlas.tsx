"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { CAUSE_REGISTRY } from "@/features/cx-tools/shared/domain/causeRegistry";

// Canonical causes — sourced from the shared cause registry (single source of truth)
const CAUSE_DEFINITIONS = Object.values(CAUSE_REGISTRY)
  .filter((c) => c.code !== "UNK")
  .map((c) => ({ code: c.code, name: c.label, color: c.color }));

export default function CXCauseAtlas() {
  const { wheelData } = useCompassData();
  const { selectDomain, selectCause } = useWheel();

  // Extract all unique causes across all domains for the columns
  const causesOrder = useMemo(() => {
    // These remain fixed across all domains — show all canonically defined causes.
    return CAUSE_DEFINITIONS;
  }, []);

  const handleCellClick = (domainId: string, causeFullCode: string) => {
    const domain = wheelData.domains.find((d) => d.id === domainId);
    if (!domain) return;

    const cause = domain.causes.find((c) => c.code === causeFullCode);
    if (!cause) return;

    selectDomain(domain);
    selectCause(cause);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <div className="w-full h-full overflow-auto p-4 md:p-6 lg:p-8 lg:pt-4 rounded-2xl bg-[var(--chip-surface)] border border-[var(--chip-border)] shadow-lg backdrop-blur-sm">
      <div className="min-w-max">
        {/* Header Row */}
        <div className="grid grid-cols-[160px_repeat(10,_minmax(100px,_1fr))] gap-4 mb-4">
          <div className="font-bold opacity-60 uppercase text-sm tracking-wider flex items-end pb-2">
            Domains
          </div>
          {causesOrder.map((cause) => (
            <div
              key={cause.code}
              className="flex flex-col items-center justify-end pb-2 border-b border-[var(--border)] relative"
            >
              <span className="font-mono font-bold text-lg mb-1 text-[var(--text-primary)]">
                {cause.code}
              </span>
              <span className="text-xs font-semibold text-center leading-tight text-[var(--text-secondary)]">
                {cause.name}
              </span>
            </div>
          ))}
        </div>

        {/* Domain Rows */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4 relative"
        >
          {/* Background Column Guides */}
          <div className="absolute inset-0 grid grid-cols-[160px_repeat(10,_minmax(100px,_1fr))] gap-4 pointer-events-none z-0">
            <div /> {/* Domain col spacer */}
            {causesOrder.map((c) => (
              <div key={c.code} className="flex justify-center">
                <div className="w-px h-full bg-[var(--chip-surface)]" />
              </div>
            ))}
          </div>
          {wheelData.domains.map((domain) => (
            <div
              key={domain.id}
              className="grid grid-cols-[160px_repeat(10,_minmax(100px,_1fr))] gap-4 items-stretch group p-2 -m-2 rounded-xl border border-transparent hover:border-[var(--chip-border)] transition-all"
              style={
                {
                  "--domain-color": domain.color,
                  backgroundColor: `color-mix(in srgb, ${domain.color} 3%, transparent)`,
                } as React.CSSProperties
              }
            >
              {/* Domain Label */}
              <div
                className="flex flex-col justify-center border-l-4 pl-3"
                style={{ borderLeftColor: domain.color }}
              >
                <span className="font-bold text-lg">{domain.name}</span>
                <span className="font-mono text-xs opacity-60 mt-1">
                  {domain.causes[0]?.code.split("-")[0] || domain.id.substr(0, 3).toUpperCase()}
                </span>
              </div>

              {/* Cause Cells */}
              {causesOrder.map((causeDef) => {
                // Determine if this cause is active for this domain
                const activeCause = domain.causes.find((c) => {
                  const shortCode = c.code.split("-")[1] || c.code;
                  return shortCode === causeDef.code;
                });

                if (!activeCause) {
                  return (
                    <div
                      key={causeDef.code}
                      className="flex items-center justify-center p-2 relative z-10"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--chip-surface)] transition-all duration-300 group-hover:bg-[var(--domain-color)] opacity-50" />
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={activeCause.code}
                    onClick={() => handleCellClick(domain.id, activeCause.code)}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                      zIndex: 20,
                      boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.2)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border transition-all cursor-pointer h-full relative z-10"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--domain-color) 15%, transparent)`,
                      borderColor: `color-mix(in srgb, var(--domain-color) 30%, transparent)`,
                    }}
                  >
                    <span className="font-mono font-bold text-lg mb-1 text-[var(--text-primary)]">
                      {causeDef.code}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
