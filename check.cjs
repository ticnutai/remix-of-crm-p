const{createClient}=require('@supabase/supabase-js');
const s=createClient('https://cxzrjgkjikglkrjcmmhe.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4enJqZ2tqaWtnbGtyamNtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDAxMDUsImV4cCI6MjA4Mzk3NjEwNX0.msBnOg6bvcLr7eaGZBhjM4uPFlRXV3zcUl5fuaW9W2E');

const tables = [
  'tasks','calendar_events','documents','call_logs','reminders',
  'workflows','workflow_logs','custom_reports','signatures',
  'contract_templates','quote_templates','user_preferences',
  'client_portal_tokens','quotes','contracts','payments',
  'clients','projects'
];

(async()=>{
  console.log('\n📊 MIGRATION STATUS CHECK\n' + '='.repeat(40));
  let exists = 0, missing = 0;
  for(const t of tables){
    const{error}=await s.from(t).select('id').limit(1);
    if(error){
      console.log('❌ ' + t);
      missing++;
    } else {
      console.log('✅ ' + t);
      exists++;
    }
  }
  console.log('='.repeat(40));
  console.log(`\n✅ Exists: ${exists}  |  ❌ Missing: ${missing}`);
  if(missing > 0) console.log('\n⚠️ Run MIGRATION_CLEAN.sql in Supabase!');
  else console.log('\n🎉 All tables exist!');
})();
