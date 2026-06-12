import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eadeymehidcndudeycnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM',
);

const { error: authErr } = await sb.auth.signInWithPassword({
  email: 'jj1212t@gmail.com',
  password: '543211',
});

if (authErr) {
  console.error('AUTH_ERR', authErr.message);
  process.exit(1);
}

const sql = "SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='community_themes' ORDER BY policyname;";
const { data, error } = await sb.rpc('execute_safe_migration', {
  p_migration_name: 'debug_policy_list',
  p_migration_sql: sql,
});

if (error) {
  console.error('RPC_ERR', error.message);
  process.exit(1);
}

console.log('RPC_DATA', JSON.stringify(data));
await sb.auth.signOut();
