// ==============================================================================
// Exnoria · Cognitive · LLM Client with Fallback
// Phase 4 B4 — Robust LLM client with automatic failover
//
// Provides createLLMClientWithFallback function that tries OpenRouter first,
// and falls back to Groq if OpenRouter fails.
// ==============================================================================
import OpenAI from 'openai';
import { createLLMClient } from './llm';
import { createLogger } from '../../../shared/logging';

const logger = createLogger('llm-fallback', 'cognitive');

export interface LLMClientWithFallback {
  model: string;
  client: OpenAI;
  provider: 'openrouter' | 'groq';
}

/**
 * Create LLM client with automatic fallback from OpenRouter to Groq
 *
 * Primary: OpenRouter (LLM_MODEL / LLM_BASE_URL / LLM_API_KEY)
 * Fallback: Groq       (GROQ_MODEL / GROQ_BASE_URL / GROQ_API_KEY)
 *
 * This lets the Groq free tier sit as a backup for when OpenRouter
 * rate-limits or has transient errors — rather than the other way
 * around, where Groq's 6k TPM ceiling kills complex sessions.
 */
export async function createLLMClientWithFallback(): Promise<LLMClientWithFallback> {
  // Primary: OpenRouter
  try {
    const primaryClient = createLLMClient('LLM_MODEL', 'LLM_BASE_URL', 'LLM_API_KEY');

    // Test request to validate primary is working
    await primaryClient.client.chat.completions.create({
      model: primaryClient.model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    });

    logger.info({ model: primaryClient.model, provider: 'openrouter' }, 'Primary LLM ready');
    return { ...primaryClient, provider: 'openrouter' };
  } catch (error) {
    logger.warn({ err: error instanceof Error ? error.message : String(error) }, 'OpenRouter primary failed — switching to Groq');
  }

  // Fallback: Groq
  const groqKey = process.env.GROQ_API_KEY;
  const groqUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
  const groqModel = process.env.GROQ_MODEL || 'qwen/qwen3-32b';

  if (!groqKey) {
    throw new Error('[llm-fallback] GROQ_API_KEY required for fallback but not set');
  }

  const backupClient = new OpenAI({
    apiKey: groqKey,
    baseURL: groqUrl,
  });

  try {
    // Test request to validate Groq is working
    await backupClient.chat.completions.create({
      model: groqModel,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    });

    logger.info({ model: groqModel, provider: 'groq' }, 'Backup LLM ready');
    return {
      model: groqModel,
      client: backupClient,
      provider: 'groq',
    };
  } catch (error) {
    throw new Error(`[llm-fallback] Both OpenRouter and Groq failed - ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}