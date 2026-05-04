// Test: Create a reminder + trigger check-reminders to send WhatsApp
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

const ADMIN_EMAIL = 'jj1212t@gmail.com';
const ADMIN_PASSWORD = '543211';

const TEST_PHONE = '0502857658';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  // 1. Login
  console.log('🔐 Logging in...');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (authError) { console.error('❌ Login failed:', authError.message); process.exit(1); }
  console.log('✅ Logged in as:', auth.user.email);

  // 2. Check Twilio credentials
  console.log('\n📋 Checking Twilio credentials in platform_settings...');
  const { data: settings, error: settingsError } = await supabase
    .from('platform_settings')
    .select('key, value')
    .like('key', 'twilio:%');
  
  if (settingsError) {
    console.error('❌ Cannot read platform_settings:', settingsError.message);
  } else if (!settings || settings.length === 0) {
    console.error('❌ Twilio credentials NOT FOUND in platform_settings');
    console.log('   → נא להכנס להגדרות → API Keys → Twilio ולשמור את הפרטים');
    process.exit(1);
  } else {
    settings.forEach(s => {
      const masked = s.value.length > 8 ? s.value.slice(0, 4) + '****' + s.value.slice(-4) : '****';
      console.log(`   ✅ ${s.key} = ${masked}`);
    });
  }

  // 3. Check recipient_phone column
  console.log('\n📋 Checking recipient_phone column in reminders...');
  const { data: cols, error: colErr } = await supabase
    .from('reminders')
    .select('recipient_phone')
    .limit(1);
  if (colErr) {
    console.error('❌ recipient_phone column missing:', colErr.message);
    process.exit(1);
  }
  console.log('✅ recipient_phone column exists');

  // 4. Create a test reminder due NOW
  console.log('\n📝 Creating test reminder due NOW...');
  const now = new Date();
  now.setSeconds(now.getSeconds() - 10); // 10 seconds in the past to ensure it fires
  
  const { data: reminder, error: createError } = await supabase
    .from('reminders')
    .insert({
      title: '🧪 בדיקת וואטסאפ',
      message: 'זוהי הודעת בדיקה אוטומטית מהמערכת',
      remind_at: now.toISOString(),
      reminder_type: 'whatsapp',
      reminder_types: ['whatsapp'],
      recipient_phone: TEST_PHONE,
      is_sent: false,
      is_dismissed: false,
      user_id: auth.user.id,
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create reminder:', createError.message);
    process.exit(1);
  }
  console.log('✅ Test reminder created:', reminder.id);
  console.log('   Phone:', reminder.recipient_phone);
  console.log('   Due at:', reminder.remind_at);

  // 5. Call check-reminders edge function
  console.log('\n🚀 Calling check-reminders edge function...');
  const session = auth.session || (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/check-reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });

  const body = await res.json();
  console.log('Edge Function response:', JSON.stringify(body, null, 2));

  if (!res.ok) {
    console.error('❌ Edge function failed:', res.status);
  } else {
    console.log('\n✅ check-reminders completed');
    if (body.results?.whatsappSent > 0) {
      console.log(`🟢 WhatsApp נשלח! (${body.results.whatsappSent} הודעות)`);
      console.log(`📱 בדוק וואטסאפ במספר ${TEST_PHONE}`);
    } else {
      console.log('⚠️  WhatsApp לא נשלח — בדוק מפתחות Twilio');
    }
  }

  // 6. Clean up test reminder
  console.log('\n🧹 Cleaning up test reminder...');
  await supabase.from('reminders').delete().eq('id', reminder.id);
  console.log('✅ Test reminder deleted');
}

main().catch(console.error);
