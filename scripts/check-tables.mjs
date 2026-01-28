import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://eadeymehidcndudeycnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM'
);

async function main() {
  await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });

  // Get custom tables
  const { data: tables } = await supabase
    .from('custom_tables')
    .select('id, display_name, columns');
  
  console.log('📋 טבלאות מותאמות אישית:');
  console.log('');
  
  for (const table of tables || []) {
    const columns = typeof table.columns === 'string' 
      ? JSON.parse(table.columns) 
      : table.columns || [];
    
    // Count rows
    const { count } = await supabase
      .from('custom_table_data')
      .select('*', { count: 'exact', head: true })
      .eq('table_id', table.id);
    
    console.log(`📊 ${table.display_name}`);
    console.log(`   עמודות: ${columns.length}`);
    console.log(`   שורות: ${count}`);
    console.log('');
  }
}

main();
