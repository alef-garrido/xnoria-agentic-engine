"use client";

import { useState, useMemo } from "react";
import { getCachedSignals } from "@/lib/radar/domain/signalBuilder";
import { CAUSE_REGISTRY } from "@/lib/radar/domain/causeRegistry";
import { SignalFilters } from "./SignalFilters";
import { SignalGrid } from "./SignalGrid";
import { SignalDetailCard } from "./SignalDetailCard";
import { AnimatePresence, motion } from "framer-motion";
import { CxRadar } from "@/components/cx-radar/CxRadar";
import { RadarSignal } from "@/lib/radar/types/radar";
import type { FlatSignal } from "@/lib/radar/types/signal";

export default function SignalExplorer() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDomain, setSelectedDomain] = useState<string | "ALL">("ALL");
    const [selectedCause, setSelectedCause] = useState<string | "ALL">("ALL");
    const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
    const [focusedSignalId, setFocusedSignalId] = useState<string | null>(null);
    const [hoveredDomainId, setHoveredDomainId] = useState<string | null>(null);

    const allSignals = useMemo(() => getCachedSignals("en"), []);

    const fullDomains = useMemo(() => {
        const seen = new Map<string, FlatSignal>();
        for (const s of allSignals) {
            if (!seen.has(s.domain)) seen.set(s.domain, s);
        }
        return [...seen.values()].map((s) => ({
            id: s.domain,
            name: s.domainName,
            color: s.domainColor,
        }));
    }, [allSignals]);

    const domains = useMemo(() => {
        return fullDomains.map((d) => ({ code: d.id, label: d.name }));
    }, [fullDomains]);

    const radarDomains = useMemo(() => {
        return fullDomains.map((d) => ({
            id: d.id,
            color: d.color,
        }));
    }, [fullDomains]);

    const causes = Object.values(CAUSE_REGISTRY).map((c) => ({
        code: c.code,
        name: c.label,
        label: c.label,
    }));

    const filteredSignals = useMemo(() => {
        return allSignals.filter((sig) => {
            if (selectedDomain !== "ALL" && sig.domain !== selectedDomain) return false;
            if (selectedCause !== "ALL" && sig.causeCode !== selectedCause) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!sig.id.toLowerCase().includes(q) && !sig.label.toLowerCase().includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [allSignals, selectedDomain, selectedCause, searchQuery]);

    const selectedRadarSignals = useMemo<RadarSignal[]>(() => {
        return allSignals
            .filter((s) => selectedSignalIds.includes(s.id))
            .map((s) => ({
                id: s.id,
                label: s.label,
                domain: s.domain,
                cause: s.causeCode,
                level: s.level,
            }));
    }, [allSignals, selectedSignalIds]);

    const handleSignalClick = (id: string) => {
        setSelectedSignalIds((prev) => {
            const isSelected = prev.includes(id);
            if (isSelected) {
                const next = prev.filter((x) => x !== id);
                if (focusedSignalId === id) {
                    setFocusedSignalId(next[next.length - 1] || null);
                }
                return next;
            } else {
                setFocusedSignalId(id);
                return [...prev, id];
            }
        });
    };

    const handleClearAll = () => {
        setSelectedSignalIds([]);
        setFocusedSignalId(null);
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div>
                <h1
                    className="text-2xl md:text-3xl font-bold mb-1"
                    style={{
                        fontFamily: "var(--font-heading)",
                        color: "var(--text-primary)",
                        letterSpacing: "-1.5px",
                    }}
                >
                    CX Signal Radar
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    Symptom-first diagnostic visualization — plot the CX Diagnostic
                    Compass signals by domain and severity.
                </p>
            </div>

            <SignalFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedDomain={selectedDomain}
                setSelectedDomain={setSelectedDomain}
                selectedCause={selectedCause}
                setSelectedCause={setSelectedCause}
                domains={domains}
                causes={causes}
            />

            <div className="flex flex-col lg:flex-row gap-6 min-h-0">
                {/* 1st Column: Signal Selection Grid */}
                <div
                    className="w-full lg:w-[30%] overflow-y-auto max-h-[70vh] lg:max-h-none pr-0 lg:pr-6 lg:border-r pb-4 lg:pb-12"
                    style={{ borderColor: "var(--border)" }}
                >
                    <AnimatePresence mode="popLayout">
                        <SignalGrid
                            key={`${selectedDomain}-${selectedCause}-${searchQuery}`}
                            signals={filteredSignals}
                            selectedSignalIds={selectedSignalIds}
                            onSignalClick={handleSignalClick}
                        />
                    </AnimatePresence>
                </div>

                {/* 2nd Column: Radar Visualization */}
                <div className="w-full lg:w-[40%] flex flex-col pt-4 lg:pt-0">
                    <div
                        className="min-h-[400px] flex items-center justify-center rounded-2xl overflow-hidden shadow-inner"
                        style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
                    >
                        {selectedSignalIds.length === 0 ? (
                            <div className="text-center p-8 max-w-[300px]">
                                <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                                    Select friction points (signals) from the grid to map their
                                    impact on the radar.
                                </p>
                                <div
                                    className="w-16 h-16 mx-auto rounded-full border border-dashed animate-pulse"
                                    style={{ borderColor: "var(--border-strong)" }}
                                />
                            </div>
                        ) : (
                            <CxRadar
                                signals={selectedRadarSignals}
                                domains={radarDomains}
                                hoveredDomainId={hoveredDomainId}
                                onHoverDomain={setHoveredDomainId}
                                interactions={{
                                    onClick: (id) => setFocusedSignalId(id),
                                }}
                            />
                        )}
                    </div>

                    {/* Funnel Legend */}
                    <div
                        className="flex flex-wrap gap-4 items-center justify-center mt-3 text-[10px] uppercase tracking-widest opacity-80 border-t pt-3 w-full"
                        style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
                    >
                        <span className="flex items-center gap-1">
                            <strong style={{ color: "var(--text-secondary)" }}>1</strong> Entry
                        </span>
                        <span className="flex items-center gap-1">
                            <strong style={{ color: "var(--text-secondary)" }}>2</strong> Commitment
                        </span>
                        <span className="flex items-center gap-1">
                            <strong style={{ color: "var(--text-secondary)" }}>3</strong> Usage
                        </span>
                        <span className="flex items-center gap-1">
                            <strong style={{ color: "var(--text-secondary)" }}>4</strong> Engagement
                        </span>
                        <span className="flex items-center gap-1">
                            <strong style={{ color: "var(--text-secondary)" }}>5</strong> Growth
                        </span>
                    </div>

                    {/* Insight Layer */}
                    <AnimatePresence>
                        {selectedSignalIds.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mt-6 p-5 rounded-xl"
                                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4
                                        className="font-bold text-sm"
                                        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                                    >
                                        Diagnostic Insight
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleClearAll}
                                            className="text-[10px] uppercase tracking-widest font-bold transition-colors"
                                            style={{ color: "var(--text-muted)" }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = "var(--text-primary)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = "var(--text-muted)";
                                            }}
                                        >
                                            Clear All
                                        </button>
                                        <span
                                            className="text-xs px-2 py-1 rounded-full font-mono"
                                            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                                        >
                                            {selectedSignalIds.length} ACTIVE
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                                    You have {selectedSignalIds.length} active friction points across{" "}
                                    {new Set(selectedRadarSignals.map((s) => s.domain)).size} lifecycle stages.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3rd Column: Signal Detail Card */}
                <div
                    className="w-full lg:w-[30%] flex flex-col pt-4 lg:pt-0 lg:border-l lg:pl-6 overflow-y-auto max-h-[70vh] lg:max-h-none"
                    style={{ borderColor: "var(--border)" }}
                >
                    <SignalDetailCard
                        signal={allSignals.find((s) => s.id === focusedSignalId) || null}
                        domains={fullDomains}
                        causes={causes}
                    />
                </div>
            </div>
        </div>
    );
}
