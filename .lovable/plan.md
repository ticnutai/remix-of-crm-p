# מערכת עיצוב מסגרות ורקעים מתקדמת

הרחבת מערכת העיצוב הקיימת (`DesignSettings`) לכלול שליטה מלאה במסגרות, רקעים, כותרות ופוטר — עם override ברמת הצעה בודדת.

## 1. הרחבת סכמת `DesignSettings` (types.ts)

```ts
// חבילת מסגרת (משתמשת גם להצעה כולה וגם לשלב)
interface BorderConfig {
  style: "none" | "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge" | "decorative-gold" | "shadow-only";
  width: number;       // 0-10 px
  color: string;       // hex
  radius: number;      // 0-32 px
  padding: number;     // 0-40 px
  shadow: "none" | "sm" | "md" | "lg" | "xl" | "glow-gold";
  decorativeCorners?: boolean; // פינות זהב דקורטיביות
}

// חדש בתוך DesignSettings:
document_border: BorderConfig;          // מסגרת ראשית להצעה כולה
stage_border:    BorderConfig;          // מסגרת לכל שלב
summary_border:  BorderConfig;          // מסגרת לקלף סיכום מחיר
background: {
  type: "solid" | "gradient" | "paper";
  color1: string;
  color2?: string;          // לגרדיאנט
  direction?: "to-b" | "to-br" | "to-r";
  paperTone?: "warm" | "cool" | "ivory";
};
section_title: {
  style: "plain" | "gold-bar" | "gold-underline" | "filled" | "boxed";
  barColor: string;
  textColor: string;
};
fixed_header: { enabled: boolean; height: number; content: "logo" | "company" | "both" };
fixed_footer: { enabled: boolean; text: string; showPageNumbers: boolean };
```

## 2. UI — DesignSettingsSection (טאב חדש "מסגרות")

טאב חמישי בשם **"מסגרות"** עם:
- אקורדיון: מסגרת הצעה / מסגרת שלב / מסגרת סיכום
- בכל אחד: בורר סגנון (פרסטים ויזואליים 9), עובי (slider), צבע (color picker עם זהב כברירת מחדל), רדיוס (slider), צל (dropdown), פינות זהב (switch)
- כפתור "החל על כולם" — מעתיק את ההגדרה למסגרות האחרות
- 6 פרסטים מוכנים: "קלאסי", "יוקרתי זהב", "מודרני", "מינימלי", "קישוטי", "ספרותי"

טאב **"רקע"** (חדש): סוג רקע + צבעים + כיוון גרדיאנט + טון נייר.

טאב **"כותרות"** (חדש): סגנון כותרות שלבים (5 אפשרויות ויזואליות).

## 3. רינדור — PreviewIframe + generator

הרחבת מחולל ה-HTML:
- `<body>` עם background לפי `background.type`
- עטיפת `.quote-document` עם `document_border` (כולל פסאודו-אלמנטים `::before/::after` לפינות זהב דקורטיביות)
- כל `.stage-card` עם `stage_border`
- כותרת שלב לפי `section_title.style` (סרגל זהב צמוד מימין / קו תחתון / רקע מלא / מסגרת)
- `fixed_header`/`fixed_footer` ב-`position: sticky` + `@media print` קבועים

## 4. Override ברמת הצעה

בעורך הצעה בודדת (`QuoteEditor`):
- כפתור "🎨 התאמת עיצוב להצעה זו" פותח dialog עם אותו `DesignSettingsSection`
- ההצעה שומרת `design_overrides: Partial<DesignSettings>` ב-jsonb
- ב-merge: `effective = { ...templateDesign, ...overrides }`

## 5. Migration

הוספת עמודה `design_overrides jsonb default '{}'::jsonb` ל-`quotes`.
ערכי ברירת מחדל ל-`DesignSettings` הקיים — backward compatible (כל השדות החדשים אופציונליים עם defaults במחולל).

## פרטים טכניים
- כל הצבעים נשמרים כ-hex ב-DB, אבל ב-CSS שמייצרים — `hsl()` ישיר על הערך (לא טוקנים, כי זה תוכן יוצא ל-PDF/אורח חיצוני).
- `decorative-gold` ממומש ע"י 4 SVG פינות מוטמעות inline (לא חיצוני, לתאימות PDF).
- `paper` background = SVG טקסטורה inline base64.
- שמירה על ה-`border_style` הישן כ-deprecated, ממופה אוטומטית לסכמה החדשה ב-loader.

## קבצים שיווצרו / יערכו
- `types.ts` — סכמה חדשה + DEFAULT_BORDER + DESIGN_PRESETS
- `DesignSettingsSection.tsx` — 3 טאבים חדשים (Borders / Background / Headings)
- `BorderConfigEditor.tsx` (חדש) — קומפוננטה רב-שימושית למסגרת אחת
- `PreviewIframe.tsx` / generator — שימוש בהגדרות החדשות
- `QuoteEditor` — כפתור Override + dialog
- migration ל-`quotes.design_overrides`
