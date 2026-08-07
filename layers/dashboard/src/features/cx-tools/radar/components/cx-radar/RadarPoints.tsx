"use client";
import { RadarNode, RadarInteractions } from "@/features/cx-tools/shared/types/radar";
import { RadarPoint } from "./RadarPoint";

interface RadarPointsProps {
  nodes: RadarNode[];
  interactions?: RadarInteractions;
  hoveredSignalId?: string | null;
  hoveredDomainId?: string | null;
}

export function RadarPoints({
  nodes,
  interactions,
  hoveredSignalId,
  hoveredDomainId,
}: RadarPointsProps) {
  // Sort nodes so hovered point renders last (on top)
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.id === hoveredSignalId) return 1;
    if (b.id === hoveredSignalId) return -1;
    return 0;
  });

  return (
    <g className="radar-points">
      {sortedNodes.map((node, i) => {
        const isHovered = hoveredSignalId === node.id;
        let isDimmed = false;

        // Signal-level hover dimming (original behavior)
        if (hoveredSignalId) {
          const hoveredNode = nodes.find((n) => n.id === hoveredSignalId);
          if (hoveredNode && hoveredNode.domain !== node.domain) {
            isDimmed = true;
          }
        }

        // Cross-view domain hover dimming
        if (!isDimmed && hoveredDomainId && hoveredDomainId !== node.domain) {
          isDimmed = true;
        }

        return (
          <RadarPoint
            key={node.id}
            node={node}
            index={i}
            interactions={interactions}
            isHovered={isHovered}
            isDimmed={isDimmed}
          />
        );
      })}
    </g>
  );
}
