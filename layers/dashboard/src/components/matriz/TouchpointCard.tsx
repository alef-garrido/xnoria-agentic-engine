"use client";

import React from "react";
import { Settings, Brain, User, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Touchpoint, Impact } from "@/lib/matriz/types";

interface TouchpointCardProps {
    tp: Touchpoint;
    activeLayers: {
        workflows: boolean;
        agent: boolean;
        human: boolean;
    };
    stageColor?: string;
}

const ImpactBadge: React.FC<{ impact: Impact }> = ({ impact }) => {
    const colors = {
        low: "bg-green-500/10 text-green-600 border-green-200",
        medium: "bg-blue-500/10 text-blue-600 border-blue-200",
        high: "bg-orange-500/10 text-orange-600 border-orange-200",
        critical: "bg-red-500/10 text-red-600 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    };

    return (
        <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest",
            colors[impact]
        )}>
            {impact}
        </span>
    );
};

export const TouchpointCard: React.FC<TouchpointCardProps> = ({
    tp, activeLayers, stageColor = "#3A86FF",
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{
                opacity: 1,
                y: 0,
                borderColor: tp.state === 'active'
                    ? stageColor
                    : tp.state === 'warning'
                        ? '#ef4444'
                        : '#cbd5e1', // subtle border for idle
            }}
            style={{
                boxShadow: tp.state === 'active'
                    ? `0 0 15px -3px ${stageColor}60`
                    : '0 2px 4px rgba(0,0,0,0.05)',
            }}
            whileHover={{
                y: -4,
                boxShadow: '0 12px 20px -5px rgba(0,0,0,0.2)'
            }}
            transition={{ duration: 0.2 }}
            className="group relative rounded-xl overflow-hidden border-2 bg-white flex flex-col w-full h-full"
        >
            {/* Stage Color Header Bar */}
            <div
                className="h-1.5 w-full shrink-0"
                style={{ backgroundColor: tp.state === 'warning' ? '#ef4444' : stageColor }}
            />

            <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Touchpoint
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">
                            {tp.label}
                        </h4>
                    </div>
                    <ImpactBadge impact={tp.impact} />
                </div>

                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {activeLayers.workflows && tp.layers.workflows && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-blue-50 border border-blue-100"
                            >
                                <div className="p-1 px-1.5 rounded-md bg-blue-500/10">
                                    <Settings className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-[11px] text-slate-600 font-medium leading-[1.3]">
                                    {tp.layers.workflows.text}
                                </span>
                            </motion.div>
                        )}

                        {activeLayers.agent && tp.layers.agent && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-purple-50 border border-purple-100"
                            >
                                <div className="p-1 px-1.5 rounded-md bg-purple-500/10">
                                    <Brain className="w-3 h-3 text-purple-500" />
                                </div>
                                <span className="text-[11px] text-slate-600 font-medium leading-[1.3]">
                                    {tp.layers.agent.text}
                                </span>
                            </motion.div>
                        )}

                        {activeLayers.human && tp.layers.human && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-orange-50 border border-orange-100"
                            >
                                <div className="p-1 px-1.5 rounded-md bg-orange-500/10">
                                    <User className="w-3 h-3 text-orange-500" />
                                </div>
                                <span className="text-[11px] text-slate-600 font-medium leading-[1.3]">
                                    {tp.layers.human.text}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Signals Context Footer - Appears on Hover */}
                {tp.signals && tp.signals.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Zap className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Detected Signals
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {tp.signals.map((signal, idx) => (
                                <span
                                    key={idx}
                                    className="text-[9px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 font-medium"
                                >
                                    {signal}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
