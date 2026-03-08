import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eadeymehidcndudeycnf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Login first
async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'jj1212t@gmail.com',
    password: '543211'
  });
  if (error) {
    console.error('Login failed:', error.message);
    return false;
  }
  console.log('✅ Logged in as:', data.user.email);
  return true;
}

async function checkStages() {
  // Login first
  if (!await login()) return;
  
  console.log('\n📊 בודק נתוני שלבים ותבניות בענן...\n');
  
  // Check stage_templates
  const { data: templates, error: e1 } = await supabase
    .from('stage_templates')
    .select('*');
  
  console.log('=== תבניות שלבים (stage_templates) ===');
  console.log('מספר:', templates?.length || 0);
  if (e1) console.log('שגיאה:', e1.message);
  if (templates && templates.length > 0) {
    templates.forEach(t => console.log(`  - ${t.name} (${t.id})`));
  }
  
  // Check stage_template_stages
  const { data: templateStages, error: e2 } = await supabase
    .from('stage_template_stages')
    .select('*');
  
  console.log('\n=== שלבים בתבניות (stage_template_stages) ===');
  console.log('מספר:', templateStages?.length || 0);
  if (e2) console.log('שגיאה:', e2.message);
  if (templateStages && templateStages.length > 0) {
    templateStages.slice(0, 10).forEach(s => console.log(`  - ${s.stage_name}`));
  }
  
  // Check stage_template_tasks
  const { data: templateTasks, error: e3 } = await supabase
    .from('stage_template_tasks')
    .select('*');
  
  console.log('\n=== משימות בתבניות (stage_template_tasks) ===');
  console.log('מספר:', templateTasks?.length || 0);
  if (e3) console.log('שגיאה:', e3.message);
  
  // Check client_stages
  const { data: clientStages, error: e4 } = await supabase
    .from('client_stages')
    .select('*');
  
  console.log('\n=== שלבי לקוחות (client_stages) ===');
  console.log('מספר:', clientStages?.length || 0);
  if (e4) console.log('שגיאה:', e4.message);
  if (clientStages && clientStages.length > 0) {
    clientStages.slice(0, 10).forEach(s => console.log(`  - ${s.stage_name} (client: ${s.client_id?.slice(0, 8)}...)`));
  }
  
  // Check client_stage_tasks
  const { data: clientTasks, error: e5 } = await supabase
    .from('client_stage_tasks')
    .select('*');
  
  console.log('\n=== משימות לקוחות (client_stage_tasks) ===');
  console.log('מספר:', clientTasks?.length || 0);
  if (e5) console.log('שגיאה:', e5.message);
  if (clientTasks && clientTasks.length > 0) {
    clientTasks.slice(0, 10).forEach(t => console.log(`  - ${t.title || t.task_title}`));
  }
  
  // List all clients - try with different method
  const { data: allClients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name');
  
  console.log('\n=== כל הלקוחות ===');
  if (clientsError) console.log('שגיאה:', clientsError.message);
  console.log('סה״כ:', allClients?.length || 0);
  if (allClients && allClients.length > 0) {
    allClients.forEach(c => console.log(`  - ${c.name}`));
  }
  
  // Group stages by client_id to see all clients with stages
  const { data: stagesByClient } = await supabase
    .from('client_stages')
    .select('client_id, stage_name');
  
  if (stagesByClient) {
    const clientIds = [...new Set(stagesByClient.map(s => s.client_id))];
    console.log('\n=== לקוחות עם שלבים ===');
    console.log('מספר לקוחות:', clientIds.length);
    for (const cid of clientIds) {
      const stages = stagesByClient.filter(s => s.client_id === cid);
      // Try to find client name
      const client = allClients?.find(c => c.id === cid);
      const clientName = client?.name || cid.slice(0,8) + '...';
      console.log(`  - ${clientName} (${stages.length} שלבים)`);
    }
  }
  
  // Get the client "שניאורסון זאבי"
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .ilike('name', '%שניאורסון%');
  
  console.log('\n=== לקוח שניאורסון זאבי ===');
  if (clients && clients.length > 0) {
    const client = clients[0];
    console.log('נמצא:', client.name, `(${client.id})`);
    
    // Check stages for this client
    const { data: stages } = await supabase
      .from('client_stages')
      .select('*')
      .eq('client_id', client.id);
    
    console.log('שלבים:', stages?.length || 0);
    if (stages && stages.length > 0) {
      stages.forEach(s => console.log(`  - ${s.stage_name}`));
    }
    
    // Check tasks for this client
    const { data: tasks } = await supabase
      .from('client_stage_tasks')
      .select('*')
      .eq('client_id', client.id);
    
    console.log('משימות:', tasks?.length || 0);
  } else {
    console.log('לא נמצא לקוח עם השם שניאורסון');
  }
  
  console.log('\n✅ סיום בדיקה\n');
}

checkStages().catch(console.error);
