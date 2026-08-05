"use client";
import { compassTokens } from "@/features/cx-tools/compass/theme/compassTokens";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { motion } from "framer-motion";

import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";

interface CompassNeedleProps {
  radius: number;
}

export default function CompassNeedle({ radius }: CompassNeedleProps) {
  const { selectedDomain, selectedCause, viewState } = useWheel();
  const { wheelData } = useCompassData();
  const domains = wheelData.domains;

  if (viewState === "home" || !selectedDomain) return null;

  let targetAngle = 0;

  const domainIndex = domains.findIndex((d) => d.id === selectedDomain.id);
  const sliceAngle = (Math.PI * 2) / domains.length;

  if (selectedCause && (viewState === "cause" || viewState === "signal")) {
    const causes = selectedDomain.causes;
    const causeIndex = causes.findIndex((c) => c.id === selectedCause.id);
    const domainStart = domainIndex * sliceAngle;
    const causeAngle = sliceAngle / causes.length;
    targetAngle = ((domainStart + (causeIndex + 0.5) * causeAngle) * 180) / Math.PI;
  } else {
    targetAngle = ((domainIndex + 0.5) * sliceAngle * 180) / Math.PI;
  }

  return (
    <motion.g
      animate={{ rotate: targetAngle }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      pointerEvents="none"
    >
      <path
        d={`M -5 ${-radius} L 5 ${-radius} L 0 ${-radius + 20} Z`}
        fill="#FFFFFF"
        opacity={compassTokens.needle.opacity}
      />
      {/* Outer chevron marker */}
      <path
        d={`M -8 ${-radius - 2} L 0 ${-radius - 12} L 8 ${-radius - 2}`}
        stroke="#FFFFFF"
        strokeWidth={compassTokens.needle.width}
        fill="none"
        opacity={0.8}
        strokeLinecap="round"
      />
    </motion.g>
  );
}
