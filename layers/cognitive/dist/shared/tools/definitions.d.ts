import { ToolDefinition } from '../shared/types';
export declare const TOOLS: ToolDefinition[];
export declare const TOOL_TO_ACTION: Record<string, {
    action_id: string;
    stage: string;
} | null>;
