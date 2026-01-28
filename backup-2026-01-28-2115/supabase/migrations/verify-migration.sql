-- 🔍 Migration Verification - e-control CRM Pro
-- Run this script after migration to verify everything is correct

-- 1. Check Tables
SELECT 'Tables created:' as check_name, COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Check Functions
SELECT 'Functions created:' as check_name, COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'handle_new_user',
  'handle_updated_at',
  'is_admin',
  'is_admin_or_manager',
  'is_client',
  'has_role',
  'get_client_id',
  'update_invoice_paid_amount'
);

-- 3. Check Triggers
SELECT 'Triggers created:' as check_name, COUNT(*) as count
FROM pg_trigger
WHERE tgname LIKE '%updated_at%' OR tgname LIKE 'log_%' OR tgname = 'on_auth_user_created';

-- 4. Check Admin User
SELECT 
  'Admin user status:' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles WHERE email = 'jj1212t@gmail.com'
    ) THEN 'Profile exists ✅'
    ELSE 'Profile not found ❌'
  END as profile_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON ur.user_id = p.id
      WHERE p.email = 'jj1212t@gmail.com' AND ur.role = 'admin'
    ) THEN 'Admin role defined ✅'
    ELSE 'Admin role not defined ❌'
  END as role_status;

-- 5. List All Tables
SELECT 
  '📋 Table list:' as section,
  tablename as table_name
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. Check RLS
SELECT 
  '🔒 RLS enabled:' as section,
  schemaname || '.' || tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Not enabled'
  END as rls_status
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. Statistics
SELECT 
  '📊 Summary:' as section,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') as total_functions,
  (SELECT COUNT(*) FROM pg_trigger) as total_triggers;
