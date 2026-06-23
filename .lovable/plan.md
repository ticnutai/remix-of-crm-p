
## המצב הנוכחי

הקובץ `PagesPreviewTab.tsx` (1699 שורות) משתמש כיום בשיטה פרימיטיבית:
- iframe יחיד עם כל ה-HTML
- כל "עמוד" הוא בעצם `translateY(-pageIdx * 1123px)` על אותו iframe
- חישוב מספר עמודים = `scrollHeight / A4_H` (גרוס - לא מתחשב באלמנטים שנחתכים)
- "תקן עימוד" - heuristic שמזריק `page-break-before` ידנית
- אין `widows/orphans`, אין שליטה אמיתית על חיתוכים

זו הסיבה שהפריסה "נוראית" - אין מנוע פריסה אמיתי, רק הזזה ויזואלית.

## הפתרון: paged.js + ארכיטקטורה חדשה

[paged.js](https://pagedjs.org/) הוא polyfill ל-CSS Paged Media מ-W3C - מנוע פריסה אמיתי שמשמש את Hugo, MDN, ועיתונאות מקצועית. הוא מבצע fragmentation אמיתי של DOM לעמודים נפרדים עם `@page`, headers/footers חוזרים, ושמירה על widows/orphans.

### מבנה חדש

```text
src/components/quotes/QuoteTemplatesManager/
├── PagesPreviewTab.tsx          (orchestrator - ~300 שורות)
└── paged-engine/
    ├── PagedRenderer.tsx        (מריץ paged.js ב-iframe מבודד)
    ├── PageViewport.tsx         (תצוגה של עמוד יחיד אחרי fragmentation)
    ├── ViewModeContainer.tsx    (single/continuous/spread/grid)
    ├── useKeyboardNav.ts        (hook לניווט מקלדת)
    └── usePagedLayout.ts        (hook שמטפל ב-paged.js lifecycle)
```

### צעדי ביצוע

**1. התקנת paged.js**
```
bun add pagedjs
```

**2. PagedRenderer - מנוע פריסה אמיתי**
- iframe נסתר שמריץ את paged.js על ה-HTML
- paged.js מחלק את התוכן ל-`.pagedjs_page` divs נפרדים (אחד לכל עמוד)
- מאזין `afterRendered` → מחזיר מספר עמודים אמיתי + DOM של כל עמוד
- תוצאה: כל עמוד הוא div עצמאי שלא נחתך - ה-engine ספציפי לכך

**3. CSS Paged Media מקצועי**
```css
@page {
  size: A4;
  margin: 20mm 15mm;
  @top-center { content: element(header); }
  @bottom-center { content: counter(page) " / " counter(pages); }
}
h1, h2, h3 { break-after: avoid; widows: 3; orphans: 3; }
table, figure, .stage-card { break-inside: avoid; }
.page-break { break-before: page; }
```

**4. 4 מצבי תצוגה (toggle בטולבר)**
- **דף בודד** - עמוד אחד מרכזי, גלילה חלקה בין עמודים (קיים)
- **גלילה רציפה** - כל העמודים גלולים אנכית עם רווח בין כל אחד (חדש - כמו Word/Google Docs) ← פותר את תלונת "אין גלילה אנכית"
- **תצוגת ספר (Spread)** - שני עמודים זה לצד זה כמו InDesign (חדש)
- **רשת (Grid)** - thumbnails של כל העמודים (קיים)

**5. ניווט מקלדת (`useKeyboardNav` hook)**
- `←` / `→` - עמוד הבא/קודם (RTL aware: ← = הבא בעברית)
- `Space` - גלילה למטה (חצי עמוד)
- `Shift+Space` - גלילה למעלה
- `Home` / `End` - עמוד ראשון / אחרון
- `Ctrl+G` - דיאלוג קפיצה לעמוד
- `PageUp` / `PageDown` - עמוד שלם

מאזין ב-`document` כשהפוקוס באזור התצוגה (לא מפריע לעריכת טקסט בטולבר/popover).

**6. תאימות לאחור**
- שמירת ה-FixState הקיים (safe zones, protected blocks) - paged.js יקבל אותם כ-CSS
- שמירת תפריט "תקן עימוד" - יעבוד עם המנוע החדש
- שמירת PDF/Word export - יקבלו את ה-HTML שעבר fragmentation

## פרטים טכניים

**אינטגרציה עם paged.js:**
```ts
import { Previewer } from 'pagedjs';
const previewer = new Previewer();
const flow = await previewer.preview(html, [stylesheet], renderContainer);
// flow.total = מספר עמודים אמיתי
// flow.pages = מערך של DOM elements, אחד לעמוד
```

**ביצועים:** paged.js רץ פעם אחת כש-`finalHtml` משתנה (debounced 500ms), התוצאה נשמרת ב-state. החלפת מצב תצוגה לא מריצה rerender של המנוע.

**RTL:** paged.js תומך מלא ב-`direction: rtl` כולל ניווט עמודים מימין-לשמאל בתצוגת spread.

## קבצים שייווצרו/ישתנו

**חדש:**
- `src/components/quotes/QuoteTemplatesManager/paged-engine/PagedRenderer.tsx`
- `src/components/quotes/QuoteTemplatesManager/paged-engine/PageViewport.tsx`
- `src/components/quotes/QuoteTemplatesManager/paged-engine/ViewModeContainer.tsx`
- `src/components/quotes/QuoteTemplatesManager/paged-engine/useKeyboardNav.ts`
- `src/components/quotes/QuoteTemplatesManager/paged-engine/usePagedLayout.ts`

**שינוי:**
- `src/components/quotes/QuoteTemplatesManager/PagesPreviewTab.tsx` - refactor למשתמש במנוע החדש (יקוצר משמעותית)
- `package.json` - הוספת `pagedjs`

לאישור והתחלת ביצוע.
