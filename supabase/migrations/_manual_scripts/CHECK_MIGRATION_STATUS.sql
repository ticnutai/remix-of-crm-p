-- Run this in Supabase SQL Editor to check migration status
-- Copy the output to see which tables exist

SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    -- V2 Tables
    'tasks',
    'calendar_events', 
    'documents',
    'call_logs',
    'reminders',
    'workflows',
    'workflow_logs',
    'custom_reports',
    'signatures',
    'contract_templates',
    'quote_templates',
    'user_preferences',
    'client_portal_tokens',
    'quotes',
    'contracts',
    'payments',
    -- Core Tables
    'clients',
    'projects',
    'employees',
    'time_entries'
)
ORDER BY table_name;

-- Count total
SELECT 
    COUNT(*) as total_tables,
    'Expected: 20 tables' as note
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'tasks', 'calendar_events', 'documents', 'call_logs', 'reminders',
    'workflows', 'workflow_logs', 'custom_reports', 'signatures',
    'contract_templates', 'quote_templates', 'user_preferences',
    'client_portal_tokens', 'quotes', 'contracts', 'payments',
    'clients', 'projects', 'employees', 'time_entries'
);
