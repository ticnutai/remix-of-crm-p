/**
 * סקריפט לייבוא נתונים מקובץ גיבוי למערכת ncrm
 * מייבא: משתמשים -> לקוחות -> לוגים
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://eadeymehidcndudeycnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// מיפוי בין ID ישן ל-UUID חדש
const clientIdMap = new Map();
const userIdMap = new Map();

// קובץ הגיבוי
const BACKUP_FILE = path.join(__dirname, '..', 'backup_2026-01-27 (1).json');

async function loadBackup() {
  console.log('📂 טוען קובץ גיבוי...');
  const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  console.log(`   ✓ נטענו: ${data.statistics.users} משתמשים, ${data.statistics.clients} לקוחות, ${data.statistics.timeLogs} לוגים`);
  return data;
}

async function getCurrentUser() {
  // נסה לקבל משתמש מהמערכת
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (profiles && profiles.length > 0) {
    return profiles[0].id;
  }
  
  // ננסה לקבל auth user
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) {
    return user.id;
  }
  
  // אם אין משתמש, נבקש user_id כפרמטר
  const userId = process.env.USER_ID || process.argv[2];
  if (userId) {
    console.log(`   👤 משתמש מפרמטר: ${userId}`);
    return userId;
  }
  
  // ננסה לקרוא מ-auth.users ישירות (צריך service role key)
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  if (authUsers?.users && authUsers.users.length > 0) {
    return authUsers.users[0].id;
  }
  
  return null;
}

async function importClients(clients, defaultUserId) {
  console.log('\n👥 מייבא לקוחות...');
  let imported = 0;
  let errors = 0;
  
  for (const client of clients) {
    try {
      // מיפוי שדות מהגיבוי לסכמת clients
      const clientData = {
        name: client.name || 'ללא שם',
        email: client.email || null,
        phone: client.phone || null,
        company: client.company || null,
        address: client.address || null,
        status: 'active', // סטטוס תקין לפי CHECK constraint
        stage: client.stage || null,
        notes: client.notes || null,
        source: client.source || 'imported',
        budget_range: client.budget_range || null,
        position: client.position || null,
        phone_secondary: client.phone_secondary || null,
        whatsapp: client.whatsapp || null,
        website: client.website || null,
        linkedin: client.linkedin || null,
        preferred_contact: client.preferred_contact || null,
        tags: client.tags || [],
        custom_data: client.custom_data || {},
        original_id: client.id, // שמירת ה-ID המקורי למעקב
        name_clean: client.name_clean || client.name,
        is_sample: false,
        user_id: defaultUserId,
        created_by: defaultUserId,
        created_at: client.created_date ? new Date(client.created_date).toISOString() : new Date().toISOString(),
        updated_at: client.updated_date ? new Date(client.updated_date).toISOString() : new Date().toISOString()
      };
      
      // הוספה לדאטהבייס
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select('id')
        .single();
      
      if (error) {
        console.error(`   ❌ שגיאה בלקוח "${client.name}":`, error.message);
        errors++;
      } else {
        // שמירת המיפוי בין ID ישן לחדש
        clientIdMap.set(client.id, data.id);
        imported++;
        if (imported % 50 === 0) {
          console.log(`   ... יובאו ${imported} לקוחות`);
        }
      }
    } catch (err) {
      console.error(`   ❌ שגיאה בלקוח "${client.name}":`, err.message);
      errors++;
    }
  }
  
  console.log(`   ✓ יובאו ${imported} לקוחות (${errors} שגיאות)`);
  return { imported, errors };
}

async function importTimeLogs(timeLogs, defaultUserId) {
  console.log('\n⏱️ מייבא רישומי זמן...');
  let imported = 0;
  let errors = 0;
  let skipped = 0;
  
  for (const log of timeLogs) {
    try {
      // מציאת ה-client_id החדש
      const newClientId = clientIdMap.get(log.client_id);
      
      if (!newClientId) {
        // console.log(`   ⚠️ לא נמצא לקוח עבור לוג: ${log.client_name}`);
        skipped++;
        continue;
      }
      
      // חישוב זמני התחלה וסיום
      const logDate = log.log_date || new Date().toISOString().split('T')[0];
      const startTime = new Date(`${logDate}T09:00:00Z`);
      const endTime = new Date(startTime.getTime() + (log.duration_seconds * 1000));
      
      const timeEntryData = {
        user_id: defaultUserId,
        client_id: newClientId,
        description: [log.title, log.notes].filter(Boolean).join(' - ') || 'רישום זמן מיובא',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_billable: log.billable !== false,
        hourly_rate: log.hourly_rate || null,
        is_running: false,
        tags: [],
        custom_data: {
          original_id: log.id,
          original_client_name: log.client_name,
          imported_from: 'backup',
          original_log_date: log.log_date
        },
        created_at: log.created_date ? new Date(log.created_date).toISOString() : new Date().toISOString(),
        updated_at: log.updated_date ? new Date(log.updated_date).toISOString() : new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('time_entries')
        .insert(timeEntryData);
      
      if (error) {
        console.error(`   ❌ שגיאה בלוג "${log.client_name}":`, error.message);
        errors++;
      } else {
        imported++;
        if (imported % 100 === 0) {
          console.log(`   ... יובאו ${imported} רישומי זמן`);
        }
      }
    } catch (err) {
      console.error(`   ❌ שגיאה בלוג:`, err.message);
      errors++;
    }
  }
  
  console.log(`   ✓ יובאו ${imported} רישומי זמן (${errors} שגיאות, ${skipped} דולגו)`);
  return { imported, errors, skipped };
}

async function main() {
  console.log('🚀 מתחיל ייבוא נתונים מגיבוי\n');
  console.log('=' .repeat(50));
  
  try {
    // טעינת הגיבוי
    const backup = await loadBackup();
    
    // קבלת משתמש ברירת מחדל
    const defaultUserId = await getCurrentUser();
    if (!defaultUserId) {
      console.error('❌ לא נמצא משתמש - התחבר קודם למערכת');
      process.exit(1);
    }
    console.log(`\n👤 משתמש ברירת מחדל: ${defaultUserId}`);
    
    // שלב 1: ייבוא לקוחות
    const clientResults = await importClients(backup.data.clients, defaultUserId);
    
    // שלב 2: ייבוא לוגים
    const logResults = await importTimeLogs(backup.data.timeLogs, defaultUserId);
    
    // סיכום
    console.log('\n' + '=' .repeat(50));
    console.log('📊 סיכום ייבוא:');
    console.log(`   לקוחות: ${clientResults.imported} יובאו, ${clientResults.errors} שגיאות`);
    console.log(`   לוגים: ${logResults.imported} יובאו, ${logResults.errors} שגיאות, ${logResults.skipped} דולגו`);
    console.log('=' .repeat(50));
    console.log('\n✅ הייבוא הושלם!');
    
  } catch (err) {
    console.error('❌ שגיאה כללית:', err.message);
    process.exit(1);
  }
}

main();
