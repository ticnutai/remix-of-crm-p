## המטרה

להוסיף ל-Flow Engine **עורך עשיר** (Rich Text Editor) שמקבל את התבנית הקיימת, ממיר אותה למסמך זורם אחד, מאפשר עריכה חופשית — ואז מציג תצוגה מקדימה מעומדת עם Header/Footer/לוגו/מספור עמודים.

## הזרימה

```text
תבנית קיימת (תיבות, סעיפים, שדות דינמיים)
        │
        ▼
[המרה חד-פעמית] ──►  מסמך Flow אחד (HTML/JSON זורם)
        │
        ▼
[Tab 1: עורך עשיר]   ◄── המשתמש עורך טקסט חופשי
   - Bold/Italic/צבעים/הדגשה
   - כותרות, רשימות, טבלאות
   - שדות דינמיים {{customer.name}} כצ׳יפס
   - RTL מלא, עברית
        │
   (autosave לזיכרון מקומי per-template)
        │
        ▼
[Tab 2: תצוגה מקדימה]  ◄── עימוד אוטומטי + Header/Footer/לוגו/מספור
   - כפתור הדפסה / PDF
```

## מבנה הקבצים החדשים

הכל בתוך `src/components/quotes/QuoteTemplatesManager/flow-engine/` (מבודד מהמערכת הישנה):

- `editor/FlowEditor.tsx` — עורך מבוסס **TipTap** (ProseMirror) עם תפריט עליון.
- `editor/extensions/DynamicField.ts` — Node מותאם לשדות דינמיים `{{...}}` כצ׳יפס לא-עריך.
- `editor/MenuBar.tsx` — סרגל כלים (Bold, Italic, צבע, כותרת, רשימה, טבלה, הוספת שדה).
- `editor/templateToHtml.ts` — ממיר חד-פעמי: `QuoteTemplate` → HTML זורם נקי (משתמש ב-`sanitizeRaw` הקיים).
- `editor/htmlToFlowDoc.ts` — ממיר HTML מהעורך → `FlowDocument` הקיים, כך שה-`renderer.ts` ממשיך לעבוד בלי שינוי.
- `FlowWorkspaceTab.tsx` — הטאב הראשי החדש עם שני תתי-טאבים פנימיים: "עריכה" / "תצוגה מקדימה".

## שינויים בקבצים קיימים

- `HtmlTemplateEditor.tsx` — מחליף את הטאב "Flow V2" הקיים ב-`FlowWorkspaceTab` (אותו שם טאב, אותו אייקון).
- `FlowPreviewTab.tsx` — מקבל פרופ אופציונלי `editedHtml?: string` במקום לסרייליז מהתבנית; אם קיים — מרנדר אותו, אחרת מתנהג כמו היום.

## פרטים טכניים

- **TipTap**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-highlight`, `@tiptap/extension-table` (+row/cell/header), `@tiptap/extension-text-align`. תוספים שמורים — אין צורך ב-Pro.
- **כיוון RTL**: `editorProps.attributes.dir = 'rtl'` + class על ה-`prose` של Tailwind Typography.
- **שדות דינמיים**: Node מסוג `inline atom` שמוצג כ-badge כחול-זהב (טוקנים סמנטיים בלבד — `bg-accent/20 text-accent-foreground`). הוספה דרך תפריט "הוסף שדה" (רשימת שדות מותרת: `customer.name`, `parcel.block`, `parcel.lot`, `parcel.plot`, `customer.address`, `quote.number`, `quote.date`, וכו'). בייצוא ל-HTML הם נשמרים כ-`{{key}}` רגיל, וה-`renderer` הקיים יודע לעבד.
- **אחסון**: HTML שנערך נשמר ב-`localStorage` תחת `flow-edit:${templateId}` (autosave 600ms debounce). כפתור "אפס לתבנית" מחזיר ל-HTML המקורי.
- **תצוגה מקדימה**: ממירה HTML → `FlowDocument` ע"י parsing פשוט של DOM (h1-h3 → heading, p → paragraph, ul/ol → list, table → table) ואז `renderFlowToHtml` הקיים + Paged.js → אותו pipeline נקי שכבר עובד.
- **צבעים**: שימוש בלעדי בטוקנים סמנטיים מ-`index.css` (primary/accent/muted/foreground). ללא `text-white`/`#xxx` בקוד הקומפוננטות.
- **אין נגיעה** ב-`paged-engine/` הישן, ב-`text_boxes`, או בעורך התבניות הקיים. כל מה שמתווסף חי בתוך `flow-engine/editor/`.

## אישור לפני בנייה

האם להמשיך עם המבנה הזה? (TipTap + טאב עריכה + טאב תצוגה מקדימה בתוך אותו workspace).
