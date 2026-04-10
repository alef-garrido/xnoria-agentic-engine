"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embed = embed;
exports.writeEmbedding = writeEmbedding;
exports.searchMemory = searchMemory;
// ==============================================================================
// Exnoria · Cognitive · Memory — vector embeddings
// Generates embeddings via Google gemini-embedding-001
// Stores and searches via pgvector in Postgres
// ==============================================================================
const axios_1 = __importDefault(require("axios"));
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY ?? '';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;
const SIMILARITY_LIMIT = 5;
const SIMILARITY_THRESHOLD = 0.75;
// Generate a 768-dimension embedding via Google API (downsized for pgvector ivfflat)
async function embed(text) {
    const response = await axios_1.default.post(`${EMBEDDING_URL}?key=${EMBEDDING_API_KEY}`, {
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: 768
    });
    return response.data.embedding.values;
}
// Store an embedding in Postgres
async function writeEmbedding(db, contact_id, content, embedding, session_id, stage) {
    const vector = `[${embedding.join(',')}]`;
    await db.query(`INSERT INTO cognitive_embeddings
       (contact_id, stage, content, embedding, session_id)
     VALUES ($1, $2, $3, $4::vector, $5)`, [contact_id, stage ?? null, content, vector, session_id]);
}
// Search for semantically similar past interactions
async function searchMemory(db, contact_id, queryEmbedding) {
    const vector = `[${queryEmbedding.join(',')}]`;
    const result = await db.query(`SELECT
       content,
       stage,
       1 - (embedding <=> $2::vector) AS similarity,
       created_at
     FROM cognitive_embeddings
     WHERE contact_id = $1
       AND 1 - (embedding <=> $2::vector) >= $3
     ORDER BY embedding <=> $2::vector
     LIMIT $4`, [contact_id, vector, SIMILARITY_THRESHOLD, SIMILARITY_LIMIT]);
    return result.rows.map(r => ({
        content: r.content,
        stage: r.stage ?? undefined,
        similarity: r.similarity,
        created_at: r.created_at
    }));
}
