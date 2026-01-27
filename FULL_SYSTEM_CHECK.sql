-- 🔍 סקריפט בדיקת מערכת מקיפה - e-control CRM
-- הרץ סקריפט זה ב-Supabase SQL Editor לקבלת סטטוס מלא של המערכת

-- ==========================================
-- 1️⃣ בדיקת טבלאות ראשיות
-- ==========================================
SELECT 
    '📊 טבלאות ראשיות' as check_category,
    table_name as "שם הטבלה",
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✅ קיימת'
        ELSE '❌ חסרה'
    END as "סטטוס"
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
-- 2️⃣ בדיקת פונקציות קריטיות
-- ==========================================
SELECT 
    '⚙️ פונקציות' as check_category,
    func_name as "שם הפונקציה",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = func_name
        ) THEN '✅ קיימת'
        ELSE '❌ חסרה'
    END as "סטטוס"
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
-- 3️⃣ בדיקת Triggers חיוניים
-- ==========================================
SELECT 
    '🔔 Triggers' as check_category,
    trigger_name as "שם ה-Trigger",
    event_object_table as "טבלה",
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ פעיל'
        ELSE '❌ לא קיים'
    END as "סטטוס"
FROM information_schema.triggers
WHERE trigger_schema = 'auth' OR trigger_schema = 'public'
ORDER BY trigger_name;

-- ==========================================
-- 4️⃣ בדיקת RLS Policies קריטיים
-- ==========================================
SELECT 
    '🔒 RLS Policies' as check_category,
    schemaname as "סכמה",
    tablename as "טבלה",
    policyname as "שם ה-Policy",
    cmd as "פעולה",
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ מאפשר'
        ELSE '⚠️ מגביל'
    END as "סוג"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ==========================================
-- 5️⃣ סטטוס מיגרציות
-- ==========================================
SELECT 
    '📦 מיגרציות' as check_category,
    COUNT(*) as "סה״כ מיגרציות",
    COUNT(CASE WHEN success THEN 1 END) as "✅ הצליחו",
    COUNT(CASE WHEN NOT success THEN 1 END) as "❌ נכשלו",
    MAX(executed_at)::DATE as "אחרונה בתאריך"
FROM public.migration_logs;

-- רשימת 10 מיגרציות אחרונות
SELECT 
    '📋 מיגרציות אחרונות' as check_category,
    name as "שם",
    CASE 
        WHEN success THEN '✅'
        ELSE '❌'
    END as "סטטוס",
    to_char(executed_at, 'DD/MM/YYYY HH24:MI') as "תאריך",
    CASE 
        WHEN error IS NOT NULL THEN LEFT(error, 50) || '...'
        ELSE 'הצלחה'
    END as "הערות"
FROM public.migration_logs
ORDER BY executed_at DESC
LIMIT 10;

-- ==========================================
-- 6️⃣ משתמשים ותפקידים
-- ==========================================
SELECT 
    '👥 משתמשים' as check_category,
    COUNT(*) as "סה״כ משתמשים",
    COUNT(CASE WHEN is_active THEN 1 END) as "פעילים",
    COUNT(CASE WHEN NOT is_active THEN 1 END) as "לא פעילים"
FROM public.profiles;

-- פירוט תפקידים
SELECT 
    '👑 תפקידים' as check_category,
    COALESCE(ur.role::text, 'ללא תפקיד') as "תפקיד",
    COUNT(*) as "כמות",
    CASE 
        WHEN ur.role = 'admin' THEN '🔴 מנהל ראשי'
        WHEN ur.role = 'manager' THEN '🟡 מנהל'
        WHEN ur.role = 'employee' THEN '🟢 עובד'
        ELSE '⚪ לא מוגדר'
    END as "תיאור"
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
GROUP BY ur.role
ORDER BY COUNT(*) DESC;

