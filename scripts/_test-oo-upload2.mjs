import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
const { data: auth, error: ae } = await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
if (ae) { console.log('login err:', ae.message); process.exit(1); }
const r = await fetch('https://eadeymehidcndudeycnf.supabase.co/functions/v1/onlyoffice-upload', {
  method:'POST',
  headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.session.access_token,'apikey':ANON},
  body: JSON.stringify({title:'מסמך חדש', fileName:'מסמך חדש.docx', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', originalName:'מסמך חדש.docx', base64:'UEsDBAoAAAAAAAA='})
});
console.log('status:', r.status);
console.log('body:', (await r.text()).slice(0,500));
