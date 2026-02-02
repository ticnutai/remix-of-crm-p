import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://eadeymehidcndudeycnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM'
);

async function main() {
  // Login
  await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });

  // Check new clients
  const { data: clients } = await supabase
    .from('clients')
    .select('name, original_id')
    .in('original_id', [
      '68b1abad175af64002301909', 
      '68dbdea396fc743b797f63f0', 
      '68bee95f66229a0168b67de1', 
      '68bee95f66229a0168b67dde'
    ]);
  
  console.log('🆕 לקוחות חדשים שנוספו:');
  clients?.forEach(c => console.log(`   ✓ ${c.name}`));

  // Count total
  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  const { count: logCount } = await supabase
    .from('time_entries')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 סיכום כולל:`);
  console.log(`   לקוחות: ${clientCount}`);
  console.log(`   לוגים: ${logCount}`);
}

main();
