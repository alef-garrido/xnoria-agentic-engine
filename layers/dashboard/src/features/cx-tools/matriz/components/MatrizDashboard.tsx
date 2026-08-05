"use client";

import React, { useState } from "react";
import { MatrizData } from "@/features/cx-tools/matriz/lib/types";
import { LayerControls } from "./LayerControls";
import { TimelineJourney } from "./TimelineJourney";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface MatrizDashboardProps {
  data: MatrizData;
}

export const MatrizDashboard: React.FC<MatrizDashboardProps> = ({ data }) => {
  const t = useTranslations("cxtools");
  const labels = {
    workflows: t("layerWorkflows"),
    agent: t("layerAgent"),
    human: t("layerHuman"),
    title: t("matrizTitle"),
    subtitle: t("matrizSubtitle"),
    footer: t("matrizFooter"),
    efficiency: t("matrizEfficiency"),
    intelligence: t("matrizIntelligence"),
    strategy: t("matrizStrategy"),
  };
  const [activeLayers, setActiveLayers] = useState({
    workflows: true,
    agent: true,
    human: true,
  });

  const toggleLayer = (layer: "workflows" | "agent" | "human") => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  return (
    <div className="flex flex-col bg-[var(--bg)] text-white overflow-hidden rounded-2xl border border-white/10 h-[calc(100vh_-_var(--layout-main-inset-y))]">
      {/* Unified Header */}
      <div className="px-6 py-4 shrink-0 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent"
            >
              {labels.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-white/40 mt-1 font-medium uppercase tracking-[0.2em]"
            >
              {labels.subtitle}
            </motion.p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LayerControls activeLayers={activeLayers} toggleLayer={toggleLayer} labels={labels} />
        </div>
      </div>

      {/* Main Grid -> Now Timeline */}
      <TimelineJourney data={data} activeLayers={activeLayers} />

      {/* Footer Info */}
      <div className="p-6 text-[10px] text-white/20 border-t border-white/5 flex justify-between items-center">
        <span>{labels.footer}</span>
        <div className="flex gap-4 uppercase tracking-[0.1em]">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {labels.efficiency}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> {labels.intelligence}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {labels.strategy}
          </span>
        </div>
      </div>
    </div>
  );
};
