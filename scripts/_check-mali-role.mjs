import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eadeymehidcndudeycnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM'
);

const { error } = await sb.auth.signInWithPassword({ email: 'jj1212t@gmail.com', password: '543211' });
if (error) { console.log('login failed:', error.message); process.exit(1); }
console.log('✅ logged in as jj1212t@gmail.com');

// Query profiles directly (no RLS restriction for admin)
const { data: profiles, error: e1 } = await sb
  .from('profiles')
  .select('id, email, full_name')
  .eq('email', 'mali.f.arch2@gmail.com');

if (e1) { console.log('profiles error:', e1.message); }
else { console.log('profiles row:', JSON.stringify(profiles, null, 2)); }

// Query user_roles for mali
if (profiles && profiles.length > 0) {
  const userId = profiles[0].id;
  const { data: roles, error: e2 } = await sb
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  if (e2) { console.log('roles error:', e2.message); }
  else { console.log('user_roles:', JSON.stringify(roles, null, 2)); }

  // Check user_permissions for time-logs
  const { data: perms, error: e3 } = await sb
    .from('user_permissions')
    .select('module, can_view, can_edit, can_delete')
    .eq('user_id', userId);
  if (e3) { console.log('permissions error:', e3.message); }
  else { console.log('user_permissions:', JSON.stringify(perms, null, 2)); }
}
