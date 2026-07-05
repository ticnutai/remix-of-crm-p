import { createClient } from '@supabase/supabase-js';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM');
await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const { data, error } = await s.from('onlyoffice_documents').select('id').limit(1);
console.log('table onlyoffice_documents:', error ? 'MISSING/ERR: '+error.message : 'EXISTS');
for (const fn of ['onlyoffice-upload','onlyoffice-config','onlyoffice-callback','onlyoffice-file']) {
  const r = await fetch('https://eadeymehidcndudeycnf.supabase.co/functions/v1/'+fn, {method:'OPTIONS'});
  console.log(fn, '->', r.status);
}
