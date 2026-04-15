export type JourneyStage = 'ACQ' | 'SAL' | 'ONB' | 'PRD' | 'SUP' | 'COM' | 'RET' | 'EXP';
export type AgentCluster = 'acqsal' | 'lifecycle' | 'escalation';
export type Channel = 'telegram' | 'n8n' | 'internal';
export type Role = 'user' | 'assistant';
export interface CXEvent {
    contact_id: string;
    channel: Channel;
    input: string;
    stage?: JourneyStage;
    signal_id?: string;
    signal_severity?: number;
    cause_code?: string;
    interventions?: string[];
    meta?: {
        cross_stage_history?: string;
        routed_by?: string;
        cluster?: AgentCluster;
        [key: string]: unknown;
    };
}
export interface HistoryTurn {
    role: Role;
    content: string;
    stage?: JourneyStage;
    created_at: Date;
}
export interface MemoryHit {
    content: string;
    stage?: JourneyStage;
    similarity: number;
    created_at: Date;
}
export interface FilterRequest {
    action_id: string;
    stage: JourneyStage;
    session_id: string;
    payload: Record<string, unknown>;
    meta?: {
        triggered_by?: string;
        confidence?: number;
        [key: string]: unknown;
    };
}
export interface FilterResponse {
    status: 'executed' | 'rejected' | 'pending_hitl' | 'error';
    log_id: string;
    workflow_result?: Record<string, unknown>;
    rejection_code?: string;
    message?: string;
}
export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
