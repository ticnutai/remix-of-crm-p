-- יצירת משתמשים מגיבוי
-- נוצר אוטומטית ב-2026-01-27T20:20:03.391Z

-- משתמש: יעקב טננבאום (0502857658t@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = '0502857658t@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            '0502857658t@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "יעקב טננבאום", "backup_id": "68b3863a8626205b99d2eb31", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: 0502857658t@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68b3863a8626205b99d2eb31", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: 0502857658t@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, '0502857658t@gmail.com', 'יעקב טננבאום')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: aidymeirovich (aidymeirovich@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'aidymeirovich@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'aidymeirovich@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "aidymeirovich", "backup_id": "6901ea3911ca5f91cc74c1ac", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: aidymeirovich@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "6901ea3911ca5f91cc74c1ac", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: aidymeirovich@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'aidymeirovich@gmail.com', 'aidymeirovich')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: demo (demo@test.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@test.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'demo@test.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "demo", "backup_id": "68b6a09cd046d02bd29778af", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: demo@test.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68b6a09cd046d02bd29778af", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: demo@test.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'demo@test.com', 'demo')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: HSKEL השכל (hskelm.1000000@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'hskelm.1000000@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'hskelm.1000000@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "HSKEL השכל", "backup_id": "693ac2f61358741aceefcb2c", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: hskelm.1000000@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "693ac2f61358741aceefcb2c", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: hskelm.1000000@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'hskelm.1000000@gmail.com', 'HSKEL השכל')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: יעקב טננבוים (jj1212t@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'jj1212t@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'jj1212t@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "יעקב טננבוים", "backup_id": "68a6f600fc1ba67c0b6a6b01", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: jj1212t@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68a6f600fc1ba67c0b6a6b01", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: jj1212t@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'jj1212t@gmail.com', 'יעקב טננבוים')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: yakov tennbaum (lili1q1q@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'lili1q1q@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'lili1q1q@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "yakov tennbaum", "backup_id": "68b40fc8fa3b325eeef70499", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: lili1q1q@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68b40fc8fa3b325eeef70499", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: lili1q1q@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'lili1q1q@gmail.com', 'yakov tennbaum')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: מלי טננבאום -אדריכלות ועיצוב פנים (mali.f.arch2@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'mali.f.arch2@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'mali.f.arch2@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "מלי טננבאום -אדריכלות ועיצוב פנים", "backup_id": "68b3852751ab718bbd0e09f1", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: mali.f.arch2@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68b3852751ab718bbd0e09f1", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: mali.f.arch2@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'mali.f.arch2@gmail.com', 'מלי טננבאום -אדריכלות ועיצוב פנים')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: mali arch (mali.f.arch@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'mali.f.arch@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'mali.f.arch@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "mali arch", "backup_id": "68a7615e7daea9c5cb6e4f94", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: mali.f.arch@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68a7615e7daea9c5cb6e4f94", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: mali.f.arch@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'mali.f.arch@gmail.com', 'mali arch')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: mh0556768640 (mh0556768640@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'mh0556768640@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'mh0556768640@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "mh0556768640", "backup_id": "68ff4ef836b72cce27e9f80e", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: mh0556768640@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68ff4ef836b72cce27e9f80e", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: mh0556768640@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'mh0556768640@gmail.com', 'mh0556768640')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: michalhale11 (michalhale11@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'michalhale11@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'michalhale11@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "michalhale11", "backup_id": "6922f139831cc8859b5dcbe4", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: michalhale11@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "6922f139831cc8859b5dcbe4", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: michalhale11@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'michalhale11@gmail.com', 'michalhale11')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: אדריכלות טננבאום (office.tenarch@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'office.tenarch@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'office.tenarch@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "אדריכלות טננבאום", "backup_id": "68b3759b2c871646269adb06", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: office.tenarch@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68b3759b2c871646269adb06", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: office.tenarch@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'office.tenarch@gmail.com', 'אדריכלות טננבאום')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: ytk טננבאום (ticnutai10@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'ticnutai10@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'ticnutai10@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "ytk טננבאום", "backup_id": "68bed660afc2486dabb8491a", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: ticnutai10@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68bed660afc2486dabb8491a", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: ticnutai10@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'ticnutai10@gmail.com', 'ytk טננבאום')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- משתמש: ticnutai1 (ticnutai@gmail.com)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- בדוק אם המשתמש כבר קיים
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'ticnutai@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- יצירת משתמש חדש
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_user_meta_data, raw_app_meta_data, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'ticnutai@gmail.com',
            crypt('543211', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "ticnutai1", "backup_id": "68b1cbb978d968c9b5f758d1", "imported": true}'::jsonb,
            '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
            false
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'נוצר משתמש: ticnutai@gmail.com עם ID: %', v_user_id;
    ELSE
        -- עדכון metadata למשתמש קיים
        UPDATE auth.users SET
            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "68b1cbb978d968c9b5f758d1", "imported": true}'::jsonb
        WHERE id = v_user_id;
        RAISE NOTICE 'משתמש קיים: ticnutai@gmail.com עם ID: %', v_user_id;
    END IF;
    
    -- יצירת/עדכון profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, 'ticnutai@gmail.com', 'ticnutai1')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name;
END $$;

-- הצגת המיפוי
SELECT 
    id as supabase_uuid,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'backup_id' as backup_id
FROM auth.users
WHERE raw_user_meta_data->>'imported' = 'true'
ORDER BY created_at;