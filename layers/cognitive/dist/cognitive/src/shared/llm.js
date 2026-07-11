"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLLMClient = createLLMClient;
exports.getDefaultClusterConfig = getDefaultClusterConfig;
// ==============================================================================
// Exnoria · Cognitive · LLM Client Factory
// Phase 4 B4 — Multi-model agent architecture (OpenAI-compatible only)
//
// Factory function to create LLM clients based on model configuration.
// Supports any OpenAI-compatible API (Groq, OpenRouter, local Ollama, etc.).
// ==============================================================================
const openai_1 = __importDefault(require("openai"));
const logging_1 = require("../../../shared/logging");
const logger = (0, logging_1.createLogger)('llm-client', 'cognitive');
/**
 * Create LLM client based on per-specialist environment variables.
 *
 * @param modelEnvVar   — Env var for the model name        (e.g. 'LLM_LIFECYCLE_MODEL')
 * @param baseUrlEnvVar — Env var for the base URL          (e.g. 'LLM_LIFECYCLE_BASE_URL')
 * @param apiKeyEnvVar  — Env var for the API key           (e.g. 'LLM_LIFECYCLE_API_KEY')
 *
 * Each param falls back to the global LLM_BASE_URL / LLM_API_KEY when absent.
 * This lets Groq specialists stay on Groq while OpenRouter specialists
 * use their own key — no more accidental cross-contamination.
 */
function createLLMClient(modelEnvVar, baseUrlEnvVar, apiKeyEnvVar) {
    const model = process.env[modelEnvVar];
    if (!model) {
        throw new Error(`[llm] Model not configured: ${modelEnvVar}`);
    }
    // Resolve base URL: per-specialist → global fallback
    const baseURL = (baseUrlEnvVar && process.env[baseUrlEnvVar]) ||
        process.env.LLM_BASE_URL;
    // Resolve API key: per-specialist → global fallback → Groq legacy var
    const apiKey = (apiKeyEnvVar && process.env[apiKeyEnvVar]) ||
        process.env.LLM_API_KEY ||
        process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error(`[llm] API key not found. Set ${apiKeyEnvVar ?? 'LLM_API_KEY'} environment variable.`);
    }
    logger.debug({ model, baseURL }, 'LLM client created');
    return {
        model,
        client: new openai_1.default({ apiKey, baseURL }),
    };
}
/**
 * Get default model config for a cluster (used for fallback / testing).
 */
function getDefaultClusterConfig(cluster) {
    const configs = {
        acqsal: {
            model: 'llama-3.3-70b-versatile',
            baseUrl: 'https://api.groq.com/openai/v1',
        },
        lifecycle: {
            model: 'anthropic/claude-sonnet-4-5',
            baseUrl: 'https://openrouter.ai/api/v1',
        },
        escalation: {
            model: 'anthropic/claude-sonnet-4-5',
            baseUrl: 'https://openrouter.ai/api/v1',
        },
    };
    return configs[cluster];
}
