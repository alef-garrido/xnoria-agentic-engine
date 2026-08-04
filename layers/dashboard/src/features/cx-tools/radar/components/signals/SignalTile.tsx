"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FlatSignal } from "@/features/cx-tools/shared/types/signal";
import { getCauseMeta } from "@/features/cx-tools/shared/domain/causeRegistry";
import { Check } from "lucide-react";

interface SignalTileProps {
    signal: FlatSignal;
    isSelected: boolean;
    onClick: (id: string) => void;
}

const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

export function SignalTile({ signal, isSelected, onClick }: SignalTileProps) {
    const causeMeta = getCauseMeta(signal.causeCode);
    const color = signal.domainColor;

    return (
        <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.04, backgroundColor: isSelected ? color : `${color}30` }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onClick(signal.id)}
            className="flex flex-col text-left p-5 rounded-xl border transition-colors w-full h-full relative overflow-hidden group"
            style={{
                backgroundColor: isSelected
                    ? `color-mix(in srgb, ${color} 40%, transparent)`
                    : `color-mix(in srgb, ${color} 15%, transparent)`,
                borderColor: isSelected ? "var(--accent)" : `color-mix(in srgb, ${color} 30%, transparent)`,
                boxShadow: isSelected ? `0px 4px 12px ${color}40` : "0px 2px 4px rgba(0,0,0,0.05)"
            }}
        >
            <div className="flex justify-between items-start w-full mb-3">
                {/* Primary: Signal Code */}
                <div
                    className="font-mono text-[11px] font-bold tracking-wider px-2 py-1 rounded-md shadow-sm inline-block w-fit border-l-[3px]"
                    style={{ borderLeftColor: color, color: "var(--text-primary)" }}
                >
                    {signal.id}
                </div>
                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="p-0.5 rounded-full shadow-lg z-10"
                            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                        >
                            <Check size={14} strokeWidth={3} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Secondary: Signal Description */}
            <div
                className="text-lg font-bold tracking-tight mb-4 flex-1 leading-tight z-10"
                style={{ color: "var(--text-primary)" }}
            >
                {signal.label}
            </div>

            {/* Context: Cause + Domain Label */}
            <div
                className="flex flex-col gap-1.5 mt-auto pt-4 border-t w-full z-10"
                style={{ borderColor: "var(--border)" }}
            >
                <span
                    className="text-[10px] uppercase font-bold tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                >
                    {signal.domainName}
                </span>
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] uppercase font-bold tracking-wider"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {causeMeta.label}
                    </span>
                </div>
            </div>
        </motion.button>
    );
}
