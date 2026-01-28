-- עדכון רישומי זמן עם המשתמש הנכון לפי backup_id
-- נוצר אוטומטית

DO $$
DECLARE
    v_count INTEGER := 0;
    v_user_record RECORD;
BEGIN
    -- עבור כל משתמש שיש לו backup_id
    FOR v_user_record IN 
        SELECT 
            id as supabase_id, 
            raw_user_meta_data->>'backup_id' as backup_id,
            email
        FROM auth.users 
        WHERE raw_user_meta_data->>'backup_id' IS NOT NULL
    LOOP
        -- עדכן את כל הלוגים של המשתמש הזה
        UPDATE time_entries 
        SET user_id = v_user_record.supabase_id
        WHERE (custom_data->>'original_created_by_id') = v_user_record.backup_id;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        IF v_count > 0 THEN
            RAISE NOTICE 'עודכנו % לוגים למשתמש %', v_count, v_user_record.email;
        END IF;
    END LOOP;
END $$;

-- סיכום
SELECT 
    u.email,
    u.raw_user_meta_data->>'full_name' as name,
    COUNT(t.id) as time_entries_count
FROM auth.users u
LEFT JOIN time_entries t ON t.user_id = u.id
GROUP BY u.id, u.email, u.raw_user_meta_data->>'full_name'
ORDER BY time_entries_count DESC;
