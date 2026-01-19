-- ============================================
-- Check which migrations have been run
-- ============================================
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC;

-- ============================================
-- Check if client stages tables exist
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('client_stages', 'client_stage_tasks')
ORDER BY table_name;

-- ============================================
-- Check ALL reminders table columns
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'reminders'
ORDER BY ordinal_position;

-- ============================================
-- Summary: Which of the 3 migrations ran?
-- ============================================
SELECT 
    CASE 
        WHEN version LIKE '20260114000000%' THEN 'client_stages_tracker (old)'
        WHEN version LIKE '20260114000001%' THEN 'update_reminders (old)'
        WHEN version LIKE '20260114003125%' THEN 'combined migration (new)'
        ELSE 'other'
    END as migration_type,
    version,
    inserted_at
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202601140%'
ORDER BY version;
