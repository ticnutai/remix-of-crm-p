import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const ids = ['6d18be68-c83a-46d1-9eb5-22d0b7e89e22','5ef309a9-9edb-4ec4-ab57-cad01a601064'];
const { data } = await s.from('onlyoffice_documents').select('id,title,file_name,version,size_bytes,saved_at,status').in('id', ids);
console.log('DOCUMENTS:', JSON.stringify(data, null, 1));
const { data: vers } = await s.from('onlyoffice_document_versions').select('document_id,version,size_bytes,created_at').in('document_id', ids).order('created_at');
console.log('VERSIONS:', JSON.stringify(vers, null, 1));
