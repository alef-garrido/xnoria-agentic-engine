"use client";
import { compassTokens } from "@/features/cx-tools/compass/theme/compassTokens";

interface CompassRingProps {
  radius: number;
}

export default function CompassRing({ radius }: CompassRingProps) {
  const numRings = compassTokens.innerGrid?.count || 4;

  const rings = Array.from({ length: numRings }).map((_, i) => (
    <circle
      key={`inner-ring-${i}`}
      cx={0}
      cy={0}
      r={radius * ((i + 1) / (numRings + 1))}
      fill="none"
      stroke="var(--foreground)"
      strokeWidth={compassTokens.innerGrid?.strokeWidth || 1}
      opacity={compassTokens.innerGrid?.opacity || 0.05}
    />
  ));

  return (
    <g className="compass-ring" pointerEvents="none">
      {rings}
      {/* Outer Ring */}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={compassTokens.ring.strokeWidth}
        opacity={compassTokens.ring.opacity}
      />
      {/* Inner thin stroke for outer ring */}
      <circle
        cx={0}
        cy={0}
        r={radius - 4}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={1}
        opacity={0.1}
      />
    </g>
  );
}
