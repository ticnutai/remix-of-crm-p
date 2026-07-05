import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const { data, error } = await s.from('quote_templates').select('id,name,description,category,html_content').order('created_at',{ascending:false}).limit(2);
if (error) { console.log('ERR', error.message); process.exit(1); }
for (const t of data) console.log({id:t.id, name:t.name, desc:t.description, category:t.category, htmlLen:(t.html_content||'').length, htmlSnippet:(t.html_content||'').replace(/\s+/g,' ').slice(0,180)});
