export type DomainID = string;
export type SignalID = string;
export type CauseID = string;

// The radar expects this flattened shape for a signal
export interface RadarSignal {
    id: SignalID;
    label: string;
    domain: DomainID;
    cause: CauseID;
    level: number; // For mapping depth (radius) corresponding to funnel stages
    color?: string; // We can resolve color from domain
}

export interface RadarNode {
    id: SignalID;
    label: string;
    domain: DomainID;
    cause: CauseID;
    color: string;

    angle: number;  // radians
    radius: number; // px
    x: number;      // computed
    y: number;      // computed
}

export interface RadarConfig {
    size: number;
    center: number;
    maxRadius: number;
    innerRadius: number;
    domainCount: number;
}

export interface RadarInteractions {
    onHover?: (signalId: SignalID | null) => void;
    onClick?: (signalId: SignalID) => void;
}
