import { createClient } from '@supabase/supabase-js';
import PizZip from 'pizzip';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
const { data: auth } = await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const { data: docs } = await s.from('onlyoffice_documents').select('id,title').order('created_at',{ascending:false}).limit(1);
const doc = docs[0];
const r = await fetch('https://eadeymehidcndudeycnf.supabase.co/functions/v1/onlyoffice-file', {
  method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.session.access_token,'apikey':ANON},
  body: JSON.stringify({action:'download-url', documentId: doc.id})
});
const { url } = await r.json();
const buf = await (await fetch(url)).arrayBuffer();
const xml = new PizZip(buf).file('word/document.xml').asText();
const text = xml.replace(/<[^>]+>/g,'');
console.log('doc:', doc.title);
console.log('merged text:', text.slice(0,350));
console.log('leftover {שם_לקוח}?', text.includes('{שם_לקוח}'), '| contains אסולין?', text.includes('אסולין'));
