"use client";
import { useWheel } from "@/lib/cx-compass/context/WheelContext";
import { useCompassData } from "@/lib/cx-compass/context/CompassDataContext";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs() {
  const { viewState, selectedDomain, selectedCause, selectedSignal, resetToHome, selectDomain, selectCause } = useWheel();
  const { uiStrings } = useCompassData();

  return (
    <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
      <button
        onClick={resetToHome}
        className="hover:underline transition-colors"
        style={{ color: "var(--text-primary)" }}
      >
        {uiStrings.home}
      </button>
      {selectedDomain && (
        <>
          <ChevronRight className="w-3 h-3" style={{ color: "var(--text-primary)" }} />
          <button
            onClick={() => selectDomain(selectedDomain)}
            className="hover:underline transition-colors"
            style={{ color: selectedDomain.color }}
          >
            {selectedDomain.name}
          </button>
        </>
      )}
      {selectedCause && (viewState === "cause" || viewState === "signal") && (
        <>
          <ChevronRight className="w-3 h-3" style={{ color: "var(--text-primary)" }} />
          {viewState === "signal" ? (
            <button
              onClick={() => selectCause(selectedCause)}
              className="hover:underline transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              {selectedCause.name}
            </button>
          ) : (
            <span style={{ color: "var(--text-primary)" }}>
              {selectedCause.name}
            </span>
          )}
        </>
      )}
      {selectedSignal && viewState === "signal" && (
        <>
          <ChevronRight className="w-3 h-3" style={{ color: "var(--text-primary)" }} />
          <span style={{ color: "var(--text-primary)" }}>
            {selectedSignal.name}
          </span>
        </>
      )}
    </nav>
  );
}
