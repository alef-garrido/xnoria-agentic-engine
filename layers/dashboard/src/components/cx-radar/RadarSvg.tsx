"use client";
import { RadarConfig } from "@/lib/radar/types/radar";

interface RadarSvgProps {
    config: RadarConfig;
    children: React.ReactNode;
}

export function RadarSvg({ config, children }: RadarSvgProps) {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg
                width={config.size}
                height={config.size}
                viewBox={`0 0 ${config.size} ${config.size}`}
                strokeLinecap="round" // Gives nicer ends to axes
                strokeLinejoin="round"
                className="overflow-visible"
            >
                {children}
            </svg>
        </div>
    );
}
