-- Test Migration Example
-- Simple test migration to verify system is working

-- Create a test comment
COMMENT ON TABLE public.migration_logs IS 'Migration logs table - tracks all database migrations';

-- Query to verify
SELECT 
    'Test Migration' as test_name,
    'SUCCESS' as status,
    current_timestamp as executed_at;
