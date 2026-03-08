const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

async function run() {
  const authRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email: 'jj1212t@gmail.com', password: '543211' })
  });
  const auth = await authRes.json();
  if (!auth.access_token) { console.log('AUTH FAILED:', JSON.stringify(auth)); return; }
  const token = auth.access_token;
  const headers = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + token };

  // Try listing with empty prefix first
  console.log('=== Listing with empty prefix ===');
  const res1 = await fetch(SUPABASE_URL + '/storage/v1/object/list/backups', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 100, offset: 0 })
  });
  const files1 = await res1.json();
  console.log('Result:', JSON.stringify(files1).substring(0, 1000));

  // Try listing with jj1212t prefix (folder)
  console.log('\n=== Listing with jj1212t@gmail.com/ prefix ===');
  const res2 = await fetch(SUPABASE_URL + '/storage/v1/object/list/backups', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: 'jj1212t@gmail.com/', limit: 100, offset: 0 })
  });
  const files2 = await res2.json();
  console.log('Result:', JSON.stringify(files2).substring(0, 1000));

  // Try listing buckets
  console.log('\n=== Listing all buckets ===');
  const res3 = await fetch(SUPABASE_URL + '/storage/v1/bucket', { headers });
  const buckets = await res3.json();
  console.log('Buckets:', JSON.stringify(buckets).substring(0, 500));

  // Try listing each bucket
  if (Array.isArray(buckets)) {
    for (const b of buckets) {
      console.log('\n=== Bucket: ' + b.name + ' ===');
      const res = await fetch(SUPABASE_URL + '/storage/v1/object/list/' + b.name, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: '', limit: 100, offset: 0 })
      });
      const items = await res.json();
      if (Array.isArray(items)) {
        items.forEach(f => {
          const isFolder = f.id === null;
          console.log('  ' + (isFolder ? '[FOLDER] ' : '') + f.name + ' (' + Math.round((f.metadata?.size || 0) / 1024) + 'KB)');
        });
      } else {
        console.log('  ', JSON.stringify(items).substring(0, 300));
      }
    }
  }

  // Also try to check if backups are in the DB directly (not storage)
  console.log('\n=== Checking Supabase DB for stage_templates table ===');
  const dbRes = await fetch(SUPABASE_URL + '/rest/v1/stage_templates?select=*', { headers });
  if (dbRes.ok) {
    const data = await dbRes.json();
    console.log('stage_templates rows:', data.length);
    data.forEach(t => console.log('  TEMPLATE:', t.name, '| id:', t.id));
  } else {
    console.log('stage_templates table:', dbRes.status, dbRes.statusText);
  }

  console.log('\n=== Checking Supabase DB for stage_template_stages table ===');
  const dbRes2 = await fetch(SUPABASE_URL + '/rest/v1/stage_template_stages?select=*', { headers });
  if (dbRes2.ok) {
    const data = await dbRes2.json();
    console.log('stage_template_stages rows:', data.length);
    data.forEach(s => console.log('  STAGE:', s.stage_name, '| template_id:', s.template_id, '| order:', s.stage_order));
  } else {
    console.log('stage_template_stages table:', dbRes2.status, dbRes2.statusText);
  }

  console.log('\n=== Checking Supabase DB for client_stages table ===');
  const dbRes3 = await fetch(SUPABASE_URL + '/rest/v1/client_stages?select=*&limit=50', { headers });
  if (dbRes3.ok) {
    const data = await dbRes3.json();
    console.log('client_stages rows:', data.length);
    const unique = [...new Set(data.map(s => s.stage_name))];
    unique.forEach(n => console.log('  UNIQUE STAGE:', n));
  } else {
    console.log('client_stages table:', dbRes3.status, dbRes3.statusText);
  }

  console.log('\n=== Checking Supabase DB for client_stage_tasks table ===');
  const dbRes4 = await fetch(SUPABASE_URL + '/rest/v1/client_stage_tasks?select=*&limit=20', { headers });
  if (dbRes4.ok) {
    const data = await dbRes4.json();
    console.log('client_stage_tasks rows:', data.length);
  } else {
    console.log('client_stage_tasks table:', dbRes4.status, dbRes4.statusText);
  }
  
  console.log('\n=== DONE ===');
}

run().catch(e => console.error('FATAL:', e));
