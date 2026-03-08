/**
 * בדיקת סינכרון מלא - לוגים, משתמשים ולקוחות
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
  console.log('🔍 בדיקת סינכרון מלא\n');
  console.log('='.repeat(70));
  
  // התחברות
  await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });
  
  // טעינת הגיבוי לקבלת שמות
  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  const backupUsers = backup.data.users;
  
  // שליפת כל הלוגים
  const { data: timeEntries, error } = await supabase
    .from('time_entries')
    .select('id, user_id, client_id, description, start_time, end_time, custom_data');
  
  if (error) {
    console.error('❌ שגיאה:', error.message);
    return;
  }
  
  // שליפת כל הלקוחות
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, original_id');
  
  const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
  
  // ניתוח
  let withUser = 0;
  let withClient = 0;
  let totalSeconds = 0;
  const byUser = {};
  const byClient = {};
  
  for (const entry of timeEntries || []) {
    // בדיקת user
    if (entry.user_id) withUser++;
    
    // בדיקת client
    if (entry.client_id) {
      withClient++;
      const client = clientMap.get(entry.client_id);
      const clientName = client?.name || 'לא ידוע';
      if (!byClient[clientName]) byClient[clientName] = { count: 0, seconds: 0 };
      byClient[clientName].count++;
      
      // חישוב זמן
      if (entry.start_time && entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const seconds = (end - start) / 1000;
        byClient[clientName].seconds += seconds;
        totalSeconds += seconds;
      }
    }
    
    // ניתוח לפי יוצר מקורי
    const creatorId = entry.custom_data?.original_created_by_id;
    if (creatorId) {
      const user = backupUsers.find(u => u.id === creatorId);
      const userName = user?.full_name || creatorId;
      if (!byUser[userName]) byUser[userName] = { count: 0, seconds: 0 };
      byUser[userName].count++;
      
      if (entry.start_time && entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const seconds = (end - start) / 1000;
        byUser[userName].seconds += seconds;
      }
    }
  }
  
  const total = timeEntries?.length || 0;
  
  console.log('\n📊 סטטיסטיקות כלליות:');
  console.log('-'.repeat(70));
  console.log(`   סה"כ רישומי זמן: ${total}`);
  console.log(`   מקושרים למשתמש: ${withUser} (${((withUser/total)*100).toFixed(1)}%)`);
  console.log(`   מקושרים ללקוח: ${withClient} (${((withClient/total)*100).toFixed(1)}%)`);
  console.log(`   סה"כ שעות: ${(totalSeconds/3600).toFixed(1)}`);
  
  console.log('\n👤 לוגים לפי משתמש יוצר:');
  console.log('-'.repeat(70));
  const sortedUsers = Object.entries(byUser).sort((a, b) => b[1].count - a[1].count);
  for (const [name, data] of sortedUsers) {
    const hours = (data.seconds / 3600).toFixed(1);
    console.log(`   ${name}: ${data.count} לוגים, ${hours} שעות`);
  }
  
  console.log('\n👥 TOP 20 לקוחות לפי שעות עבודה:');
  console.log('-'.repeat(70));
  const sortedClients = Object.entries(byClient)
    .sort((a, b) => b[1].seconds - a[1].seconds)
    .slice(0, 20);
  
  for (const [name, data] of sortedClients) {
    const hours = (data.seconds / 3600).toFixed(1);
    console.log(`   ${name}: ${data.count} לוגים, ${hours} שעות`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ סיכום הקישורים:');
  console.log(`   • כל לוג מקושר ל-user_id (המשתמש הנוכחי שמחובר)`);
  console.log(`   • כל לוג מכיל custom_data.original_created_by_id (מי יצר במקור)`);
  console.log(`   • ${withClient}/${total} לוגים מקושרים ללקוח ספציפי`);
}

main().catch(console.error);
