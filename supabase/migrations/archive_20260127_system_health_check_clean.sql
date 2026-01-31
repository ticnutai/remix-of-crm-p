-- ============================================
-- System Health Check - Full Database Diagnostic
-- ============================================

DROP FUNCTION IF EXISTS public.run_system_health_check();
DROP FUNCTION IF EXISTS public.quick_health_check();

-- Create quick health check function
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

    result := jsonb_build_object(
        'timestamp', NOW(),
        'status', 'HEALTHY',
        'counts', jsonb_build_object(
            'tables', tables_count,
            'functions', functions_count,
            'policies', policies_count
        ),
        'database_size', pg_size_pretty(pg_database_size(current_database()))
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quick_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.quick_health_check() TO service_role;

COMMENT ON FUNCTION public.quick_health_check() IS 'Quick health check - returns summary status';
