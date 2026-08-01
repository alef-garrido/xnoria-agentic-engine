"use client";
import { motion } from "framer-motion";
import type { Signal } from "@/lib/cx-compass/types/wheel";

interface FunnelGlyphProps {
    signals: Signal[];
    color: string;
}

const lines = [
    { id: "line1", label: "Entry", match: ["ACQ", "ADQ"] },
    { id: "line2", label: "Commitment", match: ["SAL", "VTA"] },
    { id: "line3", label: "Usage", match: ["ONB", "PRD", "PRO", "SUP", "SOP"] },
    { id: "line4", label: "Engagement", match: ["COM", "RET"] },
    { id: "line5", label: "Growth", match: ["EXP"] }
];

export function FunnelGlyph({ signals, color }: FunnelGlyphProps) {
    // Dimensions
    const width = 160;
    const height = 200;
    const topWidth = 140;
    const bottomWidth = 80;
    const paddingY = 20; // top / bottom padding
    const activeHeight = height - paddingY * 2;
    const lineSpacing = activeHeight / (lines.length - 1);

    return (
        <div className="flex justify-center items-center py-4 cursor-default">
            <svg width={width} height={height} className="overflow-visible select-none">

                {/* Draw Funnel Lines */}
                {lines.map((lineDef, i) => {
                    const y = paddingY + i * lineSpacing;

                    // Calculate width at current level to interpolate
                    const currentWidth = topWidth - (topWidth - bottomWidth) * (i / (lines.length - 1));
                    const lineStartX = (width - currentWidth) / 2;
                    const lineEndX = width - lineStartX;
                    const paddingX = 10;

                    // Filter signals for this line
                    const lineSignals = signals.filter(s => {
                        const prefix = s.id.split("_")[0];
                        return lineDef.match.includes(prefix);
                    });

                    return (
                        <g key={lineDef.id}>
                            {/* Domain Label */}
                            <text
                                x={lineStartX - 5}
                                y={y - 8}
                                fontSize="9"
                                fill="var(--text-secondary)"
                                fontWeight="600"
                                opacity="0.6"
                            >
                                {lineDef.label}
                            </text>

                            {/* Horizontal Line */}
                            <line
                                x1={lineStartX}
                                y1={y}
                                x2={lineEndX}
                                y2={y}
                                stroke={color}
                                opacity="0.3"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />

                            {/* Signals for this line */}
                            {lineSignals.map((signal, sIndex) => {
                                const totalInLevel = lineSignals.length;
                                const minX = lineStartX + paddingX;
                                const maxX = lineEndX - paddingX;

                                // Deterministic horizontal positioning
                                // If only 1 signal, put in center. Otherwise spread evenly.
                                let cx = width / 2;
                                if (totalInLevel > 1) {
                                    cx = minX + (maxX - minX) * (sIndex / (totalInLevel - 1));
                                }

                                // Example scale: low severity -> 6px, medium -> 10px, high -> 14px
                                const sev = signal.severity ?? 0.5;
                                const size = 6 + sev * 8;

                                // Determine opacity (0.5 -> 0.9)
                                const opacity = 0.5 + sev * 0.4;

                                return (
                                    <motion.circle
                                        key={signal.id}
                                        cx={cx}
                                        cy={y}
                                        r={size}
                                        fill={color}
                                        initial={{ y: -8, opacity: 0 }}
                                        animate={{ y: 0, opacity: opacity }}
                                        transition={{ delay: i * 0.05 + sIndex * 0.05, duration: 0.4, ease: "easeOut" }}
                                        whileHover={{ scale: 1.08 }}
                                        style={{ originX: `${cx}px`, originY: `${y}px` }}
                                    >
                                        <title>{signal.name} (Severity: {sev})</title>
                                    </motion.circle>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
