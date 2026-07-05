import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
const { data: auth, error: ae } = await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
if (ae || !auth?.session) { console.log('FAIL auth'); process.exit(1); }
const { data, error } = await s.from('onlyoffice_documents').select('id').limit(1);
if (error) { console.log('FAIL rest: '+error.message.slice(0,80)); process.exit(1); }
console.log('ALL OK (auth+rest)');
process.exit(0);
