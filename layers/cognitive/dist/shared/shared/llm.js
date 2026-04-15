"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLLMClient = createLLMClient;
exports.getDefaultClusterConfig = getDefaultClusterConfig;
// ==============================================================================
// Exnoria · Cognitive · LLM Client Factory
// Phase 4 B4 — Multi-model agent architecture (OpenAI-compatible only)
//
// Factory function to create LLM clients based on model configuration.
// Supports any OpenAI-compatible API (Groq, OpenRouter, Anthropic via compatible endpoint).
// ==============================================================================
var openai_1 = require("openai");
/**
 * Create LLM client based on model configuration
 *
 * @param modelEnvVar — Environment variable name for model name (e.g., 'LLM_ACQSAL_MODEL')
 * @param baseUrlEnvVar — Optional environment variable for base URL
 * @returns LLMClient instance
 */
function createLLMClient(modelEnvVar, baseUrlEnvVar) {
    var model = process.env[modelEnvVar];
    if (!model) {
        throw new Error("Model not configured: ".concat(modelEnvVar));
    }
    var baseURL = baseUrlEnvVar ? process.env[baseUrlEnvVar] : undefined;
    // Use OpenAI client for all models (Groq, OpenRouter, etc.)
    var apiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    if (!apiKey) {
        throw new Error("API key not found. Set GROQ_API_KEY or LLM_API_KEY environment variable.");
    }
    return {
        model: model,
        client: new openai_1.default({
            apiKey: apiKey,
            baseURL: baseURL || process.env.LLM_BASE_URL,
        }),
    };
}
/**
 * Get default model config for a cluster
 * Useful for fallback or testing
 *
 * Note: All models accessed via OpenAI-compatible API
 * For Claude models, use OpenRouter endpoint: https://openrouter.ai/api/v1
 */
function getDefaultClusterConfig(cluster) {
    var configs = {
        acqsal: {
            model: 'llama-3.3-70b-versatile',
            baseUrl: 'https://api.groq.com/openai/v1',
        },
        lifecycle: {
            model: 'claude-sonnet-4-6',
            baseUrl: 'https://openrouter.ai/api/v1',
        },
        escalation: {
            model: 'claude-sonnet-4-6',
            baseUrl: 'https://openrouter.ai/api/v1',
        },
    };
    return configs[cluster];
}
