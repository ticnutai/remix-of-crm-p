import fs from 'fs';

// Extract unique stage values from clients in each backup
const files = [
  ['backup_to_import.json', 'data'],
  ['backup_2026-01-27.json', 'data'],
  ['backup_2026-01-27 (1).json', 'data'],
  ['backup-2026-01-20 (2).json', 'root'],
  ['\u200f\u200fbackup_2026-01-27 (1) - \u05e2\u05d5\u05ea\u05e7.json', 'unknown']
];

for (const [f, type] of files) {
  console.log('\n========== ' + f + ' ==========');
  if (!fs.existsSync(f)) {
    console.log('NOT FOUND');
    continue;
  }
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  let clients;
  if (type === 'data' && data.data) {
    clients = data.data.clients || data.data.Client || [];
  } else if (type === 'root') {
    clients = data.Client || data.clients || [];
  } else {
    // Try to figure it out
    if (data.data) clients = data.data.clients || data.data.Client || [];
    else clients = data.Client || data.clients || [];
  }
  
  const stages = new Set();
  for (const c of clients) {
    if (c.stage) stages.add(c.stage);
  }
  console.log('Unique client stages (' + stages.size + '):');
  const sorted = [...stages].sort();
  sorted.forEach(s => console.log('  - ' + s));
  
  // Check if any of those stages contain תבע
  const tbaStages = sorted.filter(s => s.includes('תבע') || s.includes('תב'));
  if (tbaStages.length > 0) {
    console.log('*** FOUND תבע stages:', tbaStages);
  }
  
  // Also check CustomSpreadsheet custom_stage_options if exists
  const spreadsheets = (data.data && (data.data.spreadsheets || data.data.CustomSpreadsheet)) || data.CustomSpreadsheet || data.spreadsheets || [];
  if (spreadsheets.length > 0) {
    for (const ss of spreadsheets) {
      if (ss.custom_stage_options) {
        console.log('  CustomSpreadsheet custom_stage_options:', JSON.stringify(ss.custom_stage_options));
      }
    }
  }
}

// Also check client names containing תבע and their stages
console.log('\n========== Clients with תבע in name ==========');
const data = JSON.parse(fs.readFileSync('backup_to_import.json', 'utf8'));
const clients = data.data.clients || [];
for (const c of clients) {
  if (c.name && c.name.includes('תבע')) {
    console.log('  Name:', c.name, '| Stage:', c.stage || 'N/A');
  }
}
