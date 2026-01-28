-- ============================================
-- System Health Check - Full Database Diagnostic
-- בדיקת תקינות מערכת מלאה
-- ============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.run_system_health_check();

-- Create comprehensive health check function
CREATE OR REPLACE FUNCTION public.run_system_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb := '{}'::jsonb;
    table_stats jsonb := '[]'::jsonb;
    index_stats jsonb := '[]'::jsonb;
    constraint_issues jsonb := '[]'::jsonb;
    rpc_functions jsonb := '[]'::jsonb;
    policies_info jsonb := '[]'::jsonb;
    recent_errors jsonb := '[]'::jsonb;
    storage_info jsonb := '{}'::jsonb;
    rec record;
    total_rows bigint := 0;
    total_size bigint := 0;
BEGIN
    -- ============================================
    -- 1. TABLE STATISTICS - סטטיסטיקות טבלאות
    -- ============================================
    FOR rec IN 
        SELECT 
            t.table_name,
            t.table_type,
            COALESCE(s.n_live_tup, 0) as row_count,
            pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as total_size,
            pg_total_relation_size(quote_ident(t.table_name)::regclass) as size_bytes,
            COALESCE(s.last_vacuum::text, 'Never') as last_vacuum,
            COALESCE(s.last_autovacuum::text, 'Never') as last_autovacuum,
            COALESCE(s.last_analyze::text, 'Never') as last_analyze
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        ORDER BY COALESCE(s.n_live_tup, 0) DESC
    LOOP
        table_stats := table_stats || jsonb_build_object(
            'name', rec.table_name,
            'rows', rec.row_count,
            'size', rec.total_size,
            'size_bytes', rec.size_bytes,
            'last_vacuum', rec.last_vacuum,
            'last_analyze', rec.last_analyze
        );
        total_rows := total_rows + rec.row_count;
        total_size := total_size + rec.size_bytes;
    END LOOP;

    -- ============================================
    -- 2. INDEX STATISTICS - סטטיסטיקות אינדקסים
    -- ============================================
    FOR rec IN
        SELECT 
            schemaname,
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(quote_ident(indexname)::regclass)) as index_size,
            idx_scan as times_used,
            CASE WHEN idx_scan = 0 THEN true ELSE false END as unused
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan ASC
        LIMIT 50
    LOOP
        index_stats := index_stats || jsonb_build_object(
            'table', rec.tablename,
            'index', rec.indexname,
            'size', rec.index_size,
            'times_used', rec.times_used,
            'unused', rec.unused
        );
    END LOOP;

    -- ============================================
    -- 3. FOREIGN KEY CONSTRAINTS - בדיקת מפתחות זרים
    -- ============================================
    FOR rec IN
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
    LOOP
        constraint_issues := constraint_issues || jsonb_build_object(
            'table', rec.table_name,
            'column', rec.column_name,
            'references_table', rec.foreign_table_name,
            'references_column', rec.foreign_column_name,
            'constraint', rec.constraint_name
        );
    END LOOP;

    -- ============================================
    -- 4. RPC FUNCTIONS - פונקציות RPC
    -- ============================================
    FOR rec IN
        SELECT 
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_function_result(p.oid) as return_type,
            CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        ORDER BY p.proname
    LOOP
        rpc_functions := rpc_functions || jsonb_build_object(
            'name', rec.function_name,
            'arguments', rec.arguments,
            'returns', rec.return_type,
            'security', rec.security
        );
    END LOOP;

    -- ============================================
    -- 5. RLS POLICIES - מדיניות אבטחה
    -- ============================================
    FOR rec IN
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        policies_info := policies_info || jsonb_build_object(
            'table', rec.tablename,
            'policy', rec.policyname,
            'permissive', rec.permissive,
            'roles', rec.roles,
            'command', rec.cmd
        );
    END LOOP;

    -- ============================================
    -- 6. RECENT MIGRATION LOGS - לוגים אחרונים
    -- ============================================
    BEGIN
        FOR rec IN
            SELECT 
                name,
                executed_at,
                success,
                error
            FROM migration_logs
            ORDER BY executed_at DESC
            LIMIT 10
        LOOP
            recent_errors := recent_errors || jsonb_build_object(
                'name', rec.name,
                'executed_at', rec.executed_at,
                'success', rec.success,
                'error', rec.error
            );
        END LOOP;
    EXCEPTION WHEN undefined_table THEN
        recent_errors := '[]'::jsonb;
    END;

    -- ============================================
    -- 7. DATABASE SIZE INFO - מידע על גודל
    -- ============================================
    storage_info := jsonb_build_object(
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'database_size_bytes', pg_database_size(current_database()),
        'total_tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
        'total_rows', total_rows,
        'total_data_size', pg_size_pretty(total_size)
    );

    -- ============================================
    -- BUILD FINAL RESULT
    -- ============================================
    result := jsonb_build_object(
        'timestamp', NOW(),
        'database', current_database(),
        'version', version(),
        'status', 'OK',
        'summary', jsonb_build_object(
            'total_tables', jsonb_array_length(table_stats),
            'total_rows', total_rows,
            'total_functions', jsonb_array_length(rpc_functions),
            'total_policies', jsonb_array_length(policies_info),
            'total_foreign_keys', jsonb_array_length(constraint_issues),
            'unused_indexes', (SELECT COUNT(*) FROM jsonb_array_elements(index_stats) elem WHERE (elem->>'unused')::boolean = true)
        ),
        'storage', storage_info,
        'tables', table_stats,
        'indexes', index_stats,
        'foreign_keys', constraint_issues,
        'functions', rpc_functions,
        'policies', policies_info,
        'recent_migrations', recent_errors
    );

    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.run_system_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_system_health_check() TO service_role;

-- ============================================
-- Quick Check Function - בדיקה מהירה
-- ============================================
CREATE OR REPLACE FUNCTION public.quick_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    issues jsonb := '[]'::jsonb;
    tables_count int;
    functions_count int;
    policies_count int;
    rec record;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    -- Count functions
    SELECT COUNT(*) INTO functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prokind = 'f';

    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies WHERE schemaname = 'public';

    -- Check for tables without RLS
    FOR rec IN
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN (SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public')
    LOOP
        issues := issues || jsonb_build_object(
            'type', 'warning',
            'message', 'Table without RLS policy: ' || rec.tablename
        );
    END LOOP;

    -- Check for recent failed migrations
    BEGIN
        FOR rec IN
            SELECT name, error 
            FROM migration_logs 
            WHERE success = false 
            AND executed_at > NOW() - INTERVAL '7 days'
        LOOP
            issues := issues || jsonb_build_object(
                'type', 'error',
                'message', 'Failed migration: ' || rec.name,
                'details', rec.error
            );
        END LOOP;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    result := jsonb_build_object(
        'timestamp', NOW(),
        'status', CASE WHEN jsonb_array_length(issues) = 0 THEN 'HEALTHY' ELSE 'ISSUES_FOUND' END,
        'counts', jsonb_build_object(
            'tables', tables_count,
            'functions', functions_count,
            'policies', policies_count
        ),
        'issues', issues,
        'database_size', pg_size_pretty(pg_database_size(current_database()))
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quick_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.quick_health_check() TO service_role;

-- ============================================
-- COMMENT
-- ============================================
COMMENT ON FUNCTION public.run_system_health_check() IS 'Full system health check - returns detailed database diagnostics';
COMMENT ON FUNCTION public.quick_health_check() IS 'Quick health check - returns summary status and issues';
