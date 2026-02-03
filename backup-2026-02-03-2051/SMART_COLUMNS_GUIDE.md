# מערכת הוספת עמודות חכמה - Smart Column System

מערכת מתקדמת להוספת עמודות מותאמות אישית לטבלאות במערכת CRM, עם תמיכה בתבניות מוכנות, הוספה קבוצתית, וסוגי נתונים מורחבים.

## תכונות עיקריות

### 🎯 הוספה קבוצתית (Bulk Column Wizard)
- אשף מונחה בן 3 שלבים
- בחירה מתוך 10 תבניות מוכנות מראש
- התאמה אישית לכל עמודה
- תצוגה מקדימה לפני שמירה
- חיפוש וסינון תבניות לפי קטגוריה

### 📋 תבניות מוכנות (Column Templates)

#### 1. **פרטי קשר מלאים** (Contact Details)
- טלפון, נייד, אימייל, פקס

#### 2. **כתובת מלאה** (Full Address)
- רחוב, עיר, מיקוד, מדינה

#### 3. **מעקב פרויקט** (Project Tracking)
- סטטוס, עדיפות, תאריך יעד, אחוז התקדמות

#### 4. **מידע פיננסי** (Financial Information)
- תקציב, עלות בפועל, מטבע, תנאי תשלום

#### 5. **לוח זמנים** (Timeline)
- תאריך התחלה, סיום, אבני דרך

#### 6. **הקצאת צוות** (Team Assignment)
- מנהל פרויקט, צוות, מחלקה

#### 7. **איכות ומשוב** (Quality & Feedback)
- דירוג, משוב, אישור

#### 8. **מסמכים** (Documents)
- חוזה, חשבונית, קבצים מצורפים

#### 9. **רשתות חברתיות** (Social Media)
- LinkedIn, Facebook, Twitter, Instagram

#### 10. **פרטי עסק** (Business Information)
- שם חברה, תפקיד, אתר, ח.פ.

### 🎨 סוגי נתונים חדשים

| סוג | תיאור | שימוש |
|-----|-------|-------|
| `text` | טקסט חופשי | הערות, תיאורים |
| `number` | מספר | כמויות, סכומים |
| `date` | תאריך | מועדים, תאריכי יעד |
| `boolean` | כן/לא | תיבות סימון |
| `select` | בחירה יחידה | סטטוס, קטגוריה |
| **`multi_select`** | **בחירה מרובה** | **תגיות, נושאים מרובים** |
| `data_type` | קישור לנתון אחר | לקוח, עובד, פרויקט |
| **`rich_text`** | **טקסט עשיר** | **תיאורים מפורטים** |
| **`file`** | **קובץ** | **מסמכים, תמונות** |
| **`formula`** | **נוסחה** | **חישובים אוטומטיים** |
| **`rating`** | **דירוג** | **כוכבים, ציונים** |

## איך משתמשים?

### דרך 1: הוספת קבוצת עמודות (מומלץ)

1. לחץ על כפתור **"הוסף קבוצת עמודות"** (✨)
2. **שלב 1 - בחירת תבנית:**
   - עיין בתבניות המוכנות
   - סנן לפי קטגוריה (קשר, כתובות, פרויקט, פיננסים)
   - חפש תבנית ספציפית
   - לחץ על התבנית הרצויה
3. **שלב 2 - התאמה אישית:**
   - ערוך שם קבוצה (אופציונלי)
   - שנה שמות עמודות
   - התאם מפתחות (`column_key`)
   - הגדר ברירות מחדל
   - סמן שדות חובה
   - הוסף או הסר עמודות
4. **שלב 3 - תצוגה מקדימה:**
   - בדוק את סיכום כל העמודות
   - אשר ולחץ "הוסף X עמודות"

### דרך 2: הוספת עמודה בודדת

1. לחץ על כפתור **"הוסף עמודה"** (+)
2. הזן שם עמודה
3. בחר סוג נתונים
4. הגדר אפשרויות (אם נדרש)
5. לחץ "הוסף"

