-- ==============================================================================
-- Exnoria · Cognitive layer · Diagnosis + Action Plan
-- Migration: 003_diagnosis_plan_tables.sql
--
-- Operator-triggered on-demand diagnosis per lead/contact, and the prioritized
-- action plan derived from a completed diagnosis. Results are registered per
-- contact and consumed by the dashboard cx-tools (Radar).
--
-- Idempotent: safe to run on every deploy/init.sh.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS diagnosis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  fail_reason TEXT,
  triggered_by TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_contact_created
  ON diagnosis (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosis_status_running
  ON diagnosis (created_at DESC) WHERE status = 'running';

CREATE TABLE IF NOT EXISTS action_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES diagnosis(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated',
  items JSONB NOT NULL DEFAULT '[]',
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_plan_contact_created
  ON action_plan (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_plan_diagnosis
  ON action_plan (diagnosis_id);