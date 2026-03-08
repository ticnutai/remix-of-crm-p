/**
 * בדיקת מיפוי משתמשים בין גיבוי ל-Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKUP_FILE = path.join(__dirname, '..', 'backup_2026-01-27 (1).json');

async function main() {
  console.log('📊 בדיקת מיפוי משתמשים\n');
  console.log('='.repeat(60));
  
  // טעינת הגיבוי
  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  const backupUsers = backup.data.users;
  
  console.log('\n📋 משתמשים בגיבוי:');
  console.log('-'.repeat(60));
  for (const user of backupUsers) {
    console.log(`  ID: ${user.id}`);
    console.log(`  שם: ${user.full_name}`);
    console.log(`  אימייל: ${user.email}`);
    console.log(`  תפקיד: ${user.role}`);
    console.log('');
  }
  
  // התחברות
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });
  
  if (authError) {
    console.error('❌ שגיאת התחברות:', authError.message);
    return;
  }
  
  // בדיקת profiles ב-Supabase
  console.log('\n📋 משתמשים ב-Supabase (profiles):');
  console.log('-'.repeat(60));
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role');
  
  if (profilesError) {
    console.log('⚠️ לא ניתן לקרוא profiles:', profilesError.message);
  } else if (profiles && profiles.length > 0) {
    for (const profile of profiles) {
      console.log(`  UUID: ${profile.id}`);
      console.log(`  שם: ${profile.full_name}`);
      console.log(`  אימייל: ${profile.email}`);
      console.log(`  תפקיד: ${profile.role}`);
      console.log('');
    }
  } else {
    console.log('  אין profiles');
  }
  
  // יצירת מיפוי לפי email
  console.log('\n🔗 מיפוי אפשרי (לפי email):');
  console.log('-'.repeat(60));
  
  const mapping = [];
  for (const backupUser of backupUsers) {
    const matchingProfile = profiles?.find(p => p.email === backupUser.email);
    if (matchingProfile) {
      console.log(`✅ ${backupUser.email}`);
      console.log(`   גיבוי: ${backupUser.id} → Supabase: ${matchingProfile.id}`);
      mapping.push({
        backup_id: backupUser.id,
        supabase_id: matchingProfile.id,
        email: backupUser.email,
        name: backupUser.full_name
      });
    } else {
      console.log(`❌ ${backupUser.email} - לא נמצא ב-Supabase`);
      mapping.push({
        backup_id: backupUser.id,
        supabase_id: null,
        email: backupUser.email,
        name: backupUser.full_name
      });
    }
  }
  
  // סטטיסטיקה של לוגים לפי משתמש
  console.log('\n📊 לוגים לפי משתמש יוצר:');
  console.log('-'.repeat(60));
  
  const logsByCreator = {};
  for (const log of backup.data.timeLogs) {
    const creatorId = log.created_by_id || 'unknown';
    if (!logsByCreator[creatorId]) {
      logsByCreator[creatorId] = 0;
    }
    logsByCreator[creatorId]++;
  }
  
  for (const [creatorId, count] of Object.entries(logsByCreator)) {
    const user = backupUsers.find(u => u.id === creatorId);
    const userName = user ? user.full_name : 'לא ידוע';
    const userEmail = user ? user.email : '';
    const mappedUser = mapping.find(m => m.backup_id === creatorId);
    const status = mappedUser?.supabase_id ? '✅' : '❌';
    console.log(`  ${status} ${userName} (${userEmail}): ${count} לוגים`);
  }
  
  // שמירת מיפוי לקובץ
  const mappingFile = path.join(__dirname, '..', 'user_mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`\n💾 מיפוי נשמר ב: ${mappingFile}`);
  
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
