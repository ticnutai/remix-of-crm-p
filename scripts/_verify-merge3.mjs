import { createClient } from '@supabase/supabase-js';
import PizZip from 'pizzip';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
const { data: auth } = await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const { data: docs } = await s.from('onlyoffice_documents').select('id,title').order('created_at',{ascending:false}).limit(1);
const r = await fetch('https://eadeymehidcndudeycnf.supabase.co/functions/v1/onlyoffice-file', {
  method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth.session.access_token,'apikey':ANON},
  body: JSON.stringify({action:'download-url', documentId: docs[0].id})
});
const { url } = await r.json();
const buf = await (await fetch(url)).arrayBuffer();
const text = new PizZip(buf).file('word/document.xml').asText().replace(/<[^>]+>/g,'');
// extract key lines
const grab = (label) => { const i=text.indexOf(label); return i>=0? text.slice(i, i+60).replace(/\s+/g,' ').trim() : label+': (missing)'; };
console.log('doc:', docs[0].title);
console.log(grab('שם הלקוח:'));
console.log(grab('סה"כ לתשלום:'));
console.log('has payment stage line "תשלום 1":', text.includes('תשלום 1'));
console.log('leftover {סכום_כולל}?', text.includes('{סכום_כולל}'));
