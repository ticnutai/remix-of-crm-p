-- ✅ בדיקה פשוטה של מערכת המשתמש הראשון

-- 1️⃣ בדיקה: האם הפונקציה קיימת?
SELECT 
    'handle_new_user Function' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ קיימת'
        ELSE '❌ לא קיימת'
    END as status
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2️⃣ בדיקה: האם ה-trigger קיים?
SELECT 
    'on_auth_user_created Trigger' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ קיים'
        ELSE '❌ לא קיים'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users';

-- 3️⃣ רשימת משתמשים לפי סדר יצירה
SELECT 
    ROW_NUMBER() OVER (ORDER BY p.created_at) as "#",
    p.email as "אימייל",
    p.full_name as "שם מלא",
    ur.role as "תפקיד",
    CASE 
        WHEN ur.role = 'admin' THEN '👑 מנהל ראשי'
        WHEN ur.role = 'manager' THEN '👔 מנהל'
        WHEN ur.role = 'employee' THEN '👤 עובד'
        ELSE '❓'
    END as "תיאור",
    to_char(p.created_at, 'DD/MM/YYYY HH24:MI') as "תאריך יצירה"
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at ASC;

-- 4️⃣ סיכום
SELECT 
    COUNT(*) as "סה״כ משתמשים",
    COUNT(CASE WHEN ur.role = 'admin' THEN 1 END) as "מנהלים ראשיים",
    COUNT(CASE WHEN ur.role = 'manager' THEN 1 END) as "מנהלים",
    COUNT(CASE WHEN ur.role = 'employee' THEN 1 END) as "עובדים"
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id;
