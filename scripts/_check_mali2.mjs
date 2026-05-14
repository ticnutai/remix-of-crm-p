import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

// Check as admin
const sb = createClient(SUPABASE_URL, ANON_KEY);
console.log('=== As admin (jj1212t) ===');
await sb.auth.signInWithPassword({ email: 'jj1212t@gmail.com', password: '543211' });

const { data: adminRoles } = await sb.from('user_roles').select('user_id, role');
const { data: profiles } = await sb.from('profiles').select('id, email, is_active, approval_status').in('email', ['mali.f.arch2@gmail.com', 'jj1212t@gmail.com']);

console.log('Profiles:', JSON.stringify(profiles, null, 2));
console.log('All roles in DB:', JSON.stringify(adminRoles?.slice(0, 20), null, 2));

// Check as mali
const sb2 = createClient(SUPABASE_URL, ANON_KEY);
console.log('\n=== Logging in as mali ===');
const { data: maliLogin, error: maliErr } = await sb2.auth.signInWithPassword({ 
  email: 'mali.f.arch2@gmail.com', 
  password: 'Mali1234!'  // common password - may fail
});
if (maliErr) {
  console.log('Mali login error:', maliErr.message);
} else {
  console.log('Mali logged in:', maliLogin.user?.email);
  const { data: maliRolesData } = await sb2.from('user_roles').select('role').eq('user_id', maliLogin.user.id);
  console.log('Mali roles:', JSON.stringify(maliRolesData, null, 2));
}
