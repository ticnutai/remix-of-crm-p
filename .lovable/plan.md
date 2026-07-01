
# תוכנית מיזוג טאב עיצוב → Flow

## עיקרון מנחה
**מקור אמת יחיד:** `designSettings` (ב-`quote_templates.design_settings`) נשאר בדיוק כפי שהוא. הנתונים לא זזים — רק ה-UI מתאחד. כל פעולה שהייתה בטאב עיצוב מתבצעת דרך אותה state, רק שהגישה עוברת דרך פאנלים של Flow.

## שלב 1 — הרחבת `DesignPreset` (בלי לשבור קיים)
מוסיפים שדות חדשים אופציונליים ל-`DesignPreset` שיאחסנו את מה שהיה בטאב עיצוב:
- `brand.logo` — url, גובה, מיקום (השדות של פאנל הלוגו)
- `brand.primaryColor` / `secondaryColor` / `headerBg`
- `effects` — shadow, gradient, angle, elevation, borderRadius
- `typography.globalFont` (כבר קיים חלקית)
- `frameDesign` — משתמש ב-`FrameDesignSettings` הקיים

הכל אופציונלי — ערכות קיימות ממשיכות לעבוד.

## שלב 2 — הרחבת `PresetEditorDialog` בטאבים חדשים
```text
טאבים נוכחיים:  טיפוגרפיה | צבעים | כותרות | בלוקים | סטריפים
טאבים חדשים:    + מותג (לוגו)  + אפקטים  + מסגרת
```
כל טאב חדש = הזזה של הבלוק הקיים מ-`HtmlTemplateEditor.tsx` (design tab) לתוך קומפוננטה נפרדת ב-`flow-engine/presets/panels/`:
- `LogoPanel.tsx`
- `EffectsPanel.tsx`
- `FramePanel.tsx`
משתמשים באותם sub-components (FrameDesignPanel כבר קיים כרכיב עצמאי).

## שלב 3 — ייבוא פלטות הצבעים המוכנות
- קורא את `DesignTemplatesSelector` הקיים ומחלץ את הפלטות
- Seed חד-פעמי לטבלת `flow_design_presets` כערכות מובנות (built-in flag), רק אם עוד לא קיימות למשתמש
- מסומנות כ"ערכות מוכנות" (badge) ב-`PresetPicker`

## שלב 4 — Bridge דו-כיווני של state
בעורך יש שתי מפות:
- `designSettings` (הישן, בשימוש ב-render legacy + preview + PDF)
- `activePreset` (Flow)

**פתרון:** בתוך `FlowWorkspaceTab`, כשמשנים ערכה או ערך בפאנל מותג/אפקטים — מעדכנים גם את `designSettings` המקומי (via prop callback `onDesignSettingsChange`). כך:
- שדות המותג מסונכרנים בין העורך הישן ל-Flow
- שמירה לענן ממשיכה דרך הזרם הקיים של `designSettings`
- ה-preview וה-PDF ממשיכים לקרוא מ-`designSettings` — אפס שינוי ב-render

## שלב 5 — הסרת טאב "עיצוב"
- מסירים את `<TabsContent value="design">` (שורות 9813-10627) מ-`HtmlTemplateEditor.tsx`
- מסירים את הכניסה `design` מ-`tabsMeta` ומהמערך `tabsOrder`
- מסירים מ-`allowedTabs`
- ה-state `designSettings` נשאר — הוא ממשיך להיות המקור

## שלב 6 — בדיקת ודאות עם Playwright
1. פתיחת עורך → אין טאב עיצוב
2. Flow → ערכות → עריכת ערכה → 8 טאבים כולל מותג/אפקטים/מסגרת
3. שינוי לוגו בערכה → מופיע ב-preview
4. שינוי צבע פרימרי → מופיע ב-preview וב-PDF
5. פלטות מוכנות מופיעות ב-Picker
6. צילומי מסך השוואה

## קבצים שיושפעו
- **חדשים:**
  - `flow-engine/presets/panels/LogoPanel.tsx`
  - `flow-engine/presets/panels/EffectsPanel.tsx`
  - `flow-engine/presets/panels/FramePanel.tsx`
  - `flow-engine/presets/seedBuiltIns.ts` (ייבוא פלטות)
- **מורחבים:**
  - `flow-engine/presets/types.ts` — שדות חדשים ב-DesignPreset
  - `flow-engine/presets/PresetEditorDialog.tsx` — 3 טאבים חדשים
  - `flow-engine/FlowWorkspaceTab.tsx` — bridge ל-designSettings
- **מכווצים:**
  - `HtmlTemplateEditor.tsx` — מחיקת ~815 שורות של טאב design + הפניה מ-tabsMeta

## סיכונים ואיך מונעים אותם
1. **שבירת render:** ה-render קורא מ-`designSettings` — לא נוגע בו. הכל bridge בלבד.
2. **אובדן נתוני משתמש:** לא מוחקים שדות מ-`designSettings`. רק ה-UI זז.
3. **ערכות ישנות:** השדות החדשים אופציונליים — ערכות קיימות עובדות כרגיל.
4. **פלטות כפולות:** seed בודק קיום לפי שם לפני הוספה.

## מה לא נכלל
- לא משנים את מנוע ה-render/PDF
- לא משנים את `syncPayments` / `serializer` / הסטריפים
- לא נוגעים בטאבי project/content/payments/preview

## אישור
לפני שאני מתחיל לקוד — האם התוכנית מקובלת? אם כן, אני מבצע בסדר: שלב 1 → 2 → 3 → 4 → 5 → 6, בסוף בדיקת Playwright עם צילומים.
