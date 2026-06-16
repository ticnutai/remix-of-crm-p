
## מטרות
1. ביטול הבהוב/קפיצה של ה-iframe בכל תו שמוקלד בעורך.
2. אפשרות לערוך טקסט ישירות בתוך התצוגה המקדימה (hover מסגרת זהב → קליק → contentEditable → blur שומר).

## שינויים ב-`HtmlTemplateEditor.tsx`

### A. ביטול re-render אגרסיבי של ה-preview (debounce 300ms)
1. **memoization של ה-HTML**: לעטוף את `generateHtmlContent()` ב-`useMemo` עם תלויות מפורשות (`editedTemplate`, `paymentSteps`, `designSettings`, `textBoxes`, `pricingTiers`, `selectedTier`, `projectDetails`, `upgrades`).
2. **debounce ל-srcDoc**: hook חדש `useDebouncedValue(html, 300)` — ה-iframe יקבל רק את הערך ה-debounced.
3. **קומפוננטה ממומויזת `PreviewIframe`** (קובץ חדש `PreviewIframe.tsx`): `React.memo` שמקבל `html`, `device`, `className`. רק היא תרונדר מחדש כשה-HTML ה-debounced משתנה — לא כל העורך הגדול.
4. החלפת כל 5 השימושים הקיימים ב-`<iframe srcDoc={generateHtmlContent()}>` ל-`<PreviewIframe html={debouncedHtml} ... />`.

### B. עריכה inline בתוך ה-preview
1. בתוך ה-HTML שנוצר ב-`generateHtmlContent`, להוסיף לכל טקסט עריך (כותרות, פסקאות, שם חבילה, תיאור שלב תשלום וכו') `data-editable="path.to.field"` ו-`data-field-id`.
2. ב-`PreviewIframe` להזריק ל-iframe סקריפט קטן שעושה:
   - CSS: על hover של `[data-editable]` → מסגרת זהב `2px solid #d8ac27` + cursor pointer.
   - on click → `contentEditable=true` + focus.
   - on blur / Enter → `postMessage({type:'inline-edit', field, value})` להורה, ואז `contentEditable=false`.
3. בהורה: `useEffect` שמאזין ל-`message` ומעדכן את ה-state המתאים (`editedTemplate.title`, `paymentSteps[i].description` וכו') לפי `field path`. עדכון ה-state יפעיל autosave הקיים.
4. כדי שהעריכה עצמה לא תגרום ל-srcDoc rebuild מיידי שיאפס את הסמן — בזמן `contentEditable=true` נסמן flag `isEditingInline` שדוחה את ה-debounce עד blur.

### C. רשימת שדות שיהפכו לעריכים inline (שלב ראשון)
- כותרת ראשית של ההצעה
- שם לקוח / שם פרויקט בכותרת
- שם כל חבילה (`pricingTier.name`) + תיאור
- שם שלב תשלום + תיאור
- טקסט של `textBoxes`
- פוטר/תנאים

(שדות מספריים כמו מחיר/אחוז נשארים בעורך — לא ניגעים בלוגיקה.)

## קבצים
- **חדש**: `src/components/quotes/QuoteTemplatesManager/PreviewIframe.tsx` (קומפוננטה ממומויזת + הזרקת סקריפט inline-edit).
- **חדש**: `src/hooks/useDebouncedValue.ts` (אם לא קיים).
- **ערוך**: `src/components/quotes/QuoteTemplatesManager/HtmlTemplateEditor.tsx` — memo+debounce ל-HTML, החלפת iframes, listener ל-postMessage, הוספת `data-editable` בתוך `generateHtmlContent`.

## סיכון / הערות
- הקובץ ב-12k שורות — אעבוד בעדכונים ממוקדים (line_replace), לא בכתיבה מחדש.
- הזרקת הסקריפט תיעשה בתוך ה-HTML עצמו (`<script>`) שמתנגן בתוך ה-iframe; התקשורת להורה דרך `window.parent.postMessage` עם origin check.
- לא נוגעים ב-autosave/מחירים/לוגיקה עסקית — רק presentation + עריכת טקסט.
