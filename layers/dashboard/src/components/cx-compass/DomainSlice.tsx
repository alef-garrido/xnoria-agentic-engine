"use client";
import { useWheel } from "@/lib/cx-compass/context/WheelContext";
import type { Domain } from "@/lib/cx-compass/types/wheel";
import { useCompassData } from "@/lib/cx-compass/context/CompassDataContext";
import { getSliceGeometry } from "@/lib/cx-compass/utils/geometry";
import { motion } from "framer-motion";

interface DomainSliceProps {
  domain: Domain;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  isSelected: boolean;
  isFaded: boolean;
  wheelRotation: number;
}

export default function DomainSlice({
  domain,
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  isSelected,
  isFaded,
  wheelRotation,
}: DomainSliceProps) {
  // Get the wheel rotation context
  const { selectDomain, setHoveredLabel, setHoveredDomainId } = useWheel();
  const { domainPrefixes } = useCompassData();

  const { pathD, labelX, labelY, rotDeg, flipLabel, showLabel } = getSliceGeometry({
    startAngle,
    endAngle,
    innerRadius,
    outerRadius,
    wheelRotation,
  });

  const prefix = domainPrefixes[domain.id] || domain.name.slice(0, 3).toUpperCase();

  return (
    <motion.g
      className="cursor-pointer outline-none"
      onClick={() => selectDomain(domain)}
      onMouseEnter={() => { setHoveredLabel(domain.name); setHoveredDomainId(prefix); }}
      onMouseLeave={() => { setHoveredLabel(null); setHoveredDomainId(null); }}
      role="button"
      aria-label={`Domain: ${domain.name}`}
      initial={false}
      animate={{ opacity: isFaded ? 0.15 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.path
        d={pathD}
        fill={domain.color}
        fillOpacity={isSelected ? 0.6 : 0.25}
        stroke={domain.color}
        strokeWidth={2}
        strokeOpacity={isSelected ? 1 : 0.6}
        initial={false}
        whileHover={!isFaded ? {
          filter: "brightness(1.25) saturate(1.2)",
          scale: 1.02
        } : undefined}
        animate={{ filter: "brightness(1) saturate(1)", scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      {showLabel && !isFaded && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#D1D1D6"
          fontSize={24}
          fontWeight={700}
          fontFamily="'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
          letterSpacing="0.05em"
          transform={`rotate(${flipLabel ? rotDeg + 180 : rotDeg}, ${labelX}, ${labelY})`}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {prefix}
        </text>
      )}
    </motion.g>
  );
}
