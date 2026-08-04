"use client";
import { compassTokens } from "@/features/cx-tools/compass/theme/compassTokens";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { motion } from "framer-motion";

import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";

interface CompassTicksProps {
    radius: number;
}

export default function CompassTicks({ radius }: CompassTicksProps) {
    const { selectedDomain } = useWheel();
    const { wheelData } = useCompassData();
    const domains = wheelData.domains;
    const numDomains = domains.length;
    const sliceAngle = (Math.PI * 2) / numDomains;

    return (
        <g className="compass-ticks" pointerEvents="none">
            {domains.map((domain, i) => {
                const midAngleDeg = ((i + 0.5) * sliceAngle * 180) / Math.PI;
                const boundaryAngleDeg = (i * sliceAngle * 180) / Math.PI;

                return (
                    <g key={domain.id}>
                        {/* Minor Tick on the boundary */}
                        <line
                            x1={0}
                            y1={-radius}
                            x2={0}
                            y2={-(radius + compassTokens.tick.minor.length)}
                            stroke="#FFFFFF"
                            strokeWidth={compassTokens.tick.minor.width}
                            opacity={compassTokens.tick.minor.opacity}
                            transform={`rotate(${boundaryAngleDeg}, 0, 0)`}
                        />
                        {/* Major Tick at the domain center */}
                        <motion.line
                            x1={0}
                            y1={-radius}
                            x2={0}
                            y2={-(radius + compassTokens.tick.major.length)}
                            stroke="#FFFFFF"
                            strokeWidth={compassTokens.tick.major.width}
                            animate={{ opacity: selectedDomain?.id === domain.id ? 0.8 : compassTokens.tick.major.opacity }}
                            transform={`rotate(${midAngleDeg}, 0, 0)`}
                        />
                    </g>
                );
            })}
        </g>
    );
}
