# איפה למצוא את מערכת הוספת העמודות החכמה? 🎯

## דפים שכבר משתמשים במערכת החדשה:

### 1. **עובדים (Employees)** ✅
- **נתיב:** `/employees`
- **קומפוננטה:** [Employees.tsx](src/pages/Employees.tsx#L759)
- **כפתורים זמינים:**
  - ✨ **"הוסף קבוצת עמודות"** - פותח את ה-Wizard
  - ➕ **"הוסף עמודה"** - הוספה בודדת

### 2. **רישומי זמן (Time Logs)** ✅
- **נתיב:** `/time-logs`
- **קומפוננטה:** [TimeLogs.tsx](src/pages/TimeLogs.tsx#L986)
- **כפתורים זמינים:**
  - ✨ **"הוסף קבוצת עמודות"** - פותח את ה-Wizard
  - ➕ **"הוסף עמודה"** - הוספה בודדת

---

## איך להשתמש במערכת?

### דרך 1: הוספת קבוצת עמודות (Bulk Column Wizard)
1. היכנס לעמוד עובדים או רישומי זמן
2. לחץ על הכפתור **"הוסף קבוצת עמודות"** (✨)
3. **שלב 1:** בחר תבנית מוכנה (10 תבניות זמינות)
4. **שלב 2:** התאם אישית את העמודות
5. **שלב 3:** בדוק תצוגה מקדימה ואשר

### דרך 2: הוספת עמודה בודדת
1. לחץ על **"הוסף עמודה"** (➕)
2. מלא את הפרטים והוסף

---

## איך להוסיף לדפים נוספים?

### לדוגמה: הוספה ל-DataTablePro (לקוחות/פרויקטים)

**שלב 1:** החלף את DataTable ב-UniversalDataTable

```tsx
// במקום:
import { DataTable } from '@/components/DataTable';

// השתמש ב:
import { UniversalDataTable } from '@/components/tables/UniversalDataTable';
```

**שלב 2:** החלף את השימוש:

```tsx
// במקום:
<DataTable
  data={clients}
  columns={clientColumns}
  variant="gold"
  // ... props נוספים
/>

// השתמש ב:
<UniversalDataTable
  tableName="clients"  // חשוב! שם הטבלה ב-DB
  data={clients}
  setData={setClients}  // חובה לעדכון
  baseColumns={clientColumns}
  variant="gold"
  // ... props נוספים
  canAddColumns={true}  // מאפשר הוספת עמודות
/>
```

---

## תבניות זמינות (10):

| מס׳ | תבנית | כולל |
|-----|--------|------|
| 1 | **פרטי קשר מלאים** | טלפון, נייד, אימייל, פקס |
| 2 | **כתובת מלאה** | רחוב, עיר, מיקוד, מדינה |
| 3 | **מעקב פרויקט** | סטטוס, עדיפות, תאריך יעד, התקדמות |
| 4 | **מידע פיננסי** | תקציב, עלות, מטבע, תנאי תשלום |
| 5 | **לוח זמנים** | תאריך התחלה, סיום, אבני דרך |
| 6 | **הקצאת צוות** | מנהל, צוות, מחלקה |
| 7 | **איכות ומשוב** | דירוג, משוב, אישור |
| 8 | **מסמכים** | חוזה, חשבונית, קבצים |
| 9 | **רשתות חברתיות** | LinkedIn, Facebook, Twitter, Instagram |
| 10 | **פרטי עסק** | חברה, תפקיד, אתר, ח.פ. |

---

## קבצים רלוונטיים:

- **Wizard:** [BulkColumnWizard.tsx](src/components/custom-tables/BulkColumnWizard.tsx)
- **תבניות:** [columnTemplates.ts](src/lib/columnTemplates.ts)
- **טבלה אוניברסלית:** [UniversalDataTable.tsx](src/components/tables/UniversalDataTable.tsx)
- **Hook:** [useTableCustomColumns.ts](src/hooks/useTableCustomColumns.ts)
- **מיגרציה:** [20260113000001_add_column_groups_and_new_types.sql](supabase/migrations/20260113000001_add_column_groups_and_new_types.sql)

---

## תיקונים שבוצעו:

✅ **גלילה אופקית** - הוספת `overflow-x-auto` ל-DataTable  
✅ **עמודות לא זזות** - הוספת `collisionPadding` ו-`sticky` ל-DropdownMenu  
✅ **z-index** - עדכון ל-`z-[100]` למניעת הסתרה מאחורי אלמנטים  

---

**נוצר:** ינואר 2026  
**גרסה:** 1.0
