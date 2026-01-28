/**
 * בדיקת לוגים חסרים - למה 10 לוגים לא יובאו
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
  console.log('🔍 בדיקת לוגים חסרים\n');
  console.log('='.repeat(70));
  
  // טעינת הגיבוי
  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  const backupLogs = backup.data.timeLogs;
  const backupClients = backup.data.clients;
  
  console.log(`\n📋 בגיבוי: ${backupLogs.length} לוגים, ${backupClients.length} לקוחות`);
  
  // יצירת מפת לקוחות מהגיבוי
  const backupClientIds = new Set(backupClients.map(c => c.id));
  
  // בדיקת לוגים ללא לקוח תקין
  const logsWithoutClient = [];
  const logsWithInvalidClient = [];
  
  for (const log of backupLogs) {
    if (!log.client_id) {
      logsWithoutClient.push(log);
    } else if (!backupClientIds.has(log.client_id)) {
      logsWithInvalidClient.push(log);
    }
  }
  
  console.log(`\n❌ לוגים ללא client_id: ${logsWithoutClient.length}`);
  for (const log of logsWithoutClient) {
    console.log(`   - ID: ${log.id}`);
    console.log(`     שם לקוח: ${log.client_name || 'ללא'}`);
    console.log(`     תיאור: ${log.title || log.notes || 'ללא'}`);
    console.log(`     תאריך: ${log.log_date}`);
    console.log('');
  }
  
  console.log(`\n⚠️ לוגים עם client_id שלא קיים בלקוחות: ${logsWithInvalidClient.length}`);
  for (const log of logsWithInvalidClient) {
    console.log(`   - ID: ${log.id}`);
    console.log(`     client_id: ${log.client_id}`);
    console.log(`     שם לקוח: ${log.client_name || 'ללא'}`);
    console.log(`     תיאור: ${log.title || log.notes || 'ללא'}`);
    console.log(`     תאריך: ${log.log_date}`);
    console.log('');
  }
  
  // התחברות לבדוק ב-Supabase
  await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });
  
  // בדיקת לקוחות שיובאו
  const { data: importedClients } = await supabase
    .from('clients')
    .select('original_id');
  
  const importedClientIds = new Set(importedClients?.map(c => c.original_id) || []);
  
  // לוגים שהלקוח שלהם לא יובא
  const logsClientNotImported = backupLogs.filter(log => 
    log.client_id && !importedClientIds.has(log.client_id)
  );
  
  console.log(`\n🔴 לוגים שהלקוח שלהם לא יובא: ${logsClientNotImported.length}`);
  for (const log of logsClientNotImported.slice(0, 10)) {
    console.log(`   - שם לקוח: ${log.client_name}`);
    console.log(`     client_id בגיבוי: ${log.client_id}`);
    console.log('');
  }
  
  // סיכום
  const totalProblematic = logsWithoutClient.length + logsWithInvalidClient.length + logsClientNotImported.length;
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 סיכום:');
  console.log(`   סה"כ לוגים בגיבוי: ${backupLogs.length}`);
  console.log(`   לוגים ללא client_id: ${logsWithoutClient.length}`);
  console.log(`   לוגים עם client_id לא קיים: ${logsWithInvalidClient.length}`);
  console.log(`   לוגים שהלקוח לא יובא: ${logsClientNotImported.length}`);
  console.log(`   לוגים תקינים שיובאו: ${backupLogs.length - logsWithoutClient.length - logsWithInvalidClient.length}`);
}

main().catch(console.error);
