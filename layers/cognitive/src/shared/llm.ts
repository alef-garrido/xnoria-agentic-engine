// ==============================================================================
// Exnoria · Cognitive · LLM Client Factory
// Phase 4 B4 — Multi-model agent architecture
//
// Factory function to create LLM clients based on model configuration.
// Supports Groq (OpenAI-compatible) and Anthropic models.
// ==============================================================================
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AgentCluster } from '../tools/clusters';

/**
 * LLM Provider type
 */
export type LLMProvider = 'groq' | 'anthropic' | 'openai';

/**
 * LLM Client wrapper
 */
export interface LLMClient {
  provider: LLMProvider;
  model: string;
  client: OpenAI | Anthropic;
}

/**
 * Create LLM client based on model configuration
 * 
 * @param modelEnvVar — Environment variable name for model name (e.g., 'LLM_ACQSAL_MODEL')
 * @param baseUrlEnvVar — Optional environment variable for base URL (for Groq/OpenAI-compatible)
 * @returns LLMClient instance
 */
export function createLLMClient(modelEnvVar: string, baseUrlEnvVar?: string): LLMClient {
  const model = process.env[modelEnvVar];
  
  if (!model) {
    throw new Error(`Model not configured: ${modelEnvVar}`);
  }

  const baseURL = baseUrlEnvVar ? process.env[baseUrlEnvVar] : undefined;

  // Anthropic models (Claude)
  if (model.startsWith('claude-')) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(`Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.`);
    }

    return {
      provider: 'anthropic',
      model,
      client: new Anthropic({ apiKey }),
    };
  }

  // Groq / OpenAI-compatible models (Qwen, Llama, etc.)
  const apiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error(`API key not found. Set GROQ_API_KEY or LLM_API_KEY environment variable.`);
  }

  return {
    provider: 'groq',
    model,
    client: new OpenAI({
      apiKey,
      baseURL: baseURL || process.env.LLM_BASE_URL,
    }),
  };
}

/**
 * Get default model config for a cluster
 * Useful for fallback or testing
 */
export function getDefaultClusterConfig(cluster: AgentCluster): {
  model: string;
  baseUrl?: string;
} {
  const configs: Record<AgentCluster, { model: string; baseUrl?: string }> = {
    acqsal: {
      model: 'llama-3.3-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1',
    },
    lifecycle: {
      model: 'claude-sonnet-4-6',
    },
    escalation: {
      model: 'claude-sonnet-4-6',
    },
  };

  return configs[cluster];
}
