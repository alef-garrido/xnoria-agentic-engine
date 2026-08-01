"use client";

import { CompassDataProvider, useCompassData } from "@/lib/cx-compass/context/CompassDataContext";
import { WheelProvider, useWheel } from "@/lib/cx-compass/context/WheelContext";
import { cxTokens } from "@/lib/radar/theme/cxTokens";
import WheelChart from "./WheelChart";
import CXCauseAtlas from "./CXCauseAtlas";
import DetailPanel from "./DetailPanel";
import Breadcrumbs from "./Breadcrumbs";
import Legend from "./Legend";
import SearchBar from "./SearchBar";
import { motion, AnimatePresence } from "framer-motion";

function ViewToggle({ compact = false }: { compact?: boolean }) {
  const { viewMode, setViewMode } = useWheel();

  const modes: { id: "wheel" | "atlas"; label: string }[] = [
    { id: "wheel", label: "CX Compass" },
    { id: "atlas", label: "CX Cause Atlas" },
  ];

  return (
    <div
      className={`flex items-center bg-black/40 rounded-full border border-white/10 relative ${compact ? "w-full" : "p-1"}`}
    >
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setViewMode(mode.id)}
          className={`relative px-4 py-1.5 text-sm font-semibold tracking-wide rounded-full transition-colors z-10 ${compact ? "flex-1" : ""} ${viewMode === mode.id ? "text-white" : "text-white/60 hover:text-white"}`}
        >
          {viewMode === mode.id && (
            <motion.div
              layoutId={compact ? "active-view-pill-mobile" : "active-view-pill"}
              className="absolute inset-0 bg-[var(--accent)] rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ zIndex: -1 }}
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
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        height: "calc(100vh - var(--layout-main-inset-y))",
        backgroundColor: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Top Nav Bar */}
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 backdrop-blur-sm z-10 gap-4">
        {/* Left: App Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none" style={{ fontFamily: "var(--font-heading)" }}>
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
      <div className={`flex items-center justify-between px-4 z-10 w-full ${viewMode === "wheel" ? "p-4 min-h-[56px]" : "hidden"}`}>
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
