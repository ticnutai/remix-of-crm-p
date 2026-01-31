-- NOTE: This migration is superseded by 20260131_fix_migration_runner.sql
-- The old version had a bug that removed END; from function definitions
-- Use the newer version instead

-- Legacy version (DO NOT USE - kept for history)
-- This version incorrectly removed END; statements from inside functions