"use client";

import React from "react";
import { MatrizData, TimelineNode } from "@/lib/matriz/types";
import { TimelineBranch } from "./TimelineBranch";
import { motion } from "framer-motion";

interface TimelineJourneyProps {
  data: MatrizData;
  activeLayers: {
    workflows: boolean;
    agent: boolean;
    human: boolean;
  };
}

export const TimelineJourney: React.FC<TimelineJourneyProps> = ({ data, activeLayers }) => {
  // Flatten stages into nodes with global stage indexing
  const nodes: TimelineNode[] = data.touchpoints.map((tp) => {
    const stage = data.journey.find(s => s.id === tp.stage);
    return {
      ...tp,
      stageColor: stage?.color || "#ffffff",
      stageLabel: stage?.label || "Unknown",
      localIndex: stage?.order || 1
    };
  });

  const nodeGap = 350; // Horizontal gap between touchpoints (Columns)
  // Ensure enough width based on the maximum X position found in the data
  const maxCols = Math.max(...nodes.map(n => n.position.x), data.journey.length);
  const totalWidth = maxCols * nodeGap + 100;
  const centerY = 300; // Compact center line perfectly adapted to the new gapY scale

  // Calculate distinct stage segments for the main axis line
  const timelineSegments: { x1: number, x2: number, color: string, label: string, labelYOffset: number }[] = [];
  let currentStartX = 50;

  data.journey.forEach((stage) => {
    const segmentWidth = nodeGap; // Each stage gets a standardized column width
    const stageNodes = nodes.filter(n => n.stage === stage.id);
    // If branch goes UP (y=0), move text DOWN (+20). If branch goes DOWN (y=1), move text UP (-10).
    const isTopCard = stageNodes.length > 0 && stageNodes[0].position.y === 0;

    timelineSegments.push({
      x1: currentStartX,
      x2: currentStartX + segmentWidth,
      color: stage.color,
      label: stage.label,
      labelYOffset: isTopCard ? 24 : -12
    });
    currentStartX += segmentWidth;
  });

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto flex items-center h-full">
      <div
        className="relative shrink-0"
        style={{ width: totalWidth, height: '600px' }}
      >
        {/* SVG Layer for the central axis and branches */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height="100%"
        >
          {/* Main Axis with Stage Domains */}
          {timelineSegments.map((seg, i) => (
            <g key={`seg-${i}`}>
              <motion.line
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
                x1={seg.x1}
                y1={centerY}
                x2={seg.x2}
                y2={centerY}
                stroke={seg.color}
                strokeWidth="4"
                strokeLinecap={i === 0 || i === timelineSegments.length - 1 ? "round" : "butt"}
              />
              {/* Domain Label on the Timeline */}
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
                x={seg.x1 + (seg.x2 - seg.x1) / 2}
                y={centerY + seg.labelYOffset}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={seg.color}
                opacity={0.7}
                className="uppercase tracking-widest"
              >
                {seg.label}
              </motion.text>
            </g>
          ))}

          {/* Base gradient line for visual continuity behind */}
          <motion.line
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 1 }}
            x1="50" y1={centerY} x2={currentStartX} y2={centerY}
            stroke="#ffffff" strokeWidth="6" strokeLinecap="round"
          />

          {/* Render Branches (Lines) */}
          {nodes.map((node, i) => {
            const nodeX = 50 + (node.position.x - 0.5) * nodeGap; // Place exactly in the center of the X block
            return (
              <TimelineBranch
                key={node.id}
                node={node}
                index={i}
                x={nodeX}
                centerY={centerY}
                activeLayers={activeLayers}
                isSVGPass={true}
              />
            );
          })}
        </svg>

        {/* HTML Layer for cards */}
        <div className="absolute inset-0">
          {nodes.map((node, i) => {
            const nodeX = 50 + (node.position.x - 0.5) * nodeGap;
            return (
              <TimelineBranch
                key={node.id}
                node={node}
                index={i}
                x={nodeX}
                centerY={centerY}
                activeLayers={activeLayers}
                isSVGPass={false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
