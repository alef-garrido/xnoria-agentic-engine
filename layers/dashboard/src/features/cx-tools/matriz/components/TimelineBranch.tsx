"use client";

import React from "react";
import { TimelineNode } from "@/features/cx-tools/matriz/lib/types";
import { TouchpointCard } from "./TouchpointCard";
import { motion } from "framer-motion";

interface TimelineBranchProps {
  node: TimelineNode;
  index: number;
  x: number;
  centerY: number;
  activeLayers: {
    workflows: boolean;
    agent: boolean;
    human: boolean;
  };
  isSVGPass: boolean;
}

export const TimelineBranch: React.FC<TimelineBranchProps> = ({
  node,
  index,
  x,
  centerY,
  activeLayers,
  isSVGPass,
}) => {
  const isTop = node.position.y === 0;

  const gapY = 80; // Branch vertical extension depth
  const startCurve = gapY * 0.5; // Smoothness anchor

  // Custom S-curve path for the branch.
  const sPath = isTop
    ? `M ${x} ${centerY} C ${x} ${centerY - startCurve} ${x} ${centerY - gapY + startCurve} ${x} ${centerY - gapY}`
    : `M ${x} ${centerY} C ${x} ${centerY + startCurve} ${x} ${centerY + gapY - startCurve} ${x} ${centerY + gapY}`;

  if (isSVGPass) {
    return (
      <g>
        {/* The Branch Line */}
        <motion.path
          d={sPath}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
          stroke={node.stageColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* The Node on the Timeline */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <circle
            cx={x}
            cy={centerY}
            r="12"
            fill="var(--bg)"
            stroke={node.stageColor}
            strokeWidth="3"
          />
          <text
            x={x}
            y={centerY + 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill={node.stageColor}
          >
            {node.localIndex}
          </text>
        </motion.g>
      </g>
    );
  }

  // HTML Pass
  // Uses translate to align perfectly flush to the curve tip without hardcoded heights
  return (
    <div
      className="absolute z-10 hover:z-50"
      style={{
        left: x - 160, // Centers a 320px width element accurately
        width: 320,
        top: isTop ? centerY - gapY - 12 : centerY + gapY + 12, // 12px breathing room from the line
        transform: isTop ? "translateY(-100%)" : "none",
      }}
    >
      <TouchpointCard tp={node} activeLayers={activeLayers} stageColor={node.stageColor} />
    </div>
  );
};
