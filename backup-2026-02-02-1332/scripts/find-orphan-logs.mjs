/**
 * מוצא לוגים שהלקוח שלהם לא קיים ברשימת הלקוחות
 */
import fs from 'fs';

const BACKUP_FILE = 'backup_2026-01-27 (1).json';

const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
const clients = backup.data.clients;
const timeLogs = backup.data.timeLogs;

console.log(`📊 בדיקת לוגים יתומים`);
console.log(`   לקוחות: ${clients.length}`);
console.log(`   לוגים: ${timeLogs.length}`);
console.log('');

// יצירת מפת לקוחות
const clientIds = new Set(clients.map(c => c.id));
console.log(`   מספר מזהי לקוחות ייחודיים: ${clientIds.size}`);

// מציאת לוגים יתומים
const orphanLogs = timeLogs.filter(log => {
  if (!log.client_id) {
    return true; // לוג ללא client_id
  }
  return !clientIds.has(log.client_id);
});

console.log(`\n❌ נמצאו ${orphanLogs.length} לוגים יתומים:`);
console.log('');

orphanLogs.forEach((log, i) => {
  console.log(`${i+1}. לקוח: ${log.client_name || 'ללא שם'}`);
  console.log(`   client_id: ${log.client_id || 'NULL'}`);
  console.log(`   תאריך: ${log.log_date}`);
  console.log(`   משך: ${(log.duration_seconds / 60).toFixed(1)} דקות`);
  console.log(`   נוצר ב: ${log.created_date}`);
  console.log(`   log_id: ${log.id}`);
  console.log('');
});

// סיכום שעות
const totalOrphanMinutes = orphanLogs.reduce((sum, log) => sum + (log.duration_seconds || 0) / 60, 0);
console.log(`⏱️ סה"כ זמן יתום: ${totalOrphanMinutes.toFixed(1)} דקות (${(totalOrphanMinutes/60).toFixed(2)} שעות)`);
