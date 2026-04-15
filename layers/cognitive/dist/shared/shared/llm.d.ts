import OpenAI from 'openai';
import { AgentCluster } from '../tools/clusters';
/**
 * LLM Client wrapper (OpenAI-compatible)
 */
export interface LLMClient {
    model: string;
    client: OpenAI;
}
/**
 * Create LLM client based on model configuration
 *
 * @param modelEnvVar — Environment variable name for model name (e.g., 'LLM_ACQSAL_MODEL')
 * @param baseUrlEnvVar — Optional environment variable for base URL
 * @returns LLMClient instance
 */
export declare function createLLMClient(modelEnvVar: string, baseUrlEnvVar?: string): LLMClient;
/**
 * Get default model config for a cluster
 * Useful for fallback or testing
 *
 * Note: All models accessed via OpenAI-compatible API
 * For Claude models, use OpenRouter endpoint: https://openrouter.ai/api/v1
 */
export declare function getDefaultClusterConfig(cluster: AgentCluster): {
    model: string;
    baseUrl?: string;
};
