/**
 * יצירת משתמשים מגיבוי ב-Supabase
 * גרסה 2: משתמש ב-hash מוכן מראש
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

// סיסמה לכל המשתמשים - צריך לקחת hash קיים
const DEFAULT_PASSWORD = '543211';
// זה ה-hash של 543211 (נלקח מ-auth.users של משתמש קיים)
// נשתמש ב-extensions.pgcrypto בסכמה הנכונה

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKUP_FILE = path.join(__dirname, '..', 'backup_2026-01-27 (1).json');

async function main() {
  console.log('🚀 יצירת משתמשים מגיבוי (גרסה 2)\n');
  console.log('='.repeat(60));
  
  // טעינת הגיבוי
  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  const backupUsers = backup.data.users;
  
  console.log(`\n📋 נמצאו ${backupUsers.length} משתמשים בגיבוי`);
  
  // יצירת SQL ליצירת משתמשים - גרסה שמשתמשת ב-hash מהמשתמש הקיים
  const sqlStatements = [];
  
  sqlStatements.push('-- יצירת משתמשים מגיבוי (גרסה 2)');
  sqlStatements.push('-- נוצר אוטומטית ב-' + new Date().toISOString());
  sqlStatements.push('-- משתמש ב-hash מהמשתמש הקיים');
  sqlStatements.push('');
  sqlStatements.push('DO $$');
  sqlStatements.push('DECLARE');
  sqlStatements.push('    v_password_hash TEXT;');
  sqlStatements.push('    v_user_id UUID;');
  sqlStatements.push('    v_existing_id UUID;');
  sqlStatements.push('BEGIN');
  sqlStatements.push('    -- קח את ה-hash מהמשתמש הקיים (jj1212t@gmail.com)');
  sqlStatements.push("    SELECT encrypted_password INTO v_password_hash FROM auth.users WHERE email = 'jj1212t@gmail.com';");
  sqlStatements.push('    ');
  sqlStatements.push('    IF v_password_hash IS NULL THEN');
  sqlStatements.push("        RAISE EXCEPTION 'לא נמצא משתמש קיים לקחת ממנו hash';");
  sqlStatements.push('    END IF;');
  sqlStatements.push('    ');
  sqlStatements.push("    RAISE NOTICE 'משתמש ב-hash: %', substring(v_password_hash, 1, 20) || '...';");
  sqlStatements.push('');
  
  for (const user of backupUsers) {
    const email = user.email;
    // דלג על המשתמש הקיים
    if (email === 'jj1212t@gmail.com') {
      sqlStatements.push(`    -- דילוג על ${email} - משתמש קיים`);
      sqlStatements.push(`    UPDATE auth.users SET`);
      sqlStatements.push(`        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"backup_id": "${user.id}", "imported": true, "full_name": "${user.full_name.replace(/'/g, "''")}"}'::jsonb`);
      sqlStatements.push(`    WHERE email = '${email}';`);
      sqlStatements.push('');
      continue;
    }
    
    const fullName = (user.full_name || email.split('@')[0]).replace(/'/g, "''");
    const role = user.role || 'user';
    const backupId = user.id;
    
    sqlStatements.push(`    -- משתמש: ${fullName} (${email})`);
    sqlStatements.push(`    SELECT id INTO v_existing_id FROM auth.users WHERE email = '${email}';`);
    sqlStatements.push(`    `);
    sqlStatements.push(`    IF v_existing_id IS NULL THEN`);
    sqlStatements.push(`        INSERT INTO auth.users (`);
    sqlStatements.push(`            instance_id, id, aud, role, email, encrypted_password,`);
    sqlStatements.push(`            email_confirmed_at, created_at, updated_at,`);
    sqlStatements.push(`            raw_user_meta_data, raw_app_meta_data, is_super_admin, confirmation_token`);
    sqlStatements.push(`        ) VALUES (`);
    sqlStatements.push(`            '00000000-0000-0000-0000-000000000000',`);
    sqlStatements.push(`            gen_random_uuid(),`);
    sqlStatements.push(`            'authenticated',`);
    sqlStatements.push(`            'authenticated',`);
    sqlStatements.push(`            '${email}',`);
    sqlStatements.push(`            v_password_hash,`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            '{"full_name": "${fullName}", "backup_id": "${backupId}", "imported": true}'::jsonb,`);
    sqlStatements.push(`            '{"provider": "email", "providers": ["email"], "role": "${role}"}'::jsonb,`);
    sqlStatements.push(`            false,`);
    sqlStatements.push(`            ''`);
    sqlStatements.push(`        )`);
    sqlStatements.push(`        RETURNING id INTO v_user_id;`);
    sqlStatements.push(`        `);
    sqlStatements.push(`        -- יצירת identities`);
    sqlStatements.push(`        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)`);
    sqlStatements.push(`        VALUES (`);
    sqlStatements.push(`            gen_random_uuid(),`);
    sqlStatements.push(`            v_user_id,`);
    sqlStatements.push(`            '${email}',`);
    sqlStatements.push(`            jsonb_build_object('sub', v_user_id::text, 'email', '${email}', 'email_verified', true),`);
    sqlStatements.push(`            'email',`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            NOW()`);
    sqlStatements.push(`        );`);
    sqlStatements.push(`        `);
    sqlStatements.push(`        RAISE NOTICE 'נוצר משתמש: ${email}';`);
    sqlStatements.push(`    ELSE`);
    sqlStatements.push(`        UPDATE auth.users SET`);
    sqlStatements.push(`            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"backup_id": "${backupId}", "imported": true}'::jsonb`);
    sqlStatements.push(`        WHERE id = v_existing_id;`);
    sqlStatements.push(`        v_user_id := v_existing_id;`);
    sqlStatements.push(`        RAISE NOTICE 'משתמש קיים: ${email}';`);
    sqlStatements.push(`    END IF;`);
    sqlStatements.push(`    `);
    sqlStatements.push(`    -- יצירת/עדכון profile`);
    sqlStatements.push(`    INSERT INTO profiles (id, email, full_name)`);
    sqlStatements.push(`    VALUES (v_user_id, '${email}', '${fullName}')`);
    sqlStatements.push(`    ON CONFLICT (id) DO UPDATE SET`);
    sqlStatements.push(`        email = EXCLUDED.email,`);
    sqlStatements.push(`        full_name = EXCLUDED.full_name;`);
    sqlStatements.push('');
  }
  
  sqlStatements.push('END $$;');
  sqlStatements.push('');
  sqlStatements.push('-- הצגת המשתמשים שנוצרו');
  sqlStatements.push(`SELECT id, email, raw_user_meta_data->>'full_name' as name, raw_user_meta_data->>'backup_id' as backup_id`);
  sqlStatements.push(`FROM auth.users ORDER BY created_at;`);
  
  // שמירת קובץ SQL
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', 'IMPORT_0_create_users_v2.sql');
  fs.writeFileSync(sqlFile, sqlStatements.join('\n'), 'utf-8');
  console.log(`\n💾 קובץ SQL נשמר: ${sqlFile}`);
  
  console.log('\n🎯 הרץ:');
  console.log('   node scripts/direct-run.mjs file "supabase/migrations/IMPORT_0_create_users_v2.sql"');
  console.log('\n✅ כל המשתמשים יקבלו את אותה סיסמה כמו jj1212t@gmail.com');
}

main().catch(console.error);
