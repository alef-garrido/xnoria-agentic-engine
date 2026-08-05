-- 003: Add localized Spanish description column to filter_action
-- Enables the allowlist UI and filter API to surface descriptions in
-- the deployment locale (APP_LOCALE=es) without replacing the canonical
-- English description.
ALTER TABLE filter_action
  ADD COLUMN description_es TEXT;
