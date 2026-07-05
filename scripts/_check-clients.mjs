import { createClient } from '@supabase/supabase-js';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const s = createClient('https://eadeymehidcndudeycnf.supabase.co', ANON);
await s.auth.signInWithPassword({email:'jj1212t@gmail.com',password:'543211'});
const { data, error, count } = await s.from('clients').select('id,name,phone', {count:'exact'}).order('name').limit(5);
console.log('count:', count, 'err:', error?.message || null);
console.log((data||[]).map(c=>c.name).join(' | '));
