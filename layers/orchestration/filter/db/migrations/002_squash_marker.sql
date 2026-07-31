-- ==============================================================================
-- Exnoria · Filter service · Squash marker
-- Migration: 002_squash_marker.sql
--
-- This is a no-op marker indicating that migrations 001–025 have been
-- consolidated into a single canonical schema in 001_create_filter_tables.sql.
--
-- Squash date: 2026-07-30
-- Squash includes: 001 (base) + 002 (HITL columns) + 004–008, 010–025
-- (003 lives in cognitive/db/migrations/)
--
-- New migrations should be numbered sequentially starting from 002:
--   001_create_filter_tables.sql  ← canonical schema (DO NOT ALTER)
--   002_squash_marker.sql         ← this file (was: 002–025)
--   003_your_new_migration.sql    ← add after this
-- ==============================================================================

SELECT 1 AS squashed_from_001_to_025;
