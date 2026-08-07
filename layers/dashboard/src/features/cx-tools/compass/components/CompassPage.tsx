"use client";

import {
  CompassDataProvider,
  useCompassData,
} from "@/features/cx-tools/compass/context/CompassDataContext";
import { WheelProvider, useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { cxTokens } from "@/features/cx-tools/shared/theme/cxTokens";
import WheelChart from "./WheelChart";
import CXCauseAtlas from "./CXCauseAtlas";
import DetailPanel from "./DetailPanel";
import Breadcrumbs from "./Breadcrumbs";
import Legend from "./Legend";
import SearchBar from "./SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

function ViewToggle({ compact = false }: { compact?: boolean }) {
  const { viewMode, setViewMode } = useWheel();
  const t = useTranslations("cxtools");

  const modes: { id: "wheel" | "atlas"; label: string }[] = [
    { id: "wheel", label: t("viewWheel") },
    { id: "atlas", label: t("viewAtlas") },
  ];

  return (
    <div
      className={`flex items-center bg-[var(--overlay-light)] rounded-full border border-[var(--chip-border)] relative ${compact ? "w-full" : "p-1"}`}
    >
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setViewMode(mode.id)}
          className={`relative px-4 py-1.5 text-sm font-semibold tracking-wide rounded-full transition-colors z-10 ${compact ? "flex-1" : ""} ${viewMode === mode.id ? "text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          {viewMode === mode.id && (
            <motion.div
              layoutId={compact ? "active-view-pill-mobile" : "active-view-pill"}
              className="absolute inset-0 bg-[var(--accent)] rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function CompassContent() {
  const { wheelData } = useCompassData();
  const { viewMode } = useWheel();

  return (
    <div className="relative flex flex-col overflow-hidden h-[calc(100vh_-_var(--layout-main-inset-y))] bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Top Nav Bar */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface)]/40 backdrop-blur-sm z-10 gap-4">
        {/* Left: App Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none font-[var(--font-heading)]">
            {wheelData.wheel_name}
          </h1>
        </div>

        {/* Center: View Toggle (Segmented Control) */}
        <div className="hidden sm:block">
          <ViewToggle />
        </div>

        {/* Right: Utilities */}
        <div className="flex items-center gap-2">
          <Legend />
          <div className="w-48 hidden md:block">
            <SearchBar />
          </div>
        </div>
      </header>

      {/* Sub Header for Breadcrumbs */}
      <div
        className={`flex items-center justify-between px-4 z-10 w-full ${viewMode === "wheel" ? "p-4 min-h-[56px]" : "hidden"}`}
      >
        <Breadcrumbs />
      </div>

      {/* Mobile View Toggle */}
      <div className="sm:hidden flex px-4 pb-4">
        <ViewToggle compact />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === "atlas" ? (
            <motion.div
              key="atlas"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: cxTokens.motion.base }}
              className="w-full h-full"
            >
              <CXCauseAtlas />
            </motion.div>
          ) : (
            <motion.div
              key="wheel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: cxTokens.motion.base }}
              className="w-full h-full"
            >
              <WheelChart />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail panel overlay */}
      <DetailPanel />
    </div>
  );
}

export default function CompassPage() {
  return (
    <CompassDataProvider>
      <WheelProvider>
        <CompassContent />
      </WheelProvider>
    </CompassDataProvider>
  );
}
