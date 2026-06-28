# Quotes Pro — מסמך אפיון (שלב 1)

מערכת תבניות הצעות-מחיר חדשה, **מנותקת לחלוטין** מהקיים, עם כל היכולות של המערכת הישנה — אך מבוססת על **מודל בלוקים מונחה-סכמה** במקום HTML גולמי.

> סטטוס: טיוטה לאישור. אחרי אישור עוברים לשלב 2 (סקלטון קוד + טבלאות DB).

---

## 1. עקרונות יסוד

1. **מקור אמת אחד מובְנה** — מסמך = JSON של בלוקים, לא HTML. ה-HTML/PDF נגזרים ממנו ע"י מנוע רינדור יחיד.
2. **מודולריות** — כל סוג בלוק = רכיב קטן ועצמאי. אין קובץ ענק. (הקיים: עורך של 15,388 שורות.)
3. **הפרדת שכבות** — נתונים (blocks) ↔ עיצוב (theme) ↔ רינדור (renderer) ↔ עימוד (paged.js).
4. **ניתוק מלא** — נתיבים, טבלאות, וקוד נפרדים. שום import מהמערכת הישנה.
5. **מוכן ל-AI** — נתונים מובְנים מאפשרים יצירת/עריכת הצעה אוטומטית בעתיד.
6. **שמירת פיצ'רים** — כל יכולת קיימת מקבלת מקבילה (ראו §7 צ'קליסט פאריטי).

---

## 2. ניתוק ושמות (Isolation & Naming)

| שכבה | הישן | החדש |
|------|------|------|
| נתיב | `/quote-templates` | `/quotes-pro` |
| עורך | `/quote-templates/editor/:id` | `/quotes-pro/editor/:id` |
| תיקיית קוד | `src/components/quotes/QuoteTemplatesManager/` | `src/features/quotes-pro/` |
| טבלאות DB | `quote_templates`, `quote_template_folders`, `quote_template_versions` | `qp_documents`, `qp_folders`, `qp_versions`, `qp_themes` |
| prefix | — | `qp_` (Quotes Pro) |

החדש **לא** קורא/כותב לטבלאות הישנות. מיגרציה חד-פעמית אופציונלית (כלי ייבוא) — לא תלות חיה.

---

## 3. מודל הנתונים — מסמך (Document)

```ts
// src/features/quotes-pro/model/document.ts
interface QPDocument {
  id: string;
  name: string;
  description?: string;
  category: QPCategory;
  folder_id: string | null;

  // ליבת המסמך: רשימת בלוקים בסדר תצוגה
  blocks: QPBlock[];

  // הגדרות גלובליות
  theme_id: string | null;        // theme שמור, או null = inline
  theme: QPTheme;                 // עותק מוטמע (snapshot) לעצמאות
  page: QPPageSettings;           // A4, שוליים, כיוון

  // מטא לוגי-עסקי
  pricing: QPPricingConfig;       // מע"מ, מטבע, רמות תמחור
  validity_days: number;
  meta: QPDocMeta;                // פרטי לקוח/פרויקט/מספר הצעה
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### 3.1 בלוק בסיס (Block base)

```ts
interface QPBlockBase {
  id: string;
  type: QPBlockType;
  // override עיצוב ספציפי לבלוק (יורש מ-theme אם חסר)
  style?: Partial<QPBlockStyle>;
  // שליטה בעימוד
  keepTogether?: boolean;        // break-inside: avoid
  pageBreakBefore?: boolean;     // התחל בעמוד חדש
  hidden?: boolean;
}

type QPBlock =
  | QPHeaderBlock
  | QPStagesBlock
  | QPPriceTableBlock
  | QPPaymentScheduleBlock
  | QPTimelineBlock
  | QPRichTextBlock
  | QPImportantNotesBlock
  | QPPricingTiersBlock
  | QPUpgradesBlock
  | QPSignatureBlock
  | QPSpacerBlock
  | QPImageBlock
  | QPHtmlBlock;   // מילוט: HTML גולמי (תאימות-לאחור / מקרי קצה)
```

### 3.2 סוגי הבלוקים (Block types) — סכמת נתונים

> כל בלוק כולל את שדות `QPBlockBase`. מוצגות רק תוספות-התוכן.

**Header** — כותרת + לוגו + פרטי חברה/יצירת-קשר
```ts
{ type:"header", logoUrl?:string, companyName:string, subtitle?:string,
  contact:{ phone?:string; email?:string; address?:string; website?:string },
  variant:"gradient"|"solid"|"minimal"|"modern"|"classic", height:"compact"|"normal"|"large" }
