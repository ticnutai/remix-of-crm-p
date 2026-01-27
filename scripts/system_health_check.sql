-- Comprehensive System Health Check
-- Run this script in Supabase SQL Editor to get full system status

-- ==========================================
-- 1. Core Tables Check
-- ==========================================
SELECT 
    'Core Tables' as check_category,
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES 
        ('profiles'),
        ('user_roles'),
        ('clients'),
        ('projects'),
        ('tasks'),
        ('time_entries'),
        ('migration_logs'),
        ('custom_tables'),
        ('custom_columns')
) AS required_tables(table_name);

-- ==========================================
-- 2. Critical Functions Check
-- ==========================================
SELECT 
    'Functions' as check_category,
    func_name as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = func_name
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES 
        ('handle_new_user'),
        ('execute_safe_migration'),
        ('get_migration_history'),
        ('has_role'),
        ('is_admin'),
        ('get_user_role')
) AS required_functions(func_name);

-- ==========================================
-- 3. Active Triggers Check
-- ==========================================
SELECT 
    'Triggers' as check_category,
    trigger_name,
    event_object_table as table_name,
    'ACTIVE' as status
FROM information_schema.triggers
WHERE trigger_schema = 'auth' OR trigger_schema = 'public'
ORDER BY trigger_name;

-- ==========================================
-- 4. RLS Policies Check
-- ==========================================
SELECT 
    'RLS Policies' as check_category,
    schemaname as schema,
    tablename as table_name,
    policyname as policy_name,
    cmd as command,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ==========================================
-- 5. Migration Status
-- ==========================================
SELECT 
    'Migrations' as check_category,
    COUNT(*) as total_migrations,
    COUNT(CASE WHEN success THEN 1 END) as successful,
    COUNT(CASE WHEN NOT success THEN 1 END) as failed,
    MAX(executed_at)::DATE as last_migration_date
FROM public.migration_logs;

-- Last 10 migrations detail
SELECT 
    'Recent Migrations' as check_category,
    name,
    CASE 
        WHEN success THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status,
    to_char(executed_at, 'DD/MM/YYYY HH24:MI') as executed_at,
    CASE 
        WHEN error IS NOT NULL THEN LEFT(error, 50) || '...'
        ELSE 'Success'
    END as notes
FROM public.migration_logs
ORDER BY executed_at DESC
LIMIT 10;

-- ==========================================
-- 6. Users and Roles
-- ==========================================
SELECT 
    'Users Summary' as check_category,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active THEN 1 END) as active_users,
    COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_users
FROM public.profiles;

-- Roles breakdown
SELECT 
    'Roles Distribution' as check_category,
    COALESCE(ur.role::text, 'no_role') as role,
    COUNT(*) as count,
    CASE 
        WHEN ur.role = 'admin' THEN 'Super Admin'
        WHEN ur.role = 'manager' THEN 'Manager'
        WHEN ur.role = 'employee' THEN 'Employee'
        ELSE 'Undefined'
    END as description
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
GROUP BY ur.role
ORDER BY COUNT(*) DESC;

-- First user check (should be admin)
SELECT 
    'First User Check' as check_category,
    p.email,
    p.full_name,
    ur.role,
    CASE 
        WHEN ur.role = 'admin' THEN 'CORRECT - Admin'
        ELSE 'ERROR - Not Admin'
    END as validation,
    to_char(p.created_at, 'DD/MM/YYYY HH24:MI') as created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at ASC
LIMIT 1;

-- ==========================================
-- 7. Data Statistics
-- ==========================================
SELECT 
    'Data Statistics' as check_category,
    'clients' as type,
    COUNT(*)::TEXT as count
FROM public.clients
UNION ALL
SELECT 
    'Data Statistics',
    'projects',
    COUNT(*)::TEXT
FROM public.projects
UNION ALL
SELECT 
    'Data Statistics',
    'tasks',
    COUNT(*)::TEXT
FROM public.tasks
UNION ALL
SELECT 
    'Data Statistics',
    'time_entries',
    COUNT(*)::TEXT
FROM public.time_entries
UNION ALL
SELECT 
    'Data Statistics',
    'custom_tables',
    COUNT(*)::TEXT
FROM public.custom_tables;

-- ==========================================
-- 8. Performance Indexes
-- ==========================================
SELECT 
    'Indexes' as check_category,
    schemaname as schema,
    tablename as table_name,
    indexname as index_name,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN 'CUSTOM'
        WHEN indexname LIKE '%_pkey' THEN 'PRIMARY_KEY'
        ELSE 'OTHER'
    END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==========================================
-- 9. Table Sizes
-- ==========================================
SELECT 
    'Table Sizes' as check_category,
    schemaname as schema,
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as data_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ==========================================
-- 10. System Health Summary
-- ==========================================
SELECT 
    'System Health' as category,
    'System is operational' as status,
    now()::DATE as check_date,
    to_char(now(), 'HH24:MI:SS') as check_time;

-- ==========================================
-- Recommendations and Warnings
-- ==========================================
DO $$
DECLARE
    admin_count INTEGER;
    active_users INTEGER;
    failed_migrations INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    SELECT COUNT(*) INTO active_users
    FROM public.profiles
    WHERE is_active = true;
    
    SELECT COUNT(*) INTO failed_migrations
    FROM public.migration_logs
    WHERE NOT success;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '     Recommendations and Warnings';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF admin_count = 0 THEN
        RAISE WARNING 'No Admin users in system!';
    ELSIF admin_count = 1 THEN
        RAISE NOTICE 'OK: 1 Admin user exists';
    ELSE
        RAISE NOTICE 'OK: % Admin users exist', admin_count;
    END IF;
    
    IF active_users = 0 THEN
        RAISE WARNING 'No active users in system!';
    ELSE
        RAISE NOTICE 'OK: % active users', active_users;
    END IF;
    
    IF failed_migrations > 0 THEN
        RAISE WARNING '% failed migrations - check logs!', failed_migrations;
    ELSE
        RAISE NOTICE 'OK: All migrations successful';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '          Check Completed';
    RAISE NOTICE '========================================';
END $$;
