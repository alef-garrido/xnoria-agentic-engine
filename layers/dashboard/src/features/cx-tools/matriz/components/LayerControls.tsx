"use client";

import React from "react";
import { Settings, Brain, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface LayerControlsProps {
  activeLayers: {
    workflows: boolean;
    agent: boolean;
    human: boolean;
  };
  toggleLayer: (layer: "workflows" | "agent" | "human") => void;
  labels: {
    workflows: string;
    agent: string;
    human: string;
  };
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  activeLayers,
  toggleLayer,
  labels,
}) => {
  const t = useTranslations("cxtools");
  const controls = [
    {
      id: "workflows" as const,
      label: labels.workflows,
      icon: Settings,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      activeBg: "bg-blue-500",
    },
    {
      id: "agent" as const,
      label: labels.agent,
      icon: Brain,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
      activeBg: "bg-purple-500",
    },
    {
      id: "human" as const,
      label: labels.human,
      icon: User,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20",
      activeBg: "bg-orange-500",
    },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
        {controls.map((control) => {
          const isActive = activeLayers[control.id];
          const Icon = control.icon;

          return (
            <motion.button
              key={control.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleLayer(control.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border mb-2 sm:mb-0",
                isActive
                  ? cn(control.activeBg, "text-white border-transparent shadow-lg shadow-black/20")
                  : cn("bg-transparent text-white/60 border-transparent hover:bg-white/5")
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md transition-colors",
                isActive ? "bg-white/20" : control.bg
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : control.color)} />
              </div>
              <span className="text-sm font-medium">{control.label}</span>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-white/20 rounded-full p-0.5"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {!activeLayers.workflows && !activeLayers.agent && !activeLayers.human && (
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-orange-400/80 text-sm italic"
        >
          {t("matrizNoLayers")}
        </motion.p>
      )}
    </div>
  );
};
