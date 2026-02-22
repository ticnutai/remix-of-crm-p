/**
 * Fix chat_participants RLS infinite recursion
 * Uses Supabase Management API (REST) to execute DDL
 */

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const EMAIL = 'jj1212t@gmail.com';
const PASSWORD = '543211';

// Each statement separately (easier to debug which fails)
const STATEMENTS = [
  {
    name: '1. Create get_my_conversation_ids() SECURITY DEFINER function',
    sql: `
      CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
      RETURNS SETOF uuid
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = public
      AS $func$
        SELECT conversation_id
        FROM public.chat_participants
        WHERE user_id = auth.uid();
      $func$;
    `
  },
  {
    name: '2. Drop recursive participants policy',
    sql: `DROP POLICY IF EXISTS "Users can view participants" ON public.chat_participants;`
  },
  {
    name: '3. Create fixed participants policy',
    sql: `
      CREATE POLICY "Users can view participants" ON public.chat_participants
        FOR SELECT USING (
          auth.uid() IS NOT NULL AND
          conversation_id IN (SELECT public.get_my_conversation_ids())
        );
    `
  },
  {
    name: '4. Drop recursive conversations policy',
    sql: `DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;`
  },
  {
    name: '5. Create fixed conversations policy',
    sql: `
      CREATE POLICY "Users can view their conversations" ON public.chat_conversations
        FOR SELECT USING (
          auth.uid() IS NOT NULL AND (
            created_by = auth.uid() OR
            id IN (SELECT public.get_my_conversation_ids())
          )
        );
    `
  },
  {
    name: '6. Drop recursive messages policy',
    sql: `DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;`
  },
  {
    name: '7. Create fixed messages policy',
    sql: `
      CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
        FOR SELECT USING (
          auth.uid() IS NOT NULL AND
          conversation_id IN (SELECT public.get_my_conversation_ids())
        );
    `
  },
];

async function runSqlViaRpc(token, sql, name) {
  // Try via execute_safe_migration RPC
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_safe_migration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      p_migration_name: name.replace(/\s+/g, '_'),
      p_migration_sql: sql.trim()
    })
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, data: json };
}

async function main() {
  console.log('═'.repeat(55));
  console.log('  🔧 Chat RLS Recursion Fix');
  console.log('═'.repeat(55));

  // 1. Login
  console.log('\n🔐 Logging in...');
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const auth = await authRes.json();
  if (!auth.access_token) {
    console.error('❌ Login failed:', JSON.stringify(auth));
    process.exit(1);
  }
  console.log('✅ Logged in as:', auth.user?.email);
  const token = auth.access_token;

  // 2. Run each statement
  let allOk = true;
  for (const stmt of STATEMENTS) {
    console.log(`\n▶ ${stmt.name}`);
    const result = await runSqlViaRpc(token, stmt.sql, stmt.name);
    
    if (result.ok) {
      const d = result.data;
      if (d && d.success === false) {
        console.error(`  ❌ Failed: ${d.error}`);
        allOk = false;
      } else {
        console.log(`  ✅ OK (status ${result.status})`);
      }
    } else {
      const errMsg = result.data?.message || result.data?.raw || JSON.stringify(result.data);
      console.error(`  ❌ HTTP ${result.status}: ${errMsg}`);
      
      // If execute_safe_migration doesn't exist, print SQL to paste manually
      if (result.status === 404 || errMsg.includes('does not exist')) {
        console.log('\n  ⚠️  RPC not available. Paste this SQL in Supabase SQL Editor:');
        console.log('  ' + stmt.sql.trim().replace(/\n/g, '\n  '));
      }
      allOk = false;
    }
  }

  // 3. Verify fix
  console.log('\n🧪 Testing fix - fetching conversations...');
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?select=id,title&limit=5`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  const testData = await testRes.json();
  if (Array.isArray(testData)) {
    console.log(`✅ SUCCESS! Conversations loaded: ${testData.length} rows`);
    testData.forEach(c => console.log(`   - ${c.id?.slice(0,8)} ${c.title || '(no title)'}`));
  } else {
    console.error('❌ Still failing:', JSON.stringify(testData).slice(0, 300));
  }

  console.log('\n' + (allOk ? '🎉 All done!' : '⚠️  Some steps failed - check above'));
}

main().catch(console.error);
