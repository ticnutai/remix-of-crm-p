-- ייבוא 5 לוגים ללקוחות החדשים
DO $$
DECLARE
    v_user_id UUID;
    v_client_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    -- לוג 1: בלינצקי - 2025-10-30 - 1.3 דקות
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abad175af64002301909' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', 
                '2025-10-30T20:45:55.093Z'::timestamptz, 
                '2025-10-30T20:47:15.093Z'::timestamptz, 
                true, false, ARRAY[]::text[], 
                '{"original_id": "6903ce83d31204077e7638fa", "original_client_name": "בלינצקי", "original_created_by_id": "68a6f600fc1ba67c0b6a6b01", "imported_from": "backup"}'::jsonb,
                '2025-10-30T20:45:55.093Z'::timestamptz);
        RAISE NOTICE 'לוג 1 נוסף - בלינצקי';
    END IF;

    -- לוג 2: בלינצקי - 2025-10-30 - 0.2 דקות
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68b1abad175af64002301909' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', 
                '2025-10-30T20:44:28.841Z'::timestamptz, 
                '2025-10-30T20:44:38.841Z'::timestamptz, 
                true, false, ARRAY[]::text[], 
                '{"original_id": "6903ce2c0d366c47ef0cf0fc", "original_client_name": "בלינצקי", "original_created_by_id": "68a6f600fc1ba67c0b6a6b01", "imported_from": "backup"}'::jsonb,
                '2025-10-30T20:44:28.841Z'::timestamptz);
        RAISE NOTICE 'לוג 2 נוסף - בלינצקי';
    END IF;

    -- לוג 3: בלניצקי רחל - 2025-09-30 - 11.9 דקות
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68dbdea396fc743b797f63f0' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', 
                '2025-09-30T13:56:45.645Z'::timestamptz, 
                '2025-09-30T14:08:39.645Z'::timestamptz, 
                true, false, ARRAY[]::text[], 
                '{"original_id": "68dbe19d279b76fe7d7d4524", "original_client_name": "בלניצקי רחל", "original_created_by_id": "68a6f600fc1ba67c0b6a6b01", "imported_from": "backup"}'::jsonb,
                '2025-09-30T13:56:45.645Z'::timestamptz);
        RAISE NOTICE 'לוג 3 נוסף - בלניצקי רחל';
    END IF;

    -- לוג 4: ווגנר - 2025-09-09 - 48.9 דקות
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee95f66229a0168b67de1' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', 
                '2025-09-09T09:41:25.694Z'::timestamptz, 
                '2025-09-09T10:30:19.694Z'::timestamptz, 
                true, false, ARRAY[]::text[], 
                '{"original_id": "68bff64548346f0a07dc08a0", "original_client_name": "ווגנר", "original_created_by_id": "68a6f600fc1ba67c0b6a6b01", "imported_from": "backup"}'::jsonb,
                '2025-09-09T09:41:25.694Z'::timestamptz);
        RAISE NOTICE 'לוג 4 נוסף - ווגנר';
    END IF;

    -- לוג 5: הכהן יוסף יצחק - 2025-09-08 - 72.6 דקות
    SELECT id INTO v_client_id FROM clients WHERE original_id = '68bee95f66229a0168b67dde' LIMIT 1;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, is_running, tags, custom_data, created_at)
        VALUES (v_user_id, v_client_id, 'רישום זמן מיובא', 
                '2025-09-08T19:22:35.812Z'::timestamptz, 
                '2025-09-08T20:35:11.812Z'::timestamptz, 
                true, false, ARRAY[]::text[], 
                '{"original_id": "68bf2cfbcbfa1c3db7c978bc", "original_client_name": "הכהן יוסף יצחק", "original_created_by_id": "68a6f600fc1ba67c0b6a6b01", "imported_from": "backup"}'::jsonb,
                '2025-09-08T19:22:35.812Z'::timestamptz);
        RAISE NOTICE 'לוג 5 נוסף - הכהן יוסף יצחק';
    END IF;

END $$;
