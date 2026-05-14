import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eadeymehidcndudeycnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM'
);

await sb.auth.signInWithPassword({ email: 'jj1212t@gmail.com', password: '543211' });

const sql = `
  SELECT p.id, p.email, p.is_active, p.approval_status, 
         COALESCE(STRING_AGG(ur.role::text, ', '), 'NO ROLES') as roles
  FROM profiles p 
  LEFT JOIN user_roles ur ON ur.user_id = p.id 
  WHERE p.email IN ('mali.f.arch2@gmail.com','jj1212t@gmail.com')
  GROUP BY p.id, p.email, p.is_active, p.approval_status
`;

const { data, error } = await sb.rpc('execute_safe_migration', {
  p_migration_name: 'check_mali_roles',
  p_migration_sql: sql
});

if (error) {
  console.error('Error:', error);
} else {
  console.log(JSON.stringify(data, null, 2));
}
