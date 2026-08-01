import { RadarSignal, RadarNode, RadarConfig, DomainID } from "@/lib/radar/types/radar";
import { DOMAIN_ORDER, getDomainIndex } from "@/lib/radar/domain/domainOrder";

const funnelStages = [
    { id: "line1", label: "Entry", match: ["ACQ", "ADQ"] },
    { id: "line2", label: "Commitment", match: ["SAL", "VTA"] },
    { id: "line3", label: "Usage", match: ["ONB", "PRD", "PRO", "SUP", "SOP"] },
    { id: "line4", label: "Engagement", match: ["COM", "RET"] },
    { id: "line5", label: "Growth", match: ["EXP"] }
];

export function mapSignalsToRadar(
    signals: RadarSignal[],
    domains: { id: DomainID; color: string }[],
    config: RadarConfig
): RadarNode[] {
    const angleStep = (Math.PI * 2) / DOMAIN_ORDER.length;

    return signals.map((signal) => {
        // 1. Resolve domain index from canonical order (shared with Compass)
        const canonicalIndex = getDomainIndex(signal.domain);
        const domainIndex = canonicalIndex !== -1 ? canonicalIndex : Math.max(0, domains.findIndex((d) => d.id === signal.domain));
        const domainData = domains.find((d) => d.id === signal.domain) || domains[0];
        const color = domainData ? domainData.color : "#ffffff";

        // 2. Spread out signals slightly if they are in the same domain so they don't perfectly overlap
        const sameDomainSignals = signals.filter((s) => s.domain === signal.domain);
        const indexWithinDomain = sameDomainSignals.findIndex((s) => s.id === signal.id);

        // Spread ~0.12 radians between points in the same domain
        const spreadAngle = 0.12;
        const offset = (indexWithinDomain - (sameDomainSignals.length - 1) / 2) * spreadAngle;

        // 3. Base angle for the domain + visual spread offset
        const angle = domainIndex * angleStep + offset;

        // 4. Radius maps to the Funnel Stage logic determined by domain correlation
        const ringsCount = 5;
        const radiusStep = (config.maxRadius - config.innerRadius) / ringsCount;

        const funnelIndex = funnelStages.findIndex(stage => stage.match.includes(signal.domain));
        const safeFunnelIndex = funnelIndex !== -1 ? funnelIndex : 2; // Default if unmatched

        // Invert: Entry (index 0) → outermost ring, Growth (index 4) → innermost ring
        const radius = config.innerRadius + radiusStep * (ringsCount - safeFunnelIndex);

        // Convert polar to cartesian
        // We adjust angle with - Math.PI / 2 to start from top (12 o'clock)
        const adjustedAngle = angle - Math.PI / 2;
        const x = config.center + radius * Math.cos(adjustedAngle);
        const y = config.center + radius * Math.sin(adjustedAngle);

        return {
            id: signal.id,
            label: signal.label,
            domain: signal.domain,
            cause: signal.cause,
            color,
            angle: adjustedAngle,
            radius,
            x,
            y,
        };
    });
}
