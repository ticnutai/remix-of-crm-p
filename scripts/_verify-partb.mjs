// Simulate Part B: load a quote_template as MergeQuote and build merge data
import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const { data: t } = await s.from('quote_templates').select('id,name,base_price,vat_rate,payment_schedule').eq('is_active',true).gt('base_price',0).limit(1);
if(!t?.length){ console.log('no template with base_price>0'); process.exit(0); }
const tpl=t[0];
const base=Number(tpl.base_price)||0, vat=Number(tpl.vat_rate)||0;
const total=base+base*vat/100;
console.log('template:', tpl.name, '| base:', base, '| vat:', vat, '| total:', total);
const ps=Array.isArray(tpl.payment_schedule)?tpl.payment_schedule:[];
console.log('payment stages ->', ps.map((p,i)=>`${i+1}. ${p.description} ${p.percentage}% = ₪${Math.round((p.percentage||0)*total/100)}`).join(' | ') || '(none)');