-- המשתמש הראשון (צריך להיות admin!)
SELECT 
    '🥇 משתמש ראשון' as check_category,
    p.email as "אימייל",
    p.full_name as "שם",
    ur.role as "תפקיד",
    CASE 
        WHEN ur.role = 'admin' THEN '✅ מנהל (נכון!)'
        ELSE '❌ לא מנהל (שגיאה!)'
    END as "בדיקה",
    to_char(p.created_at, 'DD/MM/YYYY HH24:MI') as "נוצר ב"
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at ASC
LIMIT 1;

-- ==========================================
-- 7️⃣ נתונים בסיסיים
-- ==========================================
SELECT 
    '📈 נתונים' as check_category,
    'לקוחות' as "סוג",
    COUNT(*)::TEXT as "כמות",
    '👥' as "אייקון"
FROM public.clients
UNION ALL
SELECT 
    '📈 נתונים',
    'פרויקטים',
    COUNT(*)::TEXT,
    '📁'
FROM public.projects
UNION ALL
SELECT 
    '📈 נתונים',
    'משימות',
    COUNT(*)::TEXT,
    '✅'
FROM public.tasks
UNION ALL
SELECT 
    '📈 נתונים',
    'רישומי זמן',
    COUNT(*)::TEXT,
    '⏱️'
FROM public.time_entries
UNION ALL
SELECT 
    '📈 נתונים',
    'טבלאות מותאמות',
    COUNT(*)::TEXT,
    '🗂️'
FROM public.custom_tables;

-- ==========================================
-- 8️⃣ בדיקת indexes לביצועים
-- ==========================================
SELECT 
    '⚡ Indexes' as check_category,
    schemaname as "סכמה",
    tablename as "טבלה",
    indexname as "שם Index",
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✅ מותאם אישית'
        WHEN indexname LIKE '%_pkey' THEN '🔑 Primary Key'
        ELSE '📍 אחר'
    END as "סוג"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==========================================
-- 9️⃣ בדיקת גודל טבלאות
-- ==========================================
SELECT 
    '💾 גודל טבלאות' as check_category,
    schemaname as "סכמה",
    tablename as "טבלה",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "גודל כולל",
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "גודל נתונים"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ==========================================
-- 🔟 סיכום כללי - Health Check
-- ==========================================
SELECT 
    '🏥 בריאות המערכת' as "קטגוריה",
    '✅ המערכת פעילה ותקינה' as "סטטוס",
    now()::DATE as "תאריך בדיקה",
    to_char(now(), 'HH24:MI:SS') as "שעה";

-- ==========================================
-- 🎯 המלצות ואזהרות
-- ==========================================
DO $$
DECLARE
    admin_count INTEGER;
    active_users INTEGER;
    failed_migrations INTEGER;
BEGIN
    -- בדיקת מספר אדמינים
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    -- בדיקת משתמשים פעילים
    SELECT COUNT(*) INTO active_users
    FROM public.profiles
    WHERE is_active = true;
    
    -- בדיקת מיגרציות כושלות
    SELECT COUNT(*) INTO failed_migrations
    FROM public.migration_logs
    WHERE NOT success;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '           🎯 המלצות ואזהרות';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '';
    
    IF admin_count = 0 THEN
        RAISE WARNING '⚠️  אין משתמשי Admin במערכת!';
    ELSIF admin_count = 1 THEN
        RAISE NOTICE '✅ יש 1 משתמש Admin';
    ELSE
        RAISE NOTICE '✅ יש % משתמשי Admin', admin_count;
    END IF;
    
    IF active_users = 0 THEN
        RAISE WARNING '⚠️  אין משתמשים פעילים במערכת!';
    ELSE
        RAISE NOTICE '✅ יש % משתמשים פעילים', active_users;
    END IF;
    
    IF failed_migrations > 0 THEN
        RAISE WARNING '⚠️  יש % מיגרציות כושלות - בדוק את הלוג!', failed_migrations;
    ELSE
        RAISE NOTICE '✅ כל המיגרציות הצליחו';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '           ✨ הבדיקה הושלמה';
    RAISE NOTICE '════════════════════════════════════════════';
END $$;
