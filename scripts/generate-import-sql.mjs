/**
 * יוצר קובצי SQL לייבוא נתונים מגיבוי
 * הרץ: node scripts/generate-import-sql.mjs
 * ואז הרץ את קבצי ה-SQL ב-Supabase SQL Editor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// קובץ הגיבוי
const BACKUP_FILE = path.join(__dirname, '..', 'backup_2026-01-27 (1).json');
const OUTPUT_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str !== 'string') return `'${JSON.stringify(str).replace(/'/g, "''")}'`;
  return `'${str.replace(/'/g, "''")}'`;
}

function generateClientInserts(clients) {
  const lines = [];
  lines.push('-- ייבוא לקוחות מגיבוי');
  lines.push('-- נוצר אוטומטית ב-' + new Date().toISOString());
  lines.push('');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('    v_user_id UUID;');
  lines.push('BEGIN');
  lines.push('    -- קבלת משתמש לייבוא');
  lines.push("    SELECT id INTO v_user_id FROM auth.users LIMIT 1;");
  lines.push('    IF v_user_id IS NULL THEN');
  lines.push("        RAISE EXCEPTION 'אין משתמשים במערכת';");
  lines.push('    END IF;');
  lines.push('');
  lines.push('    -- מחיקת לקוחות מיובאים קודמים (אופציונלי)');
  lines.push('    -- DELETE FROM time_entries WHERE client_id IN (SELECT id FROM clients WHERE original_id IS NOT NULL);');
  lines.push('    -- DELETE FROM clients WHERE original_id IS NOT NULL;');
  lines.push('');
  
  for (const client of clients) {
    const name = escapeSQL(client.name);
    const name_clean = escapeSQL(client.name_clean || client.name);
    const email = client.email ? escapeSQL(client.email) : 'NULL';
    const phone = client.phone ? escapeSQL(client.phone) : 'NULL';
    const address = client.address ? escapeSQL(client.address) : 'NULL';
    const company = client.company ? escapeSQL(client.company) : 'NULL';
    const stage = client.stage ? escapeSQL(client.stage) : 'NULL';
    const notes = client.notes ? escapeSQL(client.notes) : 'NULL';
    const source = escapeSQL(client.source || 'imported');
    const budget_range = client.budget_range ? escapeSQL(client.budget_range) : 'NULL';
    const tags = client.tags && client.tags.length > 0 
      ? `ARRAY[${client.tags.map(t => escapeSQL(t)).join(',')}]::text[]` 
      : 'ARRAY[]::text[]';
    const custom_data = client.custom_data 
      ? escapeSQL(JSON.stringify(client.custom_data)) + '::jsonb'
      : "'{}'::jsonb";
    const original_id = escapeSQL(client.id);
    const created_at = client.created_date 
      ? escapeSQL(new Date(client.created_date).toISOString())
      : 'NOW()';
    
    lines.push(`    INSERT INTO clients (name, name_clean, email, phone, address, company, stage, status, notes, source, budget_range, tags, custom_data, original_id, is_sample, user_id, created_by, created_at)`);
    lines.push(`    SELECT ${name}, ${name_clean}, ${email}, ${phone}, ${address}, ${company}, ${stage}, 'active', ${notes}, ${source}, ${budget_range}, ${tags}, ${custom_data}, ${original_id}, false, v_user_id, v_user_id, ${created_at}`);
    lines.push(`    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE original_id = ${original_id});`);
    lines.push('');
  }
  
  lines.push('END $$;');
  lines.push('');
  lines.push('-- סיכום');
  lines.push("SELECT 'לקוחות יובאו:', COUNT(*) FROM clients WHERE original_id IS NOT NULL;");
  
  return lines.join('\n');
}

function generateTimeEntriesInserts(timeLogs) {
  const lines = [];
  lines.push('-- ייבוא רישומי זמן מגיבוי');
  lines.push('-- נוצר אוטומטית ב-' + new Date().toISOString());
  lines.push('-- הרץ אחרי ייבוא הלקוחות!');
  lines.push('');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('    v_user_id UUID;');
  lines.push('    v_client_id UUID;');
  lines.push('BEGIN');
  lines.push("    SELECT id INTO v_user_id FROM auth.users LIMIT 1;");
  lines.push('    IF v_user_id IS NULL THEN');
  lines.push("        RAISE EXCEPTION 'אין משתמשים במערכת';");
  lines.push('    END IF;');
  lines.push('');
  
  for (const log of timeLogs) {
    const logDate = log.log_date || new Date().toISOString().split('T')[0];
    const startTime = `${logDate}T09:00:00Z`;
    const durationMs = (log.duration_seconds || 0) * 1000;
    const endTimeDate = new Date(new Date(startTime).getTime() + durationMs);
    const endTime = endTimeDate.toISOString();
    
    const description = escapeSQL([log.title, log.notes].filter(Boolean).join(' - ') || 'רישום זמן מיובא');
    const original_client_id = escapeSQL(log.client_id);
    const client_name_escaped = (log.client_name || '').replace(/'/g, "''");
    const is_billable = log.billable !== false ? 'true' : 'false';
    const hourly_rate = log.hourly_rate ? `${log.hourly_rate}` : 'NULL';
    const custom_data_obj = {
      original_id: log.id,
      original_client_name: log.client_name || '',
      original_created_by_id: log.created_by_id || null,
      original_user_email: log.user_email || null,
      original_user_name: log.user_name || null,
      original_log_date: log.log_date || null,
      imported_from: 'backup',
      imported_at: new Date().toISOString()
    };
    const custom_data = escapeSQL(JSON.stringify(custom_data_obj)) + '::jsonb';
    const created_at = log.created_date 
      ? escapeSQL(new Date(log.created_date).toISOString())
      : 'NOW()';
    
    lines.push(`    -- לוג עבור: ${log.client_name || 'ללא לקוח'}`);
    lines.push(`    SELECT id INTO v_client_id FROM clients WHERE original_id = ${original_client_id} LIMIT 1;`);
    lines.push(`    IF v_client_id IS NOT NULL THEN`);
    lines.push(`        INSERT INTO time_entries (user_id, client_id, description, start_time, end_time, is_billable, hourly_rate, is_running, tags, custom_data, created_at)`);
    lines.push(`        VALUES (v_user_id, v_client_id, ${description}, '${startTime}'::timestamptz, '${endTime}'::timestamptz, ${is_billable}, ${hourly_rate}, false, ARRAY[]::text[], ${custom_data}, ${created_at});`);
    lines.push(`    END IF;`);
    lines.push('');
  }
  
  lines.push('END $$;');
  lines.push('');
  lines.push('-- סיכום');
  lines.push("SELECT 'רישומי זמן יובאו:', COUNT(*) FROM time_entries WHERE (custom_data->>'imported_from') = 'backup';");
  
  return lines.join('\n');
}

async function main() {
  console.log('📂 טוען קובץ גיבוי...');
  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  console.log(`   ✓ נטענו: ${backup.statistics.clients} לקוחות, ${backup.statistics.timeLogs} לוגים`);
  
  // יצירת SQL לייבוא לקוחות
  console.log('\n📝 יוצר SQL לייבוא לקוחות...');
  const clientsSQL = generateClientInserts(backup.data.clients);
  const clientsFile = path.join(OUTPUT_DIR, 'IMPORT_1_clients.sql');
  fs.writeFileSync(clientsFile, clientsSQL, 'utf-8');
  console.log(`   ✓ נשמר: ${clientsFile}`);
  
  // יצירת SQL לייבוא רישומי זמן
  console.log('\n📝 יוצר SQL לייבוא רישומי זמן...');
  const timeLogsSQL = generateTimeEntriesInserts(backup.data.timeLogs);
  const timeLogsFile = path.join(OUTPUT_DIR, 'IMPORT_2_time_entries.sql');
  fs.writeFileSync(timeLogsFile, timeLogsSQL, 'utf-8');
  console.log(`   ✓ נשמר: ${timeLogsFile}`);
  
  console.log('\n✅ הקבצים נוצרו!');
  console.log('');
  console.log('📋 הוראות:');
  console.log('1. היכנס ל-Supabase Dashboard → SQL Editor');
  console.log('2. הרץ קודם: IMPORT_1_clients.sql');
  console.log('3. ואז הרץ: IMPORT_2_time_entries.sql');
  console.log('');
}

main().catch(console.error);
