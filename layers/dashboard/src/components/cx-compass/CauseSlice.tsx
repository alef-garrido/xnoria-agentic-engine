"use client";
import { useWheel } from "@/lib/cx-compass/context/WheelContext";
import type { Cause } from "@/lib/cx-compass/types/wheel";
import { getSliceGeometry } from "@/lib/cx-compass/utils/geometry";
import { lightenColor } from "@/lib/cx-compass/utils/color";
import { motion } from "framer-motion";

interface CauseSliceProps {
  cause: Cause;
  domainColor: string;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  index: number;
  wheelRotation: number;
}

export default function CauseSlice({
  cause,
  domainColor,
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  index,
  wheelRotation,
}: CauseSliceProps) {
  const { selectCause, setHoveredLabel } = useWheel();

  const { pathD, labelX, labelY, rotDeg, flipLabel } = getSliceGeometry({
    startAngle,
    endAngle,
    innerRadius,
    outerRadius,
    wheelRotation,
  });

  const causeColor = lightenColor(domainColor, 0.4 + index * 0.1) || domainColor;

  return (
    <motion.g
      className="cursor-pointer outline-none"
      onClick={() => selectCause(cause)}
      onMouseEnter={() => setHoveredLabel(`${cause.code} — ${cause.name}`)}
      onMouseLeave={() => setHoveredLabel(null)}
      role="button"
      aria-label={`Cause: ${cause.name} (${cause.code})`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
    >
      <motion.path
        d={pathD}
        fill={causeColor}
        stroke="transparent"
        strokeWidth={0}
        whileHover={{
          filter: "brightness(1.25) saturate(1.15)",
          scale: 1.03
        }}
        animate={{ filter: "brightness(1) saturate(1)", scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#D1D1D6"
        fontSize={18}
        fontWeight={600}
        fontFamily="'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
        letterSpacing="0.03em"
        transform={`rotate(${flipLabel ? rotDeg + 180 : rotDeg}, ${labelX}, ${labelY})`}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {cause.code.split("-")[1] || cause.code}
      </text>
    </motion.g>
  );
}
