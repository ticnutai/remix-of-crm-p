import fs from 'fs';

// Check the copy file
const copyFile = 'backup_2026-01-27 (1) - עותק.json';
console.log('========== Checking copy file ==========');
if (fs.existsSync(copyFile)) {
  const raw = fs.readFileSync(copyFile, 'utf8');
  console.log('Size:', raw.length, 'chars');
  const data = JSON.parse(raw);
  if (data.data) console.log('Keys under data:', Object.keys(data.data));
  else console.log('Top-level keys:', Object.keys(data));
  console.log('Has stage-related keys:', /stage_template|client_stages/i.test(raw));
} else {
  // Try finding files with Hebrew chars
  const dir = fs.readdirSync('.');
  const matches = dir.filter(f => f.includes('עותק') || f.includes('backup'));
  console.log('Files matching backup/copy pattern:', matches);
}

// Deep analysis of ALL files: check all table names across all backups
console.log('\n========== Deep key analysis for each backup ==========');
const files = [
  'backup_to_import.json',
  'backup_2026-01-27.json', 
  'backup_2026-01-27 (1).json',
  'backup-2026-01-20 (2).json'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log('\n--- ' + f + ' ---');
  
  // Show all top-level keys (and nested under data if exists)
  const root = data.data || data;
  const keys = Object.keys(root);
  console.log('All keys (' + keys.length + '):', keys.join(', '));
  
  // For keys that are arrays, show count
  for (const k of keys) {
    if (Array.isArray(root[k])) {
      console.log('  ' + k + ': ' + root[k].length + ' items');
      // Check if any item has stage-related fields
      if (root[k].length > 0) {
        const sample = root[k][0];
        const sampleKeys = Object.keys(sample);
        if (sampleKeys.some(sk => /stage/i.test(sk))) {
          console.log('    ** HAS STAGE FIELDS:', sampleKeys.filter(sk => /stage/i.test(sk)));
        }
      }
    }
  }
}

// Now check for stage_fixes.json
console.log('\n========== stage_fixes.json ==========');
if (fs.existsSync('stage_fixes.json')) {
  const raw = fs.readFileSync('stage_fixes.json', 'utf8');
  console.log(raw.substring(0, 2000));
}
