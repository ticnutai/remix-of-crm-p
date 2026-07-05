import { createClient } from '@supabase/supabase-js';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM');
const { data: auth } = await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const r = await fetch('https://eadeymehidcndudeycnf.supabase.co/functions/v1/onlyoffice-upload', {
  method:'POST',
  headers:{'Content-Type':'application/json', 'Authorization':'Bearer '+auth.session.access_token, 'apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM'},
  body: JSON.stringify({title:'בדיקה', fileName:'test.docx', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', originalName:'test.docx', base64:'UEsDBAoAAAAAAAA='})
});
console.log('status:', r.status);
console.log('body:', (await r.text()).slice(0,800));
