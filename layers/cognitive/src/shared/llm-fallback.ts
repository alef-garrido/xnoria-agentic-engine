// ==============================================================================
// Exnoria · Cognitive · LLM Client with Fallback
// Phase 4 B4 — Robust LLM client with automatic failover
//
// Provides createLLMClientWithFallback function that tries Groq first,
// and falls back to OpenRouter if Groq fails.
// ==============================================================================
import OpenAI from 'openai';
import { createLLMClient } from './llm';
import { createLogger } from '../../../shared/logging';

const logger = createLogger('llm-fallback', 'cognitive');

export interface LLMClientWithFallback {
  model: string;
  client: OpenAI;
  provider: 'groq' | 'openrouter';
}

/**
 * Create LLM client with automatic fallback from Groq to OpenRouter
 * 
 * Tries Groq first with a minimal test request, falls back to OpenRouter
 * if Groq fails (rate limit, auth error, model not found, etc.).
 */
export async function createLLMClientWithFallback(): Promise<LLMClientWithFallback> {
  // Primary: Groq
  try {
    const groqClient = createLLMClient('LLM_MODEL', 'LLM_BASE_URL', 'LLM_API_KEY');
    
    // Test request to validate Groq is working
    await groqClient.client.chat.completions.create({
      model: groqClient.model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    });
    
    logger.info({ model: groqClient.model, provider: 'groq' }, 'Primary LLM ready');
    return { ...groqClient, provider: 'groq' };
  } catch (error) {
    logger.warn({ err: error instanceof Error ? error.message : String(error) }, 'Groq primary failed — switching to OpenRouter');
  }

  // Fallback: OpenRouter
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openrouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const openrouterModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
  
  if (!openrouterKey) {
    throw new Error('[llm-fallback] OPENROUTER_API_KEY required for fallback but not set');
  }
  
  const backupClient = new OpenAI({ 
    apiKey: openrouterKey, 
    baseURL: openrouterUrl 
  });
  
  try {
    // Test request to validate OpenRouter is working
    await backupClient.chat.completions.create({
      model: openrouterModel,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    });
    
    logger.info({ model: openrouterModel, provider: 'openrouter' }, 'Backup LLM ready');
    return { 
      model: openrouterModel, 
      client: backupClient, 
      provider: 'openrouter' 
    };
  } catch (error) {
    throw new Error(`[llm-fallback] Both Groq and OpenRouter failed - ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}