## מבנה הקוד

### קבצים חדשים

```
src/
├── lib/
│   └── columnTemplates.ts          # הגדרות תבניות מוכנות
├── components/
│   └── custom-tables/
│       └── BulkColumnWizard.tsx    # קומפוננטת האשף
└── hooks/
    └── useTableCustomColumns.ts     # עדכון ל-bulk operations
```

### מיגרציית DB

```sql
-- supabase/migrations/20260113000001_add_column_groups_and_new_types.sql
ALTER TABLE public.table_custom_columns
  ADD COLUMN column_group TEXT,
  ADD COLUMN allow_multiple BOOLEAN DEFAULT FALSE,
  ADD COLUMN formula TEXT,
  ADD COLUMN max_rating INTEGER DEFAULT 5;
```

### TypeScript Interfaces

```typescript
interface CustomColumn {
  id?: string;
  table_name: string;
  column_key: string;
  column_name: string;
  column_type: 'text' | 'number' | 'date' | 'boolean' | 
                'select' | 'multi_select' | 'data_type' | 
                'rich_text' | 'file' | 'formula' | 'rating';
  column_options?: string[];
  data_type_id?: string;
  is_required?: boolean;
  default_value?: string;
  column_order?: number;
  column_group?: string;        // חדש
  allow_multiple?: boolean;     // חדש
  formula?: string;             // חדש
  max_rating?: number;          // חדש
}
```

## שימוש ב-Hooks

### הוספת עמודות בבת אחת

```typescript
const { addColumnsInBulk } = useTableCustomColumns('clients');

const columns: CustomColumn[] = [
  {
    column_key: 'phone',
    column_name: 'טלפון',
    column_type: 'text',
  },
  {
    column_key: 'email',
    column_name: 'אימייל',
    column_type: 'text',
  },
];

await addColumnsInBulk(columns, 'פרטי קשר');
```

## יתרונות המערכת

✅ **מהירות** - הוספת עמודות מרובות בקליק אחד  
✅ **ארגון** - קיבוץ עמודות קשורות לקבוצה  
✅ **גמישות** - התאמה אישית מלאה לכל עמודה  
✅ **תקינה** - תבניות בדוקות ומוכנות מראש  
✅ **שימושיות** - חיפוש וסינון תבניות  
✅ **הרחבה** - קל להוסיף תבניות חדשות

## הוספת תבנית חדשה

ערוך את `src/lib/columnTemplates.ts`:

```typescript
export const COLUMN_TEMPLATES: ColumnTemplate[] = [
  // ... תבניות קיימות
  {
    id: 'my-template',
    name: 'התבנית שלי',
    name_en: 'My Template',
    description: 'תיאור קצר',
    icon: 'Icon name from lucide-react',
    color: '#hex-color',
    category: 'custom',
    columns: [
      {
        column_key: 'my_field',
        column_name: 'השדה שלי',
        column_type: 'text',
        is_required: false,
      },
    ],
  },
];
```

## טיפים לשימוש

1. **השתמש בתבניות** במקום להוסיף עמודות אחת-אחת
2. **קבץ עמודות** לפי נושא עם `column_group`
3. **וודא מפתחות ייחודיים** - `column_key` חייב להיות ייחודי בטבלה
4. **השתמש בברירות מחדל** להפחתת עבודה ידנית
5. **נצל את החיפוש** למצוא תבניות במהירות

## תמיכה והרחבות עתידיות

- [ ] תמיכה בתבניות מותאמות אישית (שמירה)
- [ ] ייבוא/ייצוא תבניות בין טבלאות
- [ ] תמיכה ב-multi-select עבור data_type columns
- [ ] תצוגת עמודות בקבוצות מתקפלות (collapse/expand)
- [ ] ולידציות מתקדמות (regex, ranges)
- [ ] תלות בין שדות (conditional fields)

---

**נוצר על ידי:** מערכת AI  
**תאריך:** ינואר 2026  
**גרסה:** 1.0.0
