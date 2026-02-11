// Check auth.users vs profiles
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  // Login as admin
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });
  
  if (authErr) {
    console.error('Login failed:', authErr.message);
    return;
  }
  console.log('Logged in as admin');

  // Check identities - GoTrue uses this for user lookup  
  const identitySql = `
    CREATE OR REPLACE FUNCTION public.check_auth_identities()
    RETURNS TABLE(
      user_email text,
      identity_provider text,
      identity_email text,
      identity_created text,
      identity_last_signin text,
      has_identity boolean
    ) 
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public', 'auth'
    AS $fn$
    BEGIN
      RETURN QUERY
      SELECT 
        au.email::text as user_email,
        COALESCE(i.provider, 'NO_IDENTITY')::text as identity_provider,
        COALESCE(i.identity_data->>'email', 'N/A')::text as identity_email,
        COALESCE(i.created_at::text, 'N/A')::text as identity_created,
        COALESCE(i.last_sign_in_at::text, 'N/A')::text as identity_last_signin,
        (i.id IS NOT NULL) as has_identity
      FROM auth.users au
      LEFT JOIN auth.identities i ON i.user_id = au.id
      ORDER BY au.email;
    END;
    $fn$;

    NOTIFY pgrst, 'reload schema';
  `;

  const { data: idData, error: idErr } = await supabase.rpc('execute_safe_migration', {
    p_migration_name: 'create_identity_check_' + Date.now(),
    p_migration_sql: identitySql
  });
  console.log('Identity function created:', idData?.success);

  await new Promise(r => setTimeout(r, 3000));

  const { data: identities, error: iErr } = await supabase.rpc('check_auth_identities');
  if (iErr) {
    console.log('Identity check error:', iErr.message);
  } else {
    console.log('\n=== AUTH IDENTITIES ===');
    console.table(identities);
  }

  // Check MFA factors
  const mfaSql = `
    CREATE OR REPLACE FUNCTION public.check_mfa_status()
    RETURNS TABLE(
      user_email text,
      has_mfa boolean,
      factor_type text
    ) 
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public', 'auth'
    AS $fn$
    BEGIN
      RETURN QUERY
      SELECT 
        au.email::text as user_email,
        (f.id IS NOT NULL) as has_mfa,
        COALESCE(f.factor_type::text, 'none') as factor_type
      FROM auth.users au
      LEFT JOIN auth.mfa_factors f ON f.user_id = au.id
      ORDER BY au.email;
    END;
    $fn$;

    NOTIFY pgrst, 'reload schema';
  `;

  const { data: mfaData } = await supabase.rpc('execute_safe_migration', {
    p_migration_name: 'create_mfa_check_' + Date.now(),
    p_migration_sql: mfaSql
  });
  console.log('MFA function created:', mfaData?.success);

  await new Promise(r => setTimeout(r, 3000));

  const { data: mfa, error: mErr } = await supabase.rpc('check_mfa_status');
  if (mErr) {
    console.log('MFA check error:', mErr.message);
  } else {
    console.log('\n=== MFA STATUS ===');
    console.table(mfa);
  }
}

run().then(() => process.exit(0));
