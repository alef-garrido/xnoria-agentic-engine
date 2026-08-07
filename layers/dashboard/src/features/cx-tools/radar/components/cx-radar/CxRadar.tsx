"use client";
import { useState } from "react";
import {
  RadarSignal,
  RadarConfig,
  DomainID,
  RadarInteractions,
} from "@/features/cx-tools/shared/types/radar";
import { useRadarLayout } from "@/features/cx-tools/shared/hooks/useRadarLayout";
import { RadarSvg } from "./RadarSvg";
import { RadarGrid } from "./RadarGrid";
import { RadarAxes } from "./RadarAxes";
import { RadarHighlight } from "./RadarHighlight";
import { RadarPoints } from "./RadarPoints";

export interface CxRadarProps {
  signals: RadarSignal[];
  domains: { id: DomainID; color: string }[];
  config?: Partial<RadarConfig>;
  interactions?: RadarInteractions;
  /** Cross-view domain hover from WheelContext */
  hoveredDomainId?: string | null;
  /** Setter for cross-view domain hover */
  onHoverDomain?: (id: string | null) => void;
}

export function CxRadar({
  signals,
  domains,
  config,
  interactions,
  hoveredDomainId,
  onHoverDomain,
}: CxRadarProps) {
  // Default Config Merge
  const mergedConfig: RadarConfig = {
    size: 500,
    center: 250,
    maxRadius: 200,
    innerRadius: 40,
    domainCount: domains.length,
    ...config,
  };

  // Radar Mapping Engine execution via Hook
  const nodes = useRadarLayout({
    signals,
    domains,
    config: mergedConfig,
  });

  // Local state for hovering to drive visual focus modes internally
  const [internalHoverId, setInternalHoverId] = useState<string | null>(null);

  // Wrap interaction to notify upstream while keeping internal state
  const handleHover = (signalId: string | null) => {
    setInternalHoverId(signalId);
    interactions?.onHover?.(signalId);

    // Cross-view: when hovering a signal, highlight its domain
    if (signalId && onHoverDomain) {
      const node = nodes.find((n) => n.id === signalId);
      onHoverDomain(node?.domain || null);
    } else if (!signalId && onHoverDomain) {
      onHoverDomain(null);
    }
  };

  const radarInteractions: RadarInteractions = {
    ...interactions,
    onHover: handleHover,
  };

  return (
    <RadarSvg config={mergedConfig}>
      {/* 1. Subtle domain highlighting arcs (behind everything) */}
      <RadarHighlight
        nodes={nodes}
        domains={domains}
        config={mergedConfig}
        hoveredDomainId={hoveredDomainId}
      />

      {/* 2. Grid (circles) */}
      <RadarGrid config={mergedConfig} />

      {/* 3. Domain separator lines */}
      <RadarAxes domains={domains} config={mergedConfig} />

      {/* 4. Active Signal Points */}
      <RadarPoints
        nodes={nodes}
        interactions={radarInteractions}
        hoveredSignalId={internalHoverId}
        hoveredDomainId={hoveredDomainId}
      />
    </RadarSvg>
  );
}
