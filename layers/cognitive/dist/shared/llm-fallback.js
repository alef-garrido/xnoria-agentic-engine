"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLLMClientWithFallback = createLLMClientWithFallback;
// ==============================================================================
// Exnoria · Cognitive · LLM Client with Fallback
// Phase 4 B4 — Robust LLM client with automatic failover
//
// Provides createLLMClientWithFallback function that tries Groq first,
// and falls back to OpenRouter if Groq fails.
// ==============================================================================
const openai_1 = __importDefault(require("openai"));
const llm_1 = require("./llm");
/**
 * Create LLM client with automatic fallback from Groq to OpenRouter
 *
 * Tries Groq first with a minimal test request, falls back to OpenRouter
 * if Groq fails (rate limit, auth error, model not found, etc.).
 */
async function createLLMClientWithFallback() {
    // Primary: Groq
    try {
        const groqClient = (0, llm_1.createLLMClient)('LLM_MODEL', 'LLM_BASE_URL', 'LLM_API_KEY');
        // Test request to validate Groq is working
        await groqClient.client.chat.completions.create({
            model: groqClient.model,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1,
        });
        console.log(`[llm-fallback] Groq primary: model=${groqClient.model} status=OK`);
        return { ...groqClient, provider: 'groq' };
    }
    catch (error) {
        console.warn(`[llm-fallback] Groq failed (${error instanceof Error ? error.message : 'unknown error'}), switching to OpenRouter backup...`);
    }
    // Fallback: OpenRouter
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openrouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const openrouterModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    if (!openrouterKey) {
        throw new Error('[llm-fallback] OPENROUTER_API_KEY required for fallback but not set');
    }
    const backupClient = new openai_1.default({
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
        console.log(`[llm-fallback] OpenRouter backup: model=${openrouterModel} status=OK`);
        return {
            model: openrouterModel,
            client: backupClient,
            provider: 'openrouter'
        };
    }
    catch (error) {
        throw new Error(`[llm-fallback] Both Groq and OpenRouter failed - ${error instanceof Error ? error.message : 'unknown error'}`);
    }
}
