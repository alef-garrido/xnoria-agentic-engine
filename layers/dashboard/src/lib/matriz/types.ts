export type Impact = "low" | "medium" | "high" | "critical";

export interface Layer {
  text: string;
  visible?: boolean;
}

export interface WorkflowLayer extends Layer {
  automation_level?: "low" | "medium" | "high";
}

export interface AgentLayer extends Layer {
  decision_type?: "diagnostic" | "prioritization" | "risk_detection" | "pattern_detection" | "real_time_assist" | "optimization" | "risk_prioritization" | "opportunity_detection";
}

export interface HumanLayer extends Layer {
  required?: boolean;
}

export interface Touchpoint {
  id: string;
  stage: string;
  position: {
    x: number;
    y: number;
  };
  state?: "active" | "warning" | "idle";
  label: string;
  signals?: string[];
  impact: Impact;
  layers: {
    workflows?: WorkflowLayer;
    agent?: AgentLayer;
    human?: HumanLayer;
  };
}

export interface Stage {
  id: string;
  label: string;
  order: number;
  color: string;
}

export interface MatrizData {
  journey: Stage[];
  touchpoints: Touchpoint[];
}

export interface TimelineNode extends Touchpoint {
  stageColor: string;
  stageLabel: string;
  localIndex: number;
}