```

**Stages** — שלבי עבודה (החלק המרכזי בישן)
```ts
{ type:"stages", title?:string,
  stages: Array<{ id:string; name:string; icon?:string; iconColor?:string;
    isSection?:boolean; itemDisplayMode:"check"|"numbered"|"bullet"|"none"; itemDisplayColor?:string;
    items: Array<{ id:string; text:string; isSpacer?:boolean; icon?:string; iconColor?:string;
      fmt?:{ fontFamily?:string; fontSize?:number; color?:string; bold?:boolean; italic?:boolean;
             underline?:boolean; align?:"right"|"center"|"left" } }> }> }
```

**PriceTable** — טבלת פריטים ומחירים
```ts
{ type:"priceTable", showVat:boolean,
  columns:{ qty:boolean; unit:boolean; unitPrice:boolean; total:boolean },
  items: Array<{ id:string; description:string; quantity:number; unit:string; unitPrice:number; total:number }> }
```

**PaymentSchedule** — לוח תשלומים (אחוזים)
```ts
{ type:"paymentSchedule", steps: Array<{ id:string; percentage:number; description:string }> }
```

**Timeline** — ציר זמן / לוחות זמנים
```ts
{ type:"timeline", steps: Array<{ id:string; title:string; duration?:string }> }
```

**RichText** — טקסט חופשי מעוצב (תנאים, הערות, מבוא)
```ts
{ type:"richText", html:string }   // HTML מצומצם ובטוח (sanitized), לא מסמך שלם
```

**ImportantNotes** — נקודות חשובות
```ts
{ type:"importantNotes", title?:string, notes: string[] }
```

**PricingTiers** — רמות תמחור (בסיסי/מתקדם/פרימיום)
```ts
{ type:"pricingTiers", tiers: Array<{ id:string; name:string; price:number;
  features:string[]; highlighted?:boolean }> }
```

**Upgrades** — שדרוגים/תוספות אופציונליים
```ts
{ type:"upgrades", title?:string, items: Array<{ id:string; name:string; price:number; selected?:boolean }> }
```

**Signature** — בלוק חתימה
```ts
{ type:"signature", parties: Array<{ label:string; nameLine?:boolean; dateLine?:boolean }> }
```

**Spacer / Image / Html**
```ts
{ type:"spacer", height:number }                    // ריווח במ"מ
{ type:"image", url:string, width?:number, align?:"right"|"center"|"left" }
{ type:"html", html:string }                        // מילוט מלא
```

---

## 4. מודל העיצוב (Theme)

```ts
interface QPTheme {
  primaryColor:string; secondaryColor:string; accentColor:string;
  fontFamily:"default"|"modern"|"classic"|"elegant"; fontScale:"small"|"medium"|"large";
  borderStyle:"none"|"simple"|"rounded"|"shadow";
  tableStyle:"simple"|"striped"|"bordered"|"modern";
  sectionDivider:"none"|"line"|"dots"|"gradient";
  backgroundPattern:"none"|"dots"|"lines"|"grid"|"geometric";
  watermark?:{ text:string; opacity:number };
  footer:"minimal"|"detailed"|"branded";
}
```
- Theme ניתן לשמירה ב-`qp_themes` ולהחלפה בקליק על כל מסמך.
- כל מסמך מחזיק `theme` מוטמע (snapshot) — כך שינוי theme גלובלי לא שובר מסמכים ישנים, אלא אם בוחרים "החל מחדש".

### QPPageSettings
```ts
{ size:"A4"; orientation:"portrait"|"landscape"; margins:{ top:number; right:number; bottom:number; left:number } }
```

---

## 5. מנוע הרינדור (Rendering Engine)

זרימה אחת, מקור אמת אחד:

```
QPDocument(blocks+theme)
   → renderBlock(block, theme)   // לכל סוג בלוק פונקציית רינדור טהורה → HTML
   → composeDocumentHtml()       // עוטף ב-<style> מה-theme + page settings
   → paged.js                    // עימוד ל-A4 אמיתי (כמו היום, מנוע משותף)
   → תצוגה מקדימה / ייצוא PDF / שיתוף
```

- **`renderBlock`**: מפה `type → renderer`. הוספת בלוק חדש = פונקציה אחת + רכיב עורך אחד.
- **תצוגת עורך** ותצוגת **רינדור** חולקים את אותו `renderBlock` → WYSIWYG אמיתי, אפס כפילות.
- עימוד נשאר על `pagedjs` (כבר בפרויקט), אבל מוזן מ-HTML נקי וצפוי.

---

## 6. סכמת DB (Supabase)

```sql
-- qp_folders: תיקיות מקוננות
create table qp_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null, color text default '#d8ac27', icon text,
  parent_id uuid references qp_folders(id) on delete set null,
  sort_order int default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- qp_documents: המסמך כ-JSON בלוקים
