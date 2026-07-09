-- Migration to check if payload_reviewed column exists in filter_log table
-- This is a verification migration that will be used by the batch ingest script

-- Check if the column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'filter_log' 
AND column_name = 'payload_reviewed';

-- If the column doesn't exist, this migration will return an empty result set
-- The batch ingest script will check for this and warn the user