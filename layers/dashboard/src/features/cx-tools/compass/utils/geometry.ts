export interface SliceGeometryParams {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    wheelRotation: number;
}

export interface SliceGeometryResult {
    pathD: string;
    labelX: number;
    labelY: number;
    rotDeg: number;
    flipLabel: boolean;
    showLabel: boolean;
}

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
    return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius };
}

function annularArcPath(
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number
): string {
    const innerStart = polarToCartesian(startAngle, innerRadius);
    const innerEnd = polarToCartesian(endAngle, innerRadius);
    const outerStart = polarToCartesian(startAngle, outerRadius);
    const outerEnd = polarToCartesian(endAngle, outerRadius);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
        "Z",
    ].join(" ");
}

/**
 * Calculates all necessary SVG geometry, positioning, and text orientation
 * for a slice within the wheel chart.
 */
export function getSliceGeometry({
    startAngle,
    endAngle,
    innerRadius,
    outerRadius,
    wheelRotation,
}: SliceGeometryParams): SliceGeometryResult {
    const pathD = annularArcPath(startAngle, endAngle, innerRadius, outerRadius);

    // Calculate the center point for label placement
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = (innerRadius + outerRadius) / 2;
    const labelX = Math.sin(midAngle) * labelRadius;
    const labelY = -Math.cos(midAngle) * labelRadius;

    // Calculate native slice rotation degree
    const rotDeg = (midAngle * 180) / Math.PI;

    // Calculate the global display angle of this text natively.
    // wheelRotation goes backwards (negative) to rotate clockwise.
    // We use modulo 360 to keep it in the 0-360 range for evaluation.
    const globalRotDeg = ((rotDeg + wheelRotation) % 360 + 360) % 360;

    // If the global rendered angle puts the text on the bottom half of the screen
    // (between 90 degrees and 270 degrees), flip it 180 degrees so it avoids being upside down.
    const flipLabel = globalRotDeg > 90 && globalRotDeg < 270;

    // Determine if slice is wide enough to show a label (approx 14 degrees)
    const arcAngle = endAngle - startAngle;
    const showLabel = arcAngle > 0.25;

    return {
        pathD,
        labelX,
        labelY,
        rotDeg,
        flipLabel,
        showLabel
    };
}
