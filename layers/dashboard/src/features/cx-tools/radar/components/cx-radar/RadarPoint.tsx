"use client";
import { motion, AnimatePresence } from "framer-motion";
import { RadarNode, RadarInteractions } from "@/features/cx-tools/shared/types/radar";
import { radarPointAnimation } from "@/features/cx-tools/shared/hooks/useRadarAnimation";
import { radarTokens } from "@/features/cx-tools/shared/theme/radarTokens";

interface RadarPointProps {
  node: RadarNode;
  index: number; // for staggering animation delays
  interactions?: RadarInteractions;
  isHovered?: boolean;
  isDimmed?: boolean;
}

export function RadarPoint({
  node,
  index,
  interactions,
  isHovered = false,
  isDimmed = false,
}: RadarPointProps) {
  // Resolve dimensions
  const radius = isHovered ? radarTokens.point.hoverRadius : radarTokens.point.baseRadius;

  // Resolve opacity
  let opacity = 1; // base
  if (isHovered) {
    opacity = 1;
  } else if (isDimmed) {
    opacity = radarTokens.opacity.dimmed;
  }

  // Soft glow specifically for the hovered state
  const filter = isHovered ? `drop-shadow(0 0 6px ${node.color})` : undefined;

  return (
    <g
      onMouseEnter={() => interactions?.onHover?.(node.id)}
      onMouseLeave={() => interactions?.onHover?.(null)}
      onClick={() => interactions?.onClick?.(node.id)}
      className="cursor-pointer"
    >
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={radius}
        fill={node.color}
        stroke={isHovered ? "#fff" : "none"}
        strokeWidth={isHovered ? 1 : 0}
        style={{ filter }}

        // Animation Base
        initial={radarPointAnimation.initial}
        animate={{
          ...radarPointAnimation.animate,
          opacity, // smoothly adapt opacity changes
          cx: node.x,
          cy: node.y,
          r: radius,
        }}
        transition={{
          ...radarPointAnimation.transition,
          delay: index * 0.04, // Stagged entry
        }}
      />

      {/* Premium Hover Typography Layer */}
      <AnimatePresence>
        {isHovered && (
          <motion.text
            initial={{ opacity: 0, y: node.y + radius + 10 }}
            animate={{ opacity: 0.7, y: node.y + radius + 18 }}
            exit={{ opacity: 0, y: node.y + radius + 10 }}
            x={node.x}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="11px"
            letterSpacing="0.03em"
            className="pointer-events-none select-none font-medium drop-shadow-md"
          >
            {node.label}
          </motion.text>
        )}
      </AnimatePresence>
    </g>
  );
}
