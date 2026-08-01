"use client";
import { RadarConfig } from "@/lib/radar/types/radar";
import { radarTokens } from "@/lib/radar/theme/radarTokens";

interface RadarGridProps {
    config: RadarConfig;
}

export function RadarGrid({ config }: RadarGridProps) {
    const rings = 5;
    const { center, maxRadius, innerRadius } = config;
    const radiusStep = (maxRadius - innerRadius) / rings;

    // Generate an array of ring radii [innerRadius + step, ... maxRadius]
    const ringRadii = Array.from({ length: rings }, (_, i) => innerRadius + radiusStep * (i + 1));

    return (
        <g className="radar-grid">
            {ringRadii.map((r, i) => (
                <g key={`grid-ring-${i}`}>
                    <circle
                        cx={center}
                        cy={center}
                        r={r}
                        fill="none"
                        stroke={radarTokens.grid.stroke}
                        strokeWidth={radarTokens.grid.strokeWidth}
                    />
                    <text
                        x={center}
                        y={center - r - 4} // Positioned slightly above the ring at 12 o'clock
                        fill="rgba(255, 255, 255, 0.4)" // Subtle text so it doesn't fight the points
                        fontSize="9px"
                        letterSpacing="0.05em"
                        textAnchor="middle"
                        className="select-none pointer-events-none uppercase font-mono"
                    >
                        {i + 1}
                    </text>
                </g>
            ))}
        </g>
    );
}
