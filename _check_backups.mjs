const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

async function run() {
  const authRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email: 'jj1212t@gmail.com', password: '543211' })
  });
  const auth = await authRes.json();
  const token = auth.access_token;
  const headers = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + token };

  // List cloud backup files
  const listRes = await fetch(SUPABASE_URL + '/storage/v1/object/list/backups', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: 'jj1212t@gmail.com/', limit: 100, offset: 0 })
  });
  const files = await listRes.json();
  console.log('=== CLOUD BACKUP FILES ===');
  if (Array.isArray(files)) {
    files.forEach(f => console.log('  ' + f.name + ' (' + Math.round((f.metadata?.size || 0) / 1024) + 'KB)'));
  } else {
    console.log(JSON.stringify(files).substring(0, 300));
    return;
  }

  for (const f of files) {
    const path = 'jj1212t@gmail.com/' + f.name;
    console.log('\n--- ' + f.name + ' ---');
    const dlRes = await fetch(SUPABASE_URL + '/storage/v1/object/backups/' + path, { headers });
    if (!dlRes.ok) { console.log('  DOWNLOAD FAILED'); continue; }
    const backup = await dlRes.json();
    if (backup.error) { console.log('  Error: ' + backup.message); continue; }

    const keys = Object.keys(backup);
    const arrayKeys = keys.filter(k => Array.isArray(backup[k]));
    console.log('  Tables: ' + arrayKeys.join(', '));

    if (backup.stage_templates) {
      console.log('  stage_templates: ' + backup.stage_templates.length);
      backup.stage_templates.forEach(t => console.log('    TEMPLATE: ' + t.name));
    }
    if (backup.stage_template_stages) {
      console.log('  stage_template_stages: ' + backup.stage_template_stages.length);
      const unique = [...new Set(backup.stage_template_stages.map(s => s.stage_name))];
      unique.forEach(n => console.log('    STAGE: ' + n));
    }
    if (backup.stage_template_tasks) {
      console.log('  stage_template_tasks: ' + backup.stage_template_tasks.length);
    }
    if (backup.client_stages) {
      console.log('  client_stages: ' + backup.client_stages.length);
      const unique = [...new Set(backup.client_stages.map(s => s.stage_name))];
      unique.forEach(n => console.log('    CLIENT_STAGE: ' + n));
    }
    if (backup.client_stage_tasks) {
      console.log('  client_stage_tasks: ' + backup.client_stage_tasks.length);
    }

    // Deep text search for תב"ע related terms
    const fullText = JSON.stringify(backup);
    const searchTerms = ['\u05e9\u05d9\u05e0\u05d5\u05d9 \u05ea\u05d1', '\u05ea\u05d1\u05e2', '\u05ea\u05d1"\u05e2', '\u05e9\u05d9\u05e0\u05d5\u05d9_\u05ea\u05d1'];
    for (const term of searchTerms) {
      const idx = fullText.indexOf(term);
      if (idx !== -1) {
        console.log('  ** FOUND: "' + term + '" **');
        console.log('    context: ' + fullText.substring(Math.max(0, idx - 40), idx + 60));
      }
    }
  }

  // Also check local backup files
  const fs = await import('fs');
  const localFiles = ['backup_to_import.json', 'backup_2026-01-27.json', 'backup-2026-01-20 (2).json'];
  for (const file of localFiles) {
    try {
      if (!fs.existsSync(file)) continue;
      console.log('\n--- LOCAL: ' + file + ' ---');
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw);
      
      // Check nested data structure
      const root = data.data || data;
      
      for (const [key, val] of Object.entries(root)) {
        if (!Array.isArray(val)) continue;
        if (key.includes('stage') || key.includes('template')) {
          console.log('  ' + key + ': ' + val.length);
          if (key === 'stage_templates') val.forEach(t => console.log('    TEMPLATE: ' + (t.name || JSON.stringify(t).substring(0, 60))));
          if (key === 'stage_template_stages') {
            const unique = [...new Set(val.map(s => s.stage_name))];
            unique.forEach(n => console.log('    STAGE: ' + n));
          }
          if (key === 'client_stages') {
            const unique = [...new Set(val.map(s => s.stage_name))];
            unique.forEach(n => console.log('    CLIENT_STAGE: ' + n));
          }
        }
      }

      // Deep text search
      const searchTerms2 = ['\u05e9\u05d9\u05e0\u05d5\u05d9 \u05ea\u05d1', '\u05ea\u05d1\u05e2', '\u05ea\u05d1"\u05e2', '\u05e9\u05d9\u05e0\u05d5\u05d9_\u05ea\u05d1'];
      for (const term of searchTerms2) {
        const idx = raw.indexOf(term);
        if (idx !== -1) {
          console.log('  ** FOUND: "' + term + '" **');
          console.log('    context: ' + raw.substring(Math.max(0, idx - 40), idx + 60));
        }
      }
    } catch (e) {
      console.log('  Error reading ' + file + ': ' + e.message);
    }
  }
}
run().catch(e => console.error(e));
