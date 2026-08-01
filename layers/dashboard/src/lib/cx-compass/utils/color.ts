function hexToRgb(hex: string): [number, number, number] | null {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!match) return null;
    const int = parseInt(match[1], 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/**
 * Lightens a hex color in HSL space, mirroring d3's `color.brighter(k)`:
 * lightness is multiplied by Math.pow(0.7, k).
 */
export function lightenColor(hex: string, k: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) % 6;
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
        }
        h *= 60;
    }

    const l2 = Math.min(1, l * Math.pow(0.7, k));

    const c = (1 - Math.abs(2 * l2 - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l2 - c / 2;

    let r2 = 0;
    let g2 = 0;
    let b2 = 0;
    if (h < 60) {
        r2 = c;
        g2 = x;
    } else if (h < 120) {
        r2 = x;
        g2 = c;
    } else if (h < 180) {
        g2 = c;
        b2 = x;
    } else if (h < 240) {
        g2 = x;
        b2 = c;
    } else if (h < 300) {
        r2 = x;
        b2 = c;
    } else {
        r2 = c;
        b2 = x;
    }

    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}
