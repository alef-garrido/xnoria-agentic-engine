-- ==============================================================================
-- Exnoria · Admin password bootstrap guard migration
-- Migration: 014_admin_password_bootstrap.sql
--
-- This migration is a guard — it ensures the admin user exists.
-- Password seeding happens via deploy/init.sh, not SQL.
--
-- The init.sh script:
--   1. Reads DASHBOARD_ADMIN_PASSWORD from .env
--   2. Hashes it with bcrypt (BCRYPT_COST = 12)
--   3. UPDATEs the admin row if password_hash IS NULL
--   4. Logs success for audit trail
--
-- Rationale:
--   - SQL has no bcrypt library — password must be hashed in Node.js
--   - init.sh runs post-migration, ensuring admin row exists before update
--   - This migration is idempotent — safe to run multiple times
--
-- Fallback: If admin password not set via init.sh, use bootstrap API:
--   POST /api/bootstrap/admin-init with { password: "secure-password" }
-- ==============================================================================

BEGIN;

-- Verify the admin user exists from migration 012
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operators WHERE handle = 'admin') THEN
    RAISE EXCEPTION 'Admin user must exist from migration 012. Check migration 012 was applied.';
  END IF;
END $$;

COMMIT;
