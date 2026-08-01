"use client";
import { motion } from "framer-motion";
import { RadarNode, DomainID, RadarConfig } from "@/lib/radar/types/radar";
import { cxTokens } from "@/lib/radar/theme/cxTokens";

interface RadarHighlightProps {
    nodes: RadarNode[];
    domains: { id: DomainID; color: string }[];
    config: RadarConfig;
    hoveredDomainId?: string | null;
}

export function RadarHighlight({ nodes, domains, config, hoveredDomainId }: RadarHighlightProps) {
    const { center, maxRadius, innerRadius } = config;
    const angleStep = (Math.PI * 2) / domains.length;

    return (
        <g className="radar-highlights">
            {domains.map((domain, i) => {
                const domainNodes = nodes.filter(n => n.domain === domain.id);

                // Highlight only if 2 or more signals in this domain
                if (domainNodes.length < 2) return null;

                const startAngle = i * angleStep - Math.PI / 2;
                const endAngle = (i + 1) * angleStep - Math.PI / 2;

                // SVG Path for an annular sector (arc sector)
                const innerX1 = center + innerRadius * Math.cos(startAngle);
                const innerY1 = center + innerRadius * Math.sin(startAngle);
                const outerX1 = center + maxRadius * Math.cos(startAngle);
                const outerY1 = center + maxRadius * Math.sin(startAngle);
                const outerX2 = center + maxRadius * Math.cos(endAngle);
                const outerY2 = center + maxRadius * Math.sin(endAngle);
                const innerX2 = center + innerRadius * Math.cos(endAngle);
                const innerY2 = center + innerRadius * Math.sin(endAngle);

                const largeArcFlag = angleStep > Math.PI ? 1 : 0;

                const pathData = `
          M ${innerX1} ${innerY1}
          L ${outerX1} ${outerY1}
          A ${maxRadius} ${maxRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
          L ${innerX2} ${innerY2}
          A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}
          Z
        `;

                // Cross-view focus: if a domain is hovered (from any view), boost this domain's highlight
                const isHoveredDomain = hoveredDomainId === domain.id;
                const hasAnyHover = !!hoveredDomainId;
                const targetOpacity = isHoveredDomain
                    ? cxTokens.opacity.base    // boosted
                    : hasAnyHover
                        ? cxTokens.opacity.inactive // dimmed
                        : 0.1;                      // default

                return (
                    <motion.path
                        key={`highlight-${domain.id}`}
                        d={pathData}
                        fill={domain.color}
                        opacity={0}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: targetOpacity }}
                        transition={{ duration: cxTokens.motion.base }}
                    />
                );
            })}
        </g>
    );
}
