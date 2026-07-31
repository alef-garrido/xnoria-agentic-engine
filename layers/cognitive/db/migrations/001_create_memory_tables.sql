-- ==============================================================================
-- Exnoria · Cognitive layer · Memory schema
-- Migration: 003_create_memory_tables.sql
--
-- Creates:
--   cognitive_session    — one row per agent reasoning cycle
--   cognitive_history    — conversation turns per contact and channel
--   cognitive_embeddings — vector embeddings for semantic memory search
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- cognitive_session
-- One row per reasoning cycle. Links a channel event to the actions taken.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cognitive_session (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   TEXT NOT NULL,              -- HubSpot or channel contact identifier
  channel      TEXT NOT NULL,              -- telegram | n8n | internal
  stage        TEXT,                       -- ACQ | SAL | ONB | PRD | SUP | COM | RET | EXP
  input        TEXT NOT NULL,              -- raw inbound message or signal
  actions_taken JSONB NOT NULL DEFAULT '[]', -- array of filter dispatch results
  model        TEXT NOT NULL,              -- LLM model used
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cognitive_session_contact
  ON cognitive_session (contact_id);

CREATE INDEX IF NOT EXISTS idx_cognitive_session_created
  ON cognitive_session (created_at DESC);

-- ------------------------------------------------------------------------------
-- cognitive_history
-- Recent conversation turns per contact.
-- Read before every reasoning cycle to provide short-term context.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cognitive_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   TEXT NOT NULL,
  channel      TEXT NOT NULL,
  role         TEXT NOT NULL,              -- user | assistant
  content      TEXT NOT NULL,
  stage        TEXT,
  session_id   UUID REFERENCES cognitive_session(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cognitive_history_contact
  ON cognitive_history (contact_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- cognitive_embeddings
-- Vector embeddings for semantic memory search via pgvector.
-- Each row represents one interaction turn embedded for similarity retrieval.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cognitive_embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   TEXT NOT NULL,
  stage        TEXT,
  content      TEXT NOT NULL,              -- original text that was embedded
  embedding    vector(768),                -- text-embedding-004 dimension
  session_id   UUID REFERENCES cognitive_session(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IVFFlat index for approximate nearest-neighbor search
-- lists=100 is appropriate for up to ~1M rows
CREATE INDEX IF NOT EXISTS idx_cognitive_embeddings_vector
  ON cognitive_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_cognitive_embeddings_contact
  ON cognitive_embeddings (contact_id);
