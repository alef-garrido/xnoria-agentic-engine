"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { FlatSignal } from "@/features/cx-tools/shared/types/signal";
import { SignalTile } from "./SignalTile";

interface SignalGridProps {
    signals: FlatSignal[];
    selectedSignalIds: string[];
    onSignalClick: (id: string) => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03
        }
    }
};

export function SignalGrid({ signals, selectedSignalIds, onSignalClick }: SignalGridProps) {
    const t = useTranslations("cxtools");
    if (signals.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center p-12 text-sm rounded-xl border border-dashed"
                style={{ color: "var(--text-muted)", borderColor: "var(--border-strong)" }}
            >
                <p>{t("noMatch")}</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 xl:grid-cols-2 gap-3 auto-rows-max"
        >
            {signals.map((signal) => (
                <SignalTile
                    key={signal.id}
                    signal={signal}
                    isSelected={selectedSignalIds.includes(signal.id)}
                    onClick={onSignalClick}
                />
            ))}
        </motion.div>
    );
}
