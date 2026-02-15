const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

async function run() {
  console.log('Authenticating...');
  const authRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email: 'jj1212t@gmail.com', password: '543211' })
  });
  const auth = await authRes.json();
  if (!auth.access_token) { console.log('AUTH FAILED:', JSON.stringify(auth)); return; }
  const token = auth.access_token;
  const headers = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + token };
  console.log('Authenticated OK');

  // List cloud backup files
  const listRes = await fetch(SUPABASE_URL + '/storage/v1/object/list/backups', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: 'jj1212t@gmail.com/', limit: 100, offset: 0 })
  });
  const files = await listRes.json();
  console.log('\n=== CLOUD BACKUP FILES ===');
  if (!Array.isArray(files)) {
    console.log('ERROR listing files:', JSON.stringify(files).substring(0, 500));
    return;
  }
  files.forEach(f => console.log('  ' + f.name + ' (' + Math.round((f.metadata?.size || 0) / 1024) + 'KB, updated: ' + (f.updated_at || 'unknown') + ')'));
  console.log('Total files:', files.length);

  for (const f of files) {
    if (!f.name || f.name === '.emptyFolderPlaceholder') continue;
    const path = encodeURIComponent('jj1212t@gmail.com') + '/' + encodeURIComponent(f.name);
    console.log('\n=== CLOUD FILE: ' + f.name + ' ===');
    
    try {
      const dlRes = await fetch(SUPABASE_URL + '/storage/v1/object/backups/' + path, { headers });
      if (!dlRes.ok) { 
        console.log('  DOWNLOAD FAILED:', dlRes.status, dlRes.statusText);
        continue; 
      }
      const text = await dlRes.text();
      console.log('  Size:', text.length, 'chars');
      
      let backup;
      try { backup = JSON.parse(text); } catch(e) { console.log('  PARSE ERROR:', e.message); continue; }

      // Show all top-level keys
      const keys = Object.keys(backup);
      console.log('  Top-level keys:', keys.join(', '));
      
      // Show array keys with counts
      const arrayKeys = keys.filter(k => Array.isArray(backup[k]));
      arrayKeys.forEach(k => console.log('    ' + k + ': ' + backup[k].length + ' items'));

      // Check for stage_templates
      if (backup.stage_templates) {
        console.log('  *** STAGE_TEMPLATES FOUND: ' + backup.stage_templates.length + ' ***');
        backup.stage_templates.forEach(t => {
          console.log('    TEMPLATE:', t.name || t.template_name || JSON.stringify(t).substring(0, 100));
        });
      }
      
      // Check for stage_template_stages
      if (backup.stage_template_stages) {
        console.log('  *** STAGE_TEMPLATE_STAGES FOUND: ' + backup.stage_template_stages.length + ' ***');
        const unique = [...new Set(backup.stage_template_stages.map(s => s.stage_name))];
        unique.forEach(n => console.log('    STAGE:', n));
      }
      
      // Check for stage_template_tasks
      if (backup.stage_template_tasks) {
        console.log('  *** STAGE_TEMPLATE_TASKS FOUND: ' + backup.stage_template_tasks.length + ' ***');
      }
      
      // Check for client_stages
      if (backup.client_stages) {
        console.log('  *** CLIENT_STAGES FOUND: ' + backup.client_stages.length + ' ***');
        const unique = [...new Set(backup.client_stages.map(s => s.stage_name))];
        unique.forEach(n => console.log('    CLIENT_STAGE:', n));
      }
      
      // Check for client_stage_tasks
      if (backup.client_stage_tasks) {
        console.log('  *** CLIENT_STAGE_TASKS FOUND: ' + backup.client_stage_tasks.length + ' ***');
      }

      // Deep text search for Hebrew terms
      const searchTerms = [
        '\u05e9\u05d9\u05e0\u05d5\u05d9 \u05ea\u05d1\u05e2',   // שינוי תבע
        '\u05e9\u05d9\u05e0\u05d5\u05d9_\u05ea\u05d1\u05e2',    // שינוי_תבע
        '\u05ea\u05d1"\u05e2',                                     // תב"ע
        '\u05ea\u05d1\u05e2',                                      // תבע
      ];
      
      for (const term of searchTerms) {
        let idx = text.indexOf(term);
        let count = 0;
        while (idx !== -1 && count < 3) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(text.length, idx + term.length + 60);
          const context = text.substring(start, end).replace(/\n/g, ' ');
          console.log('  HEBREW MATCH "' + term + '": ...' + context + '...');
          count++;
          idx = text.indexOf(term, idx + 1);
        }
      }

      // Also search for any key containing 'stage' recursively
      function findStageKeys(obj, path) {
        if (!obj || typeof obj !== 'object') return;
        for (const key of Object.keys(obj)) {
          if (/stage/i.test(key) && !['stage'].includes(key)) {
            const val = obj[key];
            const info = Array.isArray(val) ? val.length + ' items' : typeof val;
            console.log('  STAGE KEY:', path + '.' + key, '(' + info + ')');
          }
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && key !== 'data') {
            findStageKeys(obj[key], path + '.' + key);
          }
        }
      }
      // Only check top-level for arrays named with stage
      for (const k of keys) {
        if (/stage/i.test(k) && k !== 'stage') {
          console.log('  TOP-LEVEL STAGE KEY:', k);
        }
      }

    } catch (e) {
      console.log('  ERROR:', e.message);
    }
  }
  
  console.log('\n=== CLOUD BACKUP SEARCH COMPLETE ===');
}

run().catch(e => console.error('FATAL:', e));
