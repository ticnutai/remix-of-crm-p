-- סקריפט ייבוא נתונים מגיבוי
-- הרץ את זה ב-SQL Editor של Supabase

-- שלב 1: ייבוא לקוחות
-- הערה: יש להחליף את ה-user_id ב-UUID של משתמש קיים

DO $$
DECLARE
    v_user_id UUID;
    v_client_id UUID;
BEGIN
    -- קח משתמש קיים מהמערכת
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'לא נמצאו משתמשים במערכת - יש להתחבר קודם';
    END IF;
    
    RAISE NOTICE 'משתמש לייבוא: %', v_user_id;
END $$;

-- מחיקת לקוחות מדגם אם קיימים
DELETE FROM clients WHERE is_sample = true OR original_id IS NOT NULL;

-- רשימת הלקוחות לייבוא (דוגמה ראשונה - יש להשלים)
INSERT INTO clients (
    name, name_clean, email, phone, address, company,
    stage, status, notes, source, budget_range,
    tags, custom_data, original_id, is_sample,
    user_id, created_by, created_at
)
SELECT
    name, name_clean, email, phone, address, company,
    stage, 'active', notes, source, budget_range,
    tags, custom_data, original_id, false,
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    created_at
FROM (
    VALUES
    -- הלקוחות יוכנסו כאן על ידי Node.js script
    ('דוגמה', 'דוגמה', '', '', '', '', 'חדש', '', 'imported', '', '{}', '{}', 'test123', NOW())
) AS t(name, name_clean, email, phone, address, company, stage, notes, source, budget_range, tags, custom_data, original_id, created_at)
WHERE false; -- מונע הכנסה בפועל - זו רק תבנית
