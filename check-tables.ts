// Quick script to check if V2 tables exist
// Run with: npx tsx check-tables.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxzrjgkjikglkrjcmmhe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4enJqZ2tqaWtnbGtyamNtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDAxMDUsImV4cCI6MjA4Mzk3NjEwNX0.msBnOg6bvcLr7eaGZBhjM4uPFlRXV3zcUl5fuaW9W2E'
);

const V2_TABLES = [
  'tasks',
  'calendar_events',
  'documents', 
  'call_logs',
  'reminders',
  'workflows',
  'workflow_logs',
  'custom_reports',
  'signatures',
  'contract_templates',
  'quote_templates',
  'user_preferences',
  'client_portal_tokens',
  'quotes',
  'contracts',
  'payments'
];

async function checkTables() {
  console.log('\n🔍 Checking V2 Migration Tables...\n');
  console.log('='.repeat(50));
  
  let existCount = 0;
  let missingCount = 0;
  
  for (const table of V2_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: MISSING or ERROR - ${error.message}`);
        missingCount++;
      } else {
        console.log(`✅ ${table}: EXISTS`);
        existCount++;
      }
    } catch (e: any) {
      console.log(`❌ ${table}: ERROR - ${e.message}`);
      missingCount++;
    }
  }
  
  console.log('='.repeat(50));
  console.log(`\n📊 Summary: ${existCount}/${V2_TABLES.length} tables exist`);
  
  if (missingCount > 0) {
    console.log(`\n⚠️  ${missingCount} tables are missing!`);
    console.log('👉 Run MIGRATION_CLEAN.sql in Supabase SQL Editor');
  } else {
    console.log('\n🎉 All V2 tables exist! Migration successful!');
  }
}

checkTables();
