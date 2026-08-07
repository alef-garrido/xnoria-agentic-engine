"use client";
import { compassTokens } from "@/features/cx-tools/compass/theme/compassTokens";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import { motion } from "framer-motion";

interface CompassLabelsProps {
  radius: number;
}

export default function CompassLabels({ radius }: CompassLabelsProps) {
  const { selectedDomain } = useWheel();
  const { domainPrefixes, wheelData } = useCompassData();
  const domains = wheelData.domains;

  const numDomains = domains.length;
  const sliceAngle = (Math.PI * 2) / numDomains;
  const labelRadius = radius + compassTokens.tick.major.length + 15;

  return (
    <g className="compass-labels" pointerEvents="none">
      {domains.map((domain, i) => {
        const midAngle = (i + 0.5) * sliceAngle;
        const midAngleDeg = (midAngle * 180) / Math.PI;

        const prefix = domainPrefixes[domain.id] || domain.name.slice(0, 3).toUpperCase();
        const isActive = selectedDomain?.id === domain.id;

        return (
          <g
            key={`label-${domain.id}`}
            // We translate the label up to the outer perimeter, then un-rotate it mathematically
            // so the text always reads straight horizontally on screen (since the parent SVG will spin!)
            // Wait, the parent SVG rotates, which rotates the labels. The translation needs to counteract the SVG's current rotation if we want it strictly upright!
            // For purely visual instrument styles, having the text rotate with the instrument looks incredibly authentic.
            transform={`rotate(${midAngleDeg}, 0, 0) translate(0, ${-labelRadius})`}
          >
            <motion.text
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--foreground)"
              fontSize={compassTokens.label.size}
              letterSpacing={compassTokens.label.tracking}
              fontFamily="'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
              fontWeight={600}
              animate={{ opacity: isActive ? 1 : compassTokens.label.opacity }}
              transition={{ duration: 0.3 }}
              transform={`rotate(${-midAngleDeg}, 0, 0)`}
            >
              {prefix}
            </motion.text>
          </g>
        );
      })}
    </g>
  );
}
