"use client";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import type { Signal } from "@/features/cx-tools/shared/types/wheel";
import { getSliceGeometry } from "@/features/cx-tools/compass/utils/geometry";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface SignalSliceProps {
  signal: Signal;
  domainColor: string;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  index: number;
  wheelRotation: number;
}

export default function SignalSlice({
  signal,
  domainColor,
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  index,
  wheelRotation,
}: SignalSliceProps) {
  const { selectSignal, setHoveredLabel } = useWheel();
  const t = useTranslations("cxtools");

  const { pathD, labelX, labelY, rotDeg, flipLabel } = getSliceGeometry({
    startAngle,
    endAngle,
    innerRadius,
    outerRadius,
    wheelRotation,
  });

  return (
    <motion.g
      className="cursor-pointer outline-none group"
      onClick={() => selectSignal(signal)}
      onMouseEnter={() => setHoveredLabel(`${signal.id}`)}
      onMouseLeave={() => setHoveredLabel(null)}
      role="button"
      aria-label={t("signalAria", { name: signal.name, id: signal.id })}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: "easeOut" }}
    >
      <motion.path
        d={pathD}
        fill={domainColor}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1, scale: 1.01 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      {/* Optional: we can draw the Signal ID text if the slice is wide enough, but for now we rely on the hover text in CenterHub */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={10}
        fontWeight={700}
        fontFamily="'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
        letterSpacing="0.05em"
        opacity={0.9}
        transform={`rotate(${flipLabel ? rotDeg + 180 : rotDeg}, ${labelX}, ${labelY})`}
        className="pointer-events-none select-none"
      >
        {signal.id.split("_").pop()}
      </text>
    </motion.g>
  );
}
