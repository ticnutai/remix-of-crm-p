# 🔒 מערכת גיבוי חכמה - מדריך מלא

## 📋 תוכן עניינים
- [סקירה כללית](#סקירה-כללית)
- [מה מגובה במערכת](#מה-מגובה-במערכת)
- [אסטרטגיות גיבוי](#אסטרטגיות-גיבוי)
- [גיבוי אוטומטי](#גיבוי-אוטומטי)
- [שחזור נתונים](#שחזור-נתונים)
- [המלצות מומלצות](#המלצות-מומלצות)

---

## 🎯 סקירה כללית

מערכת הגיבוי החכמה מבצעת גיבוי מלא, מאורגן ומאובטח של כל הנתונים החשובים במערכת. המערכת מחולקת ל-4 רמות קריטיות:

### רמות קריטיות

#### 🔴 **קריטי** - חייב לגבות תמיד!
```typescript
clients              // לקוחות - ליבת המערכת
profiles            // פרופילי משתמשים
client_custom_tabs  // טאבים מותאמים אישית
client_tab_columns  // עמודות מותאמות
custom_tables       // טבלאות מותאמות אישית
custom_table_data   // נתוני טבלאות מותאמות
settings            // הגדרות מערכת
client_categories   // קטגוריות לקוחות ⭐ חדש
client_sources      // מקורות לקוחות ⭐ חדש
```

#### 🟠 **חשוב** - נתונים עסקיים
```typescript
time_entries        // רישומי זמן
time_logs          // לוגים של זמן
projects           // פרויקטים
project_updates    // עדכוני פרויקטים ⭐ חדש
tasks              // משימות
meetings           // פגישות
quotes             // הצעות מחיר
quote_items        // פריטי הצעות מחיר ⭐ חדש
quote_templates    // תבניות הצעות מחיר ⭐ חדש
contracts          // חוזים
contract_templates // תבניות חוזים ⭐ חדש
contract_documents // מסמכי חוזים ⭐ חדש
contract_amendments// תיקוני חוזים ⭐ חדש
invoices           // חשבוניות
payments           // תשלומים
payment_schedules  // לוחות תשלום ⭐ חדש
```

#### 🟡 **שימושי** - תוכן נוסף
```typescript
client_contacts     // אנשי קשר
client_files        // מטא-דאטה של קבצים
client_messages     // הודעות
client_notes        // הערות
client_history      // היסטוריה
client_portal_tokens// טוקנים לפורטל לקוח ⭐ חדש
documents           // מסמכים
reminders           // תזכורות
notifications       // התראות
calendar_events     // אירועי יומן ⭐ חדש
call_logs          // לוגי שיחות ⭐ חדש
whatsapp_log       // לוגי וואטסאפ ⭐ חדש
signatures         // חתימות ⭐ חדש
workflows          // תהליכי עבודה ⭐ חדש
workflow_logs      // לוגי תהליכים ⭐ חדש
custom_reports     // דוחות מותאמים ⭐ חדש
user_preferences   // העדפות משתמש ⭐ חדש
```

#### 🟢 **אופציונלי** - אפשר בלי
```typescript
audit_log          // לוג ביקורת (גדול מאוד!)
activity_logs      // לוגי פעילות ⭐ חדש
analytics_events   // אירועי analytics
search_history     // היסטוריית חיפושים
user_sessions      // סשנים פעילים
migration_logs     // לוגי מיגרציות ⭐ חדש
roles              // תפקידים ⭐ חדש
permissions        // הרשאות ⭐ חדש
```

---

## 📊 מה מגובה במערכת

### ✅ נתונים שמגובים

| קטגוריה | פריטים | סטטוס |
|---------|--------|-------|
| **לקוחות** | כל פרטי הלקוחות, אנשי קשר, היסטוריה | ✅ מגובה |
| **קטגוריות ומקורות** | קטגוריות לקוחות, מקורות לידים | ✅ מגובה |
| **זמנים** | רישומי זמן, לוגים, טיימרים | ✅ מגובה |
| **פרויקטים** | פרויקטים, משימות, עדכונים, סטטוסים | ✅ מגובה |
| **פגישות** | פגישות, אירועי יומן, היסטוריה | ✅ מגובה |
| **כספים** | הצעות מחיר, חשבוניות, תשלומים, לוחות תשלום | ✅ מגובה |
| **חוזים** | חוזים, תבניות, מסמכים, תיקונים | ✅ מגובה |
| **הצעות מחיר** | הצעות, פריטים, תבניות | ✅ מגובה |
| **תקשורת** | הודעות, שיחות, וואטסאפ | ✅ מגובה |
| **מסמכים** | חוזים, מסמכים, חתימות | ✅ מגובה |
| **התאמות אישיות** | טאבים, עמודות, טבלאות, דוחות | ✅ מגובה |
| **הגדרות** | הגדרות מערכת, העדפות משתמש | ✅ מגובה |
| **תהליכי עבודה** | workflows, לוגי תהליכים | ✅ מגובה |
| **תזכורות והתראות** | תזכורות, התראות, notifications | ✅ מגובה |
| **אבטחה** | טוקנים לפורטל לקוח | ✅ מגובה |
| **קבצים** | רשימה + מטא-דאטה (לא התוכן) | ⚠️ חלקי |

### ⚠️ נתונים שלא מגובים (כרגע)

| פריט | סיבה | המלצה |
|------|------|--------|
| **תוכן קבצים** | גודל גדול מדי | גיבוי נפרד לענן |
| **תמונות** | גודל גדול | Supabase Storage |
| **לוגים ישנים** | לא קריטי | ניתן לארכב |
| **cache** | זמני | לא נדרש |

---

## 🎨 אסטרטגיות גיבוי

### 1️⃣ **Minimal** - גיבוי מינימלי
```typescript
// מתי להשתמש: גיבוי מהיר, לפני שינויים גדולים
- רק טבלאות קריטיות (9 טבלאות)
- כולל: לקוחות, פרופילים, קטגוריות, מקורות, טאבים מותאמים, עמודות, טבלאות, נתוני טבלאות, הגדרות
- ללא קבצים
- עם הגדרות
- דחוס
- גודל: ~2-5 MB
- משך: ~15 שניות
```

### 2️⃣ **Standard** - גיבוי סטנדרטי (מומלץ!)
```typescript
// מתי להשתמש: גיבוי יומי אוטומטי
- קריטי + חשוב (25 טבלאות)
- כולל: הכל מ-Minimal + פרויקטים, עדכונים, משימות, זמנים, הצעות מחיר, חוזים, תשלומים
- ללא קבצים
- עם הגדרות
- דחוס
- גודל: ~10-25 MB
- משך: ~45 שניות
```

### 3️⃣ **Full** - גיבוי מלא
```typescript
// מתי להשתמש: גיבוי שבועי
- קריטי + חשוב + שימושי (42 טבלאות)
- כולל: הכל מ-Standard + תקשורת, לוגים, תהליכים, חתימות, דוחות
- כולל רשימת קבצים
- עם הגדרות
- דחוס
- גודל: ~30-70 MB
- משך: ~2-3 דקות
```

### 4️⃣ **Complete** - גיבוי שלם
```typescript
// מתי להשתמש: לפני שדרוגים, גיבוי חודשי
- כל המערכת (50+ טבלאות)
- כולל הכל כולל audit logs
- דחוס ומוצפן
- גודל: ~70-150 MB
- משך: ~4-6 דקות
```

### 5️⃣ **Custom** - גיבוי מותאם אישית
```typescript
// מתי להשתמש: צרכים ספציפיים
- בחירה ידנית של טבלאות
- שליטה מלאה
```

---

## ⏰ גיבוי אוטומטי

### הגדרת גיבוי אוטומטי

```typescript
import { AutoBackupScheduler } from '@/lib/smartBackup';

const scheduler = new AutoBackupScheduler({
  enabled: true,
  frequency: 'daily',      // 'daily' | 'weekly' | 'monthly'
  time: '03:00',           // שעה 3 בלילה
  strategy: 'standard',     // אסטרטגיית הגיבוי
  maxBackups: 7,            // שמירת 7 גיבויים אחרונים
});

scheduler.start();
```

### לוח זמנים מומלץ

| תדירות | אסטרטגיה | מתי | מטרה |
|--------|----------|-----|------|
| **יומי** | Standard | 03:00 | גיבוי שוטף |
| **שבועי** | Full | ראשון 02:00 | גיבוי מקיף |
| **חודשי** | Complete | 1 לחודש | ארכיון מלא |

---

## 🔄 שחזור נתונים

### שחזור מלא

```typescript
import { SmartBackupSystem } from '@/lib/smartBackup';

// 1. טעינת גיבוי
const backupFile = ... // קובץ JSON
const backup = JSON.parse(await backupFile.text());

// 2. שחזור לפי טבלה
for (const [tableName, records] of Object.entries(backup.data)) {
  if (Array.isArray(records)) {
    await supabase.from(tableName).upsert(records);
  }
}

// 3. שחזור הגדרות
if (backup.settings) {
  Object.entries(backup.settings).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}
```

### שחזור חלקי

```typescript
// שחזור רק לקוחות
const clients = backup.data.clients;
await supabase.from('clients').upsert(clients);

// שחזור רק הגדרות
Object.entries(backup.settings).forEach(([key, value]) => {
  localStorage.setItem(key, value);
});
```

---

## 💡 המלצות מומלצות

### ✅ לעשות

1. **גיבוי אוטומטי יומי** - הגדר גיבוי `standard` כל לילה
2. **3-2-1 Rule**:
   - 3 עותקים של הנתונים
   - 2 מדיות שונות (localStorage + הורדה)
   - 1 מקום חיצוני (Google Drive / Dropbox)
3. **בדיקת שחזור** - בדוק שחזור פעם בחודש
4. **שמירת היסטוריה** - שמור לפחות 7 גיבויים אחרונים
5. **גיבוי לפני שינויים** - תמיד לפני עדכונים גדולים

### ❌ לא לעשות

1. **לא לסמוך רק על גיבוי אחד** - תמיד מספר עותקים
2. **לא לשמור ב-localStorage בלבד** - הורד גם לדיסק
3. **לא לשכוח לבדוק שחזור** - גיבוי ללא בדיקה = אין גיבוי
4. **לא לדחות גיבויים** - עדיף גיבוי קטן מאשר בכלל לא

---

## 📈 ניטור ותחזוקה

### בדיקות שוטפות

```typescript
// בדיקת גודל גיבויים
const backups = JSON.parse(localStorage.getItem('auto-backups') || '[]');
console.log('Total backups:', backups.length);

backups.forEach(b => {
  const sizeMB = (b.statistics.sizeBytes / 1024 / 1024).toFixed(2);
  console.log(`${b.metadata.name}: ${sizeMB} MB`);
});

// בדיקת תקינות
backups.forEach(b => {
  if (!b.metadata || !b.data) {
    console.error('⚠️ גיבוי פגום:', b.metadata?.name);
  }
});
```

### ניקוי אחסון

```typescript
// מחיקת גיבויים ישנים (מעל 30 יום)
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

const cleaned = backups.filter(b => {
  const backupDate = new Date(b.metadata.createdAt).getTime();
  return backupDate > thirtyDaysAgo;
});

localStorage.setItem('auto-backups', JSON.stringify(cleaned));
```

---

## 🚀 שימוש מהיר

### דוגמה 1: גיבוי ידני מהיר

```typescript
import { SmartBackupSystem, BACKUP_STRATEGIES } from '@/lib/smartBackup';

const backup = new SmartBackupSystem({
  strategy: 'standard',
  ...BACKUP_STRATEGIES.standard,
});

backup.setProgressCallback((progress, message) => {
  console.log(`${progress}%: ${message}`);
});

const result = await backup.createSmartBackup('גיבוי ידני');
backup.exportToFile(result, 'json');
```

### דוגמה 2: גיבוי לפני שינוי גדול

```typescript
// לפני מחיקת לקוח או עדכון מסיבי
const quickBackup = new SmartBackupSystem({
  strategy: 'minimal',
  ...BACKUP_STRATEGIES.minimal,
});

await quickBackup.createSmartBackup('לפני מחיקה');
// עכשיו אפשר לבצע את השינוי
```

### דוגמה 3: גיבוי מותאם

```typescript
const customBackup = new SmartBackupSystem({
  strategy: 'custom',
  tables: ['clients', 'projects', 'quotes'],  // רק אלה
  includeFiles: false,
  includeSettings: true,
  compression: true,
  encryption: false,
});

await customBackup.createSmartBackup('גיבוי מותאם');
```

---

## 🔐 אבטחה והצפנה

### הצפנת גיבויים (מתוכנן)

```typescript
// TODO: להוסיף הצפנה באמצעות Web Crypto API
const encryptedBackup = await encryptBackup(backup, password);
```

### אחסון מאובטח

- ✅ localStorage - מוצפן ברמת הדפדפן
- ✅ Supabase Storage - מוצפן ב-rest
- 🔄 הורדה מקומית - מומלץ להצפין
- 🔄 ענן חיצוני - תמיד הצפן

---

## 📞 תמיכה ותקלות

### בעיות נפוצות

**בעיה**: "גיבוי נכשל"
- פתרון: בדוק חיבור אינטרנט ו-Supabase

**בעיה**: "אחסון מלא"
- פתרון: נקה גיבויים ישנים או הורד לדיסק

**בעיה**: "שחזור לא עובד"
- פתרון: וודא שהקובץ תקין ובפורמט הנכון

---

## 📝 סיכום

מערכת הגיבוי החכמה מספקת:

✅ **גיבוי מלא** של כל הנתונים החשובים  
✅ **4 אסטרטגיות** לבחירה לפי צורך  
✅ **גיבוי אוטומטי** עם תזמון  
✅ **דחיסה** לחיסכון במקום  
✅ **ניטור** והתראות  
✅ **שחזור קל** ומהיר  

**המלצה**: התחל עם גיבוי `standard` אוטומטי יומי, והורד `full` פעם בשבוע.

---

**נוצר על ידי**: מערכת CRM חכמה  
**גרסה**: 2.0.0  
**עדכון אחרון**: ינואר 2026
