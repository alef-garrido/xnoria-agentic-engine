"use client";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import type { Domain } from "@/features/cx-tools/shared/types/wheel";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import { getSliceGeometry } from "@/features/cx-tools/compass/utils/geometry";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("cxtools");

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
      onMouseEnter={() => {
        setHoveredLabel(domain.name);
        setHoveredDomainId(prefix);
      }}
      onMouseLeave={() => {
        setHoveredLabel(null);
        setHoveredDomainId(null);
      }}
      role="button"
      aria-label={t("domainAria", { name: domain.name })}
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
        whileHover={
          !isFaded
            ? {
                filter: "brightness(1.25) saturate(1.2)",
                scale: 1.02,
              }
            : undefined
        }
        animate={{ filter: "brightness(1) saturate(1)", scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      {showLabel && !isFaded && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-secondary)"
          fontSize={24}
          fontWeight={700}
          fontFamily="'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
          letterSpacing="0.05em"
          transform={`rotate(${flipLabel ? rotDeg + 180 : rotDeg}, ${labelX}, ${labelY})`}
          className="pointer-events-none select-none"
        >
          {prefix}
        </text>
      )}
    </motion.g>
  );
}
