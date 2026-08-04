export interface Signal {
  id: string;
  name: string;
  severity?: number;
  level?: number;
  indicators?: Indicator[];
  interventions?: string[];
}

export interface Indicator {
  id: string;
  name: string;
}

export interface Intervention {
  id: string;
  name: string;
}

export interface Cause {
  id: string;
  code: string;
  name: string;
  signals: Signal[];
  indicators: Indicator[];
  interventions: string[];
}

export interface Domain {
  id: string;
  name: string;
  color: string;
  causes: Cause[];
}

export interface CenterNode {
  id: string;
  name: string;
  description: string;
}

export interface WheelData {
  wheel_name: string;
  version: string;
  center: CenterNode;
  domains: Domain[];
}

export type ViewState = "home" | "domain" | "cause" | "signal" | "atlas";
