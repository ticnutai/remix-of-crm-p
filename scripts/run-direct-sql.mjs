import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';  // Need this for direct SQL

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runDirectSql() {
  const sql = fs.readFileSync('supabase/migrations/20260114211550_c5f65ed2-e9cb-4906-95da-d9e975df7a25.sql', 'utf-8');
  
  console.log('Running SQL directly...');
  const { data, error } = await supabase.rpc('exec', { sql });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

runDirectSql();
