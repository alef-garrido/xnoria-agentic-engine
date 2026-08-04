"use client";
import { RadarConfig, DomainID } from "@/features/cx-tools/shared/types/radar";
import { radarTokens } from "@/features/cx-tools/shared/theme/radarTokens";

interface RadarAxesProps {
    domains: { id: DomainID }[];
    config: RadarConfig;
}

export function RadarAxes({ domains, config }: RadarAxesProps) {
    const { center, maxRadius, innerRadius } = config;
    const angleStep = (Math.PI * 2) / domains.length;

    return (
        <g className="radar-axes">
            {domains.map((domain, i) => {
                const angle = i * angleStep - Math.PI / 2; // match mapping offset

                // Start line from inner radius (leaving a neutral center dead zone)
                const x1 = center + innerRadius * Math.cos(angle);
                const y1 = center + innerRadius * Math.sin(angle);

                // Extend line to the outer maximum boundary
                const x2 = center + maxRadius * Math.cos(angle);
                const y2 = center + maxRadius * Math.sin(angle);

                return (
                    <line
                        key={`axis-${domain.id}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={radarTokens.axes.stroke}
                        strokeWidth={radarTokens.axes.strokeWidth}
                        className="transition-opacity duration-300"
                    />
                );
            })}
        </g>
    );
}
