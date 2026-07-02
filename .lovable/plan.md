# החלפת מנוע העימוד בעורך ל-Paged.js (סנכרון 1:1 עם ה-PDF)

## המטרה
לבטל את `tiptap-pagination-plus` ולהשתמש ב-**מנוע אחד בלבד** (Paged.js) גם בעריכה וגם בתצוגה. שבירות עמוד יהיו זהות לחלוטין — אפס פערים.

## אתגר מרכזי
Paged.js מייצר DOM סטטי (`.pagedjs_page`) — הוא לא עורך. TipTap צריך להישאר עורך חי. הפתרון: **ארכיטקטורת Overlay** — TipTap עורך תוכן זורם אחד, ולידו/מתחתיו Paged.js מרנדר תצוגה מפוגגת בזמן אמת כרפרנס ויזואלי.

## ארכיטקטורה חדשה — "Live Paged Editor"

```text
+----------------------------------------------------+
| Toolbar (עיצוב, סטריפים, תשלומים, השוואה...)      |
+----------------------------------------------------+
| Split או Overlay                                    |
|                                                     |
|  [TipTap Flow] (זרימה רציפה, בלי pagination plus)   |
|         ↓ debounce 400ms                            |
|  [Paged.js Live Preview] (מתעדכן עם כל הקלדה)      |
|         ↓                                           |
|  קוי מדריך (Guide Lines) שמסומנים על העורך         |
|  ב-Y-positions שבהם Paged.js שבר עמוד              |
+----------------------------------------------------+
```

## מצבי תצוגה בטאב Flow

1. **עריכה קלאסית** — TipTap זורם + קווים מקווקווים דקים שמסמנים את שבירות ה-PDF (מגיעים מ-Paged.js ברקע).
2. **תצוגה מקדימה** — Paged.js בלבד (כמו היום).
3. **השוואה** — כמו שיש היום, אבל כעת יהיו זהים.
4. **חדש: מצב "עמוד-על-עמוד"** — TipTap עורך שקוף מעל Paged.js render (העורך מקבל את ה-clip-path של הדפים).

## שינויים בקבצים

### הסרה
- `tiptap-pagination-plus` — כל ההגדרות מ-`FlowEditor.tsx` (extensions, options).
- כל התייחסות ל-`updatePageBreakBackground`, `PaginationPlusOptions`.

### קובץ חדש: `flow-engine/editor/PagedGuides.ts`
- הוק שמריץ Paged.js ברקע (Web Worker אם אפשר, אחרת off-screen iframe).
- מחזיר `pageBreakYPositions: number[]` — הקואורדינטות ב-mm שבהן שבירות עמוד נופלות.
- מזין את הערכים ל-CSS variables של העורך.

### עדכון: `flow-engine/editor/FlowEditor.tsx`
- הסרת ההגדרה של `PaginationPlus.configure(...)`.
- הוספת שכבת overlay `<div class="page-guides">` שמצייר קווים אופקיים ב-Y-positions מ-Paged.js.
- הוספת שולי `@page` "אמיתיים" (padding-top/bottom של כל pseudo-page) שיוצגו כאזורי header/footer מוגנים.

### עדכון: `flow-engine/FlowWorkspaceTab.tsx`
- הוספת טוגל "הצג מדריכי עמוד" (ברירת מחדל: פועל).
- הסרת האפשרות "בטל מספור" מהעורך (מגיע כעת מ-Paged.js אחד).

### קובץ חדש: `flow-engine/editor/pagedWorker.ts`
- Worker/off-screen שמקבל HTML + preset ומחזיר breakpoints.
- מבטל requests קודמים כשמגיע HTML חדש.

## פתרון סוגיות ידועות

- **ביצועים:** Paged.js לוקח ~300-800ms על מסמך A4. debounce 400ms + Web Worker.
- **פונטים async:** ממתינים ל-`document.fonts.ready` לפני חישוב, מריצים render שני אחרי טעינת פונטים כבדים (David).
- **טבלת תשלומים דינמית:** ה-PaymentsBlock כבר Node של TipTap, ממשיך לעבוד — Paged.js מכבד `break-inside: avoid` שלו.
- **מצב offline / render fail:** נשמור fallback — אם Paged.js נופל, מציגים אזהרה קטנה ("מדריכי עמוד לא זמינים") אבל העורך עצמו עובד.

## מה יורגש בפועל
- אפס הפרש בין עריכה ל-PDF.
- העורך יראה קווים דקים (1px, `border-color: hsl(var(--border))`) בדיוק במקום שבו יישבר עמוד ב-PDF.
- כשמוסיפים שורה — הקווים "קופצים" לפי החישוב החדש (עם delay של ~400ms).
- קלט Undo/Redo, סטריפים, ערכות, טבלת תשלומים — כולם ממשיכים לעבוד כמו שהם.

## מה לא ישתנה
- מבנה הנתונים (`FlowDocument`, `serializer.ts`).
- שמירה לענן, ניהול טיוטות.
- טאבי המשנה (עריכה/תצוגה/השוואה).
- ה-Print dialog וייצוא ה-PDF.

## סיכון
- Web Worker + Paged.js דורש polyfill לחלק מה-DOM APIs. אם ייתקע — נריץ ב-off-screen iframe (יותר איטי אבל בטוח).
- אם המסמך ענק (30+ עמודים) — נעבור למצב "ידני" (מחשב מחדש רק בלחיצה).

## אישור
מאשר לביצוע? אחרי אישור אתחיל בסדר: (1) קובץ ה-Worker, (2) שילוב ב-FlowEditor, (3) הסרת PaginationPlus, (4) בדיקת Playwright שההשוואה מראה 0 פערים.
