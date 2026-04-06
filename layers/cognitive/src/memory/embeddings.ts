// ==============================================================================
// Exnoria · Cognitive · Memory — vector embeddings
// Generates embeddings via Google gemini-embedding-001
// Stores and searches via pgvector in Postgres
// ==============================================================================
import axios from 'axios';
import { Pool } from 'pg';
import { MemoryHit, JourneyStage } from '../shared/types';

const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY ?? '';
const EMBEDDING_MODEL   = 'gemini-embedding-001';
const EMBEDDING_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;
const SIMILARITY_LIMIT  = 5;
const SIMILARITY_THRESHOLD = 0.75;

// Generate a 768-dimension embedding via Google API (downsized for pgvector ivfflat)
export async function embed(text: string): Promise<number[]> {
  const response = await axios.post(
    `${EMBEDDING_URL}?key=${EMBEDDING_API_KEY}`,
    {
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: 768
    }
  );
  return response.data.embedding.values as number[];
}

// Store an embedding in Postgres
export async function writeEmbedding(
  db: Pool,
  contact_id: string,
  content: string,
  embedding: number[],
  session_id: string,
  stage?: JourneyStage
): Promise<void> {
  const vector = `[${embedding.join(',')}]`;
  await db.query(
    `INSERT INTO cognitive_embeddings
       (contact_id, stage, content, embedding, session_id)
     VALUES ($1, $2, $3, $4::vector, $5)`,
    [contact_id, stage ?? null, content, vector, session_id]
  );
}

// Search for semantically similar past interactions
export async function searchMemory(
  db: Pool,
  contact_id: string,
  queryEmbedding: number[]
): Promise<MemoryHit[]> {
  const vector = `[${queryEmbedding.join(',')}]`;
  const result = await db.query<{
    content:    string;
    stage:      JourneyStage | null;
    similarity: number;
    created_at: Date;
  }>(
    `SELECT
       content,
       stage,
       1 - (embedding <=> $2::vector) AS similarity,
       created_at
     FROM cognitive_embeddings
     WHERE contact_id = $1
       AND 1 - (embedding <=> $2::vector) >= $3
     ORDER BY embedding <=> $2::vector
     LIMIT $4`,
    [contact_id, vector, SIMILARITY_THRESHOLD, SIMILARITY_LIMIT]
  );
  return result.rows.map(r => ({
    content:    r.content,
    stage:      r.stage ?? undefined,
    similarity: r.similarity,
    created_at: r.created_at
  }));
}
