import fs from 'fs';

const files = [
  'backup_to_import.json',
  'backup_2026-01-27.json', 
  'backup_2026-01-27 (1).json',
  'backup-2026-01-20 (2).json'
];

for (const f of files) {
  console.log('========== FILE:', f, '==========');
  if (!fs.existsSync(f)) { console.log('NOT FOUND'); continue; }
  const raw = fs.readFileSync(f, 'utf8');
  console.log('Size:', raw.length, 'chars');
  let data;
  try { data = JSON.parse(raw); } catch(e) { console.log('PARSE ERROR:', e.message); continue; }
  
  // Find all keys recursively
  function findKeys(obj, path) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const fullPath = path ? path + '.' + key : key;
      if (/stage_template|client_stages/i.test(key)) {
        const val = obj[key];
        const len = Array.isArray(val) ? val.length : typeof val === 'object' ? Object.keys(val).length : 1;
        console.log('  KEY FOUND:', fullPath, '(items:', len, ')');
        if (Array.isArray(val)) {
          val.forEach((item, i) => {
            if (item.name) console.log('    [' + i + '] name:', item.name);
            if (item.template_name) console.log('    [' + i + '] template_name:', item.template_name);
            if (item.stage_name) console.log('    [' + i + '] stage_name:', item.stage_name);
          });
        }
      }
      if (typeof obj[key] === 'object') findKeys(obj[key], fullPath);
    }
  }
  findKeys(data, '');
  
  // Search for Hebrew terms in the raw text near stage-related context
  const stageRegex = /stage_template|stage_name|template_name/gi;
  let hasStageContext = stageRegex.test(raw);
  console.log('  Has stage-related keys in raw text:', hasStageContext);
  
  // Search for תבע in any context
  const hebrewRegex = /תב"?ע|שינוי\s*תב/g;
  const hebrewMatches = [];
  let m;
  while ((m = hebrewRegex.exec(raw)) !== null) {
    const start = Math.max(0, m.index - 50);
    const end = Math.min(raw.length, m.index + m[0].length + 50);
    hebrewMatches.push(raw.substring(start, end).replace(/\n/g, ' '));
  }
  console.log('  Hebrew תבע matches:', hebrewMatches.length);
  hebrewMatches.slice(0, 10).forEach((match, i) => {
    console.log('    [' + i + ']', match);
  });
  
  console.log('');
}

// Also show top-level keys for backup_to_import.json specifically
console.log('========== backup_to_import.json TOP LEVEL KEYS ==========');
try {
  const raw = fs.readFileSync('backup_to_import.json', 'utf8');
  const data = JSON.parse(raw);
  if (data.data) {
    console.log('Keys under data:', Object.keys(data.data));
  } else {
    console.log('Top-level keys:', Object.keys(data));
  }
} catch(e) {
  console.log('Error:', e.message);
}
