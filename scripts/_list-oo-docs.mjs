import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
const { data: auth, error: ae } = await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
if (ae || !auth?.session) { console.log('LOGIN FAILED'); process.exit(2); }
console.log('me:', auth.user.id, auth.user.email);
const { data, error } = await s.from('onlyoffice_documents').select('id,title,file_name,version,created_by,saved_at');
console.log(error ? 'ERR: '+error.message : JSON.stringify(data, null, 1));
