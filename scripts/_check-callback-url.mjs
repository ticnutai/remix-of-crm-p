import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
const { data: auth, error: ae } = await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
if (ae || !auth?.session) { console.log('LOGIN FAILED'); process.exit(2); }
const r = await fetch('https://eadeymehidcndudeycnf.supabase.co/functions/v1/onlyoffice-config', {
  method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.session.access_token,'apikey':ANON},
  body: JSON.stringify({documentId:'6462cc1e-6ac9-45e6-9e52-507861763b69'})
});
const j = await r.json().catch(()=>({}));
console.log('status:', r.status, '| callbackUrl:', j?.config?.editorConfig?.callbackUrl || 'n/a');
