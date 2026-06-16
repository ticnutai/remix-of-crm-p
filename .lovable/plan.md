
## תכנית ביצוע מלאה — שמירה לענן + כל ההמלצות

המיגרציה לעמודת `quotes.design_overrides jsonb` כבר בוצעה בהצלחה ✓. כעת אצא לפועל עם כל השינויים הבאים:

---

### 1. תיקון השמירה (Core Bug Fix)
**`src/hooks/useQuotes.ts`**
- הוספת `quote_template_id?: string` ו-`design_overrides?: Record<string, any>` ל-interface `Quote`.
- `updateQuote` כבר עושה spread של updates — יעבור אוטומטית.

**`src/components/quotes/QuoteDocumentEditor/QuoteEditorSheet.tsx` + `index.tsx`**
- ב-`handleSave`, להוסיף לאובייקט ה-update:
  ```ts
  design_overrides: {
    frameDesign: document.frameDesign ?? null,
    design3D: document.design3D ?? null,
    fontSettings: document.fontSettings ?? null,
    sectionStyles: document.sectionStyles ?? null,
  }
  ```

**`src/components/quotes/QuoteDocumentEditor/hooks/useQuoteDocument.ts`**
- ב-`convertQuoteToDocument`, לטעון בחזרה:
  ```ts
  frameDesign: (quote as any).design_overrides?.frameDesign,
  design3D: (quote as any).design_overrides?.design3D,
  fontSettings: (quote as any).design_overrides?.fontSettings,
  sectionStyles: (quote as any).design_overrides?.sectionStyles,
  ```

---

### 2. המלצה A — אינדיקציה ויזואלית + Reset
**`EditorSidebar.tsx`** — בתוך ה-AccordionContent של "מסגרות ורקע":
- באנר זהב קטן: `🎨 עיצוב מותאם להצעה זו פעיל` (מופיע רק כשיש frameDesign override).
- כפתור `איפוס לעיצוב התבנית` שמנקה `frameDesign` ב-state.

### 3. המלצה B — החלה על התבנית
- כפתור `החל עיצוב זה על כל ההצעות מהתבנית`:
  - שולף את `quote_template_id` של ההצעה הנוכחית.
  - מבצע `update quote_templates set design_settings = jsonb_set(design_settings, '{frameDesign}', ...)`.
  - Toast אישור.
  - מנוטרל כשאין `quote_template_id`.

### 4. המלצה C — Autosave
**`useQuoteDocument.ts`**
- `useEffect` עם debounce של 1.5s ששומר ל-`localStorage` תחת מפתח `quote-draft-${originalQuoteId || 'new'}`.
- `loadQuote` ינסה לשחזר draft אם קיים ויציג טוסט "שוחזרה טיוטה".
- ניקוי הטיוטה אחרי שמירה ידנית מוצלחת.

### 5. המלצה D — הרחבת ה-override
כבר נכלל בסעיף 1: `design_overrides` הוא jsonb גמיש שמכיל `frameDesign`, `design3D`, `fontSettings`, `sectionStyles`. עתידית אפשר להוסיף עוד שדות בלי מיגרציה נוספת.

---

### 6. עדכון זיכרון
הוספת רשומה ב-`mem://features/quote-editor/per-quote-overrides` שמתעדת:
- העמודה החדשה `quotes.design_overrides`
- שמירה כוללת frameDesign/design3D/fontSettings/sectionStyles
- אפשרות "החל על תבנית" + reset

---

## קבצים שיתעדכנו
1. `src/hooks/useQuotes.ts` — הוספת שדות ל-interface
2. `src/components/quotes/QuoteDocumentEditor/hooks/useQuoteDocument.ts` — טעינה + autosave
3. `src/components/quotes/QuoteDocumentEditor/QuoteEditorSheet.tsx` — שמירת overrides
4. `src/components/quotes/QuoteDocumentEditor/index.tsx` — שמירת overrides
5. `src/components/quotes/QuoteDocumentEditor/EditorSidebar.tsx` — באנר + 2 כפתורים
6. `mem://features/quote-editor/per-quote-overrides` (חדש) + עדכון `mem://index.md`

ללא שינויי schema נוספים (המיגרציה בוצעה), ללא תלות חיצונית חדשה.

**אישור → בנייה.**