create table qp_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, category text not null default 'construction',
  folder_id uuid references qp_folders(id) on delete set null,
  blocks jsonb not null default '[]',
  theme jsonb not null default '{}', theme_id uuid references qp_themes(id) on delete set null,
  page jsonb not null default '{}', pricing jsonb not null default '{}', meta jsonb not null default '{}',
  validity_days int default 30, is_active bool default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- qp_themes: ערכות עיצוב לשימוש חוזר
create table qp_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null, theme jsonb not null default '{}',
  created_by uuid references auth.users(id), created_at timestamptz default now()
);

-- qp_versions: היסטוריית גרסאות (snapshot מלא)
create table qp_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references qp_documents(id) on delete cascade,
  version_number int not null default 1, label text default 'גרסה',
  snapshot jsonb not null default '{}',
  created_by uuid references auth.users(id), created_at timestamptz default now(),
  unique(document_id, version_number)
);
```
RLS על כל הטבלאות (authenticated). אינדקסים על `folder_id`, `document_id`, `created_at`.

---

## 7. צ'קליסט פאריטי (יכולת ישנה → מקבילה חדשה)

| יכולת קיימת | מקבילה ב-Quotes Pro |
|---|---|
| תיקיות מקוננות + גרירה + צבעים | `qp_folders` + מנהל חדש (זהה התנהגות) |
| 5 מצבי פריסה במנהל | פריסות במנהל החדש |
| CRUD + שכפול + שינוי-שם + העברה | זהה |
| ייבוא HTML/Word/PDF | כלי ייבוא → ממיר ל-blocks (HTML גולמי נופל ל-`QPHtmlBlock`) |
| Word→HTML | נשמר ככלי עזר |
| עורך ויזואלי (15K שורות) | עורך בלוקים מודולרי |
| הגדרות עיצוב עשירות | `QPTheme` + `qp_themes` |
| שלבים + פריטים + עיצוב טקסט | `QPStagesBlock` |
| לוח תשלומים | `QPPaymentScheduleBlock` |
| ציר זמן | `QPTimelineBlock` |
| רמות תמחור | `QPPricingTiersBlock` |
| שדרוגים | `QPUpgradesBlock` |
| פרטי פרויקט (גוש/חלקה) | `QPDocMeta` |
| תצוגת A4 מעומדת | מנוע רינדור משותף + paged.js |
| גרסאות | `qp_versions` |
| העדפות תצוגה | `user_preferences` (משותף, מפתחות `qp_*`) |

**שיפורים מעבר לקיים:** החלפת theme בקליק · גרירה לסידור בלוקים · ספריית בלוקים להוספה · WYSIWYG מדויק · בסיס ל-AI.

---

## 8. מפת דרכים (Roadmap)

- **שלב 1 — אפיון + סכמה** ← *מסמך זה*.
- **שלב 2 — סקלטון**: טבלאות DB + migration, תיקיית `src/features/quotes-pro/`, טיפוסי TS (`model/`), ראוטים ריקים.
- **שלב 3 — מנוע רינדור**: `renderBlock` + `composeDocumentHtml` + אינטגרציית paged.js, מבלוקים לדוגמה.
- **שלב 4 — עורך בלוקים**: מסך עורך, ספריית בלוקים, גרירה/סידור, פאנל מאפיינים, פאנל theme.
- **שלב 5 — מנהל מסמכים**: רשימה/תיקיות/חיפוש/פריסות/CRUD.
- **שלב 6 — ייבוא + גרסאות + ייצוא PDF/שיתוף**.
- **שלב 7 — ליטוש, נגישות RTL, בדיקות E2E, ואופציונלית AI**.

---

## 9. שאלות פתוחות לאישור

1. שם תצוגה למשתמש למערכת ("הצעות מחיר Pro"? אחר?).
2. האם להציג בתפריט לצד הישן, או מאחורי feature-flag עד שתבשיל?
3. האם נדרש כלי מיגרציה מהתבניות הישנות מיום ראשון, או שלב מאוחר?
4. עדיפות פיצ'רים: מה ה-MVP המינימלי שצריך לעבוד קודם (לדעתי: Header + Stages + PriceTable + PaymentSchedule + רינדור A4).
