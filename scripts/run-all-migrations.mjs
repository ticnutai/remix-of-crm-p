// Run all migrations in order
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

const ADMIN_EMAIL = 'jj1212t@gmail.com';
const ADMIN_PASSWORD = '543211';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  
  if (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
  
  console.log('✅ Logged in as:', data.user.email);
  return true;
}

async function getMigrationHistory() {
  const { data, error } = await supabase
    .from('migration_logs')
    .select('name, success')
    .order('executed_at', { ascending: false });
  
  if (error) {
    console.log('⚠️  No migration history found (table may not exist yet)');
    return [];
  }
  
  return data || [];
}

async function runMigration(name, sql) {
  const { data, error } = await supabase.rpc('execute_safe_migration', {
    p_migration_name: name,
    p_migration_sql: sql
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return data || { success: false, error: 'Unknown error' };
}

async function runAllMigrations() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('   🚀 Run All Migrations');
  console.log('══════════════════════════════════════════════════\n');
  
  if (!await login()) {
    return;
  }
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^202\d+.*\.sql$/) && !f.includes('clean') && !f.includes('IMPORT') && !f.includes('CHECK'))
    .sort();
  
  console.log(`\n📋 Found ${files.length} migration files\n`);
  
  const history = await getMigrationHistory();
  const executed = new Set(history.filter(h => h.success).map(h => h.name));
  
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    const name = file.replace('.sql', '');
    
    if (executed.has(name)) {
      console.log(`⏭️  Skipping ${name} (already executed)`);
      skipCount++;
      continue;
    }
    
    console.log(`\n🔄 Running: ${name}`);
    
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const result = await runMigration(name, sql);
    
    if (result.success) {
      console.log(`✅ Success: ${name}`);
      successCount++;
    } else {
      console.log(`❌ Failed: ${name}`);
      console.log(`   Error: ${result.error}`);
      failCount++;
      
      // Don't stop on error, continue with next migration
    }
  }
  
  console.log('\n══════════════════════════════════════════════════');
  console.log('   📊 Summary');
  console.log('══════════════════════════════════════════════════');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('══════════════════════════════════════════════════\n');
}

runAllMigrations();
