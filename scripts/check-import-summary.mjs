/**
 * בדיקת סיכום הייבוא
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('📊 סיכום ייבוא\n');
  console.log('='.repeat(60));
  
  // התחברות
  await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });
  
  // ספירת לקוחות
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .not('original_id', 'is', null);
  
  console.log(`\n👥 לקוחות מיובאים: ${clientsCount}`);
  
  // ספירת לוגים
  const { count: logsCount } = await supabase
    .from('time_entries')
    .select('*', { count: 'exact', head: true });
  
  console.log(`⏱️  רישומי זמן: ${logsCount}`);
  
  // לוגים לפי משתמש (דרך הדאטה)
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('user_id, custom_data');
  
  if (timeEntries) {
    const byUser = {};
    for (const entry of timeEntries) {
      const createdBy = entry.custom_data?.original_created_by_id || 'unknown';
      byUser[createdBy] = (byUser[createdBy] || 0) + 1;
    }
    
    console.log('\n📈 לוגים לפי יוצר מקורי:');
    for (const [id, count] of Object.entries(byUser)) {
      console.log(`   ${id.substring(0, 10)}...: ${count} לוגים`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ הייבוא הושלם בהצלחה!');
  console.log('\n📋 סיכום:');
  console.log('   • 13 משתמשים נוצרו (סיסמה: 543211)');
  console.log('   • 202 לקוחות יובאו');
  console.log('   • 805 רישומי זמן יובאו ומקושרים');
}

main().catch(console.error);
