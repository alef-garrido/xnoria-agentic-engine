"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Domain, Cause, Signal, ViewState } from "@/features/cx-tools/shared/types/wheel";

export type ViewMode = "wheel" | "atlas";

interface WheelContextValue {
  viewMode: ViewMode;
  viewState: ViewState;
  selectedDomain: Domain | null;
  selectedCause: Cause | null;
  selectedSignal: Signal | null;
  hoveredLabel: string | null;
  hoveredDomainId: string | null;
  setViewMode: (mode: ViewMode) => void;
  selectDomain: (domain: Domain) => void;
  selectCause: (cause: Cause) => void;
  selectSignal: (signal: Signal) => void;
  resetToHome: () => void;
  setViewState: (state: ViewState) => void;
  setHoveredLabel: (label: string | null) => void;
  setHoveredDomainId: (id: string | null) => void;
}

const WheelContext = createContext<WheelContextValue | null>(null);

export function WheelProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("wheel");
  const [viewState, setViewState] = useState<ViewState>("home");
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedCause, setSelectedCause] = useState<Cause | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [hoveredDomainId, setHoveredDomainId] = useState<string | null>(null);

  const selectDomain = useCallback((domain: Domain) => {
    setSelectedDomain(domain);
    setSelectedCause(null);
    setSelectedSignal(null);
    setViewState("domain");
  }, []);

  const selectCause = useCallback((cause: Cause) => {
    setSelectedCause(cause);
    setSelectedSignal(null);
    setViewState("cause");
  }, []);

  const selectSignal = useCallback((signal: Signal) => {
    setSelectedSignal(signal);
    setViewState("signal");
  }, []);

  const resetToHome = useCallback(() => {
    setSelectedDomain(null);
    setSelectedCause(null);
    setSelectedSignal(null);
    setViewState("home");
    setHoveredLabel(null);
  }, []);

  return (
    <WheelContext.Provider
      value={{
        viewMode,
        viewState,
        selectedDomain,
        selectedCause,
        selectedSignal,
        hoveredLabel,
        hoveredDomainId,
        setViewMode,
        selectDomain,
        selectCause,
        selectSignal,
        resetToHome,
        setViewState,
        setHoveredLabel,
        setHoveredDomainId,
      }}
    >
      {children}
    </WheelContext.Provider>
  );
}

export function useWheel() {
  const ctx = useContext(WheelContext);
  if (!ctx) throw new Error("useWheel must be used within WheelProvider");
  return ctx;
}
