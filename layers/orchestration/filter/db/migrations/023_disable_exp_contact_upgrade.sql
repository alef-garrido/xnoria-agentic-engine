-- 023: Disable exp.contact.upgrade
-- This action was added at runtime (no migration/seed trail) and has no
-- cognitive-layer tool definition, making it unreachable from the LLM.
-- Disable until Phase 4/5 when EXP tool definitions are added.
UPDATE filter_action
SET enabled = false, updated_at = now()
WHERE action_id = 'exp.contact.upgrade';
