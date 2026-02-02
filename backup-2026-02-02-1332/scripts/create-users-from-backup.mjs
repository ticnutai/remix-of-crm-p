/**
 * יצירת משתמשים מגיבוי ב-Supabase
 * יוצר את כל המשתמשים עם סיסמה אחידה ושומר את המיפוי
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

// סיסמה לכל המשתמשים
const DEFAULT_PASSWORD = '543211';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKUP_FILE = path.join(__dirname, '..', 'backup_2026-01-27 (1).json');
const MAPPING_FILE = path.join(__dirname, '..', 'user_id_mapping.json');

async function main() {
  console.log('🚀 יצירת משתמשים מגיבוי\n');
  console.log('='.repeat(60));
  
  // טעינת הגיבוי
  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  const backupUsers = backup.data.users;
  
  console.log(`\n📋 נמצאו ${backupUsers.length} משתמשים בגיבוי`);
  
  // התחברות כ-admin
  console.log('\n🔐 מתחבר כ-admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });
  
  if (authError) {
    console.error('❌ שגיאת התחברות:', authError.message);
    return;
  }
  console.log('✅ מחובר!');
  
  // יצירת SQL ליצירת משתמשים
  const sqlStatements = [];
  const mapping = [];
  
  sqlStatements.push('-- יצירת משתמשים מגיבוי');
  sqlStatements.push('-- נוצר אוטומטית ב-' + new Date().toISOString());
  sqlStatements.push('');
  
  for (const user of backupUsers) {
    const email = user.email;
    const fullName = user.full_name || email.split('@')[0];
    const role = user.role || 'user';
    const backupId = user.id;
    
    // יצירת UUID חדש
    sqlStatements.push(`-- משתמש: ${fullName} (${email})`);
    sqlStatements.push(`DO $$`);
    sqlStatements.push(`DECLARE`);
    sqlStatements.push(`    v_user_id UUID;`);
    sqlStatements.push(`BEGIN`);
    sqlStatements.push(`    -- בדוק אם המשתמש כבר קיים`);
    sqlStatements.push(`    SELECT id INTO v_user_id FROM auth.users WHERE email = '${email}';`);
    sqlStatements.push(`    `);
    sqlStatements.push(`    IF v_user_id IS NULL THEN`);
    sqlStatements.push(`        -- יצירת משתמש חדש`);
    sqlStatements.push(`        INSERT INTO auth.users (`);
    sqlStatements.push(`            instance_id, id, aud, role, email, encrypted_password,`);
    sqlStatements.push(`            email_confirmed_at, created_at, updated_at,`);
    sqlStatements.push(`            raw_user_meta_data, raw_app_meta_data, is_super_admin`);
    sqlStatements.push(`        ) VALUES (`);
    sqlStatements.push(`            '00000000-0000-0000-0000-000000000000',`);
    sqlStatements.push(`            gen_random_uuid(),`);
    sqlStatements.push(`            'authenticated',`);
    sqlStatements.push(`            'authenticated',`);
    sqlStatements.push(`            '${email}',`);
    sqlStatements.push(`            crypt('${DEFAULT_PASSWORD}', gen_salt('bf')),`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            NOW(),`);
    sqlStatements.push(`            '{"full_name": "${fullName.replace(/'/g, "''")}", "backup_id": "${backupId}", "imported": true}'::jsonb,`);
    sqlStatements.push(`            '{"provider": "email", "providers": ["email"], "role": "${role}"}'::jsonb,`);
    sqlStatements.push(`            false`);
    sqlStatements.push(`        )`);
    sqlStatements.push(`        RETURNING id INTO v_user_id;`);
    sqlStatements.push(`        `);
    sqlStatements.push(`        RAISE NOTICE 'נוצר משתמש: ${email} עם ID: %', v_user_id;`);
    sqlStatements.push(`    ELSE`);
    sqlStatements.push(`        -- עדכון metadata למשתמש קיים`);
    sqlStatements.push(`        UPDATE auth.users SET`);
    sqlStatements.push(`            raw_user_meta_data = raw_user_meta_data || '{"backup_id": "${backupId}", "imported": true}'::jsonb`);
    sqlStatements.push(`        WHERE id = v_user_id;`);
    sqlStatements.push(`        RAISE NOTICE 'משתמש קיים: ${email} עם ID: %', v_user_id;`);
    sqlStatements.push(`    END IF;`);
    sqlStatements.push(`    `);
    sqlStatements.push(`    -- יצירת/עדכון profile`);
    sqlStatements.push(`    INSERT INTO profiles (id, email, full_name)`);
    sqlStatements.push(`    VALUES (v_user_id, '${email}', '${fullName.replace(/'/g, "''")}')`);
    sqlStatements.push(`    ON CONFLICT (id) DO UPDATE SET`);
    sqlStatements.push(`        full_name = EXCLUDED.full_name;`);
    sqlStatements.push(`END $$;`);
    sqlStatements.push('');
    
    mapping.push({
      backup_id: backupId,
      email: email,
      full_name: fullName,
      role: role
    });
  }
  
  // הוספת שאילתה להצגת המיפוי
  sqlStatements.push('-- הצגת המיפוי');
  sqlStatements.push(`SELECT `);
  sqlStatements.push(`    id as supabase_uuid,`);
  sqlStatements.push(`    email,`);
  sqlStatements.push(`    raw_user_meta_data->>'full_name' as full_name,`);
  sqlStatements.push(`    raw_user_meta_data->>'backup_id' as backup_id`);
  sqlStatements.push(`FROM auth.users`);
  sqlStatements.push(`WHERE raw_user_meta_data->>'imported' = 'true'`);
  sqlStatements.push(`ORDER BY created_at;`);
  
  // שמירת קובץ SQL
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', 'IMPORT_0_create_users.sql');
  fs.writeFileSync(sqlFile, sqlStatements.join('\n'), 'utf-8');
  console.log(`\n💾 קובץ SQL נשמר: ${sqlFile}`);
  
  // שמירת מיפוי זמני
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`💾 מיפוי נשמר: ${MAPPING_FILE}`);
  
  console.log('\n📋 משתמשים שייווצרו:');
  console.log('-'.repeat(60));
  for (const user of mapping) {
    console.log(`  📧 ${user.email}`);
    console.log(`     שם: ${user.full_name}`);
    console.log(`     תפקיד: ${user.role}`);
    console.log(`     ID מגיבוי: ${user.backup_id}`);
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('\n🎯 הוראות:');
  console.log('   1. הרץ: node scripts/direct-run.mjs file "supabase/migrations/IMPORT_0_create_users.sql"');
  console.log('   2. לאחר מכן הרץ את סקריפט עדכון הלוגים');
  console.log('\n✅ כל המשתמשים יקבלו את הסיסמה: ' + DEFAULT_PASSWORD);
}

main().catch(console.error);
