

# תוכנית: זיהוי חלקי לוגו עם AI וצביעה נפרדת

## הבעיה
כפתור "נקה רקע + זהה קווים" לא עובד כמצופה - הוא רק הופך פיקסלים כהים לשחור ומסיר רקע לבן, אבל לא מאפשר שינוי צבע אמיתי של אלמנטים בלוגו. ה-`mix-blend-mode: multiply` מגביל את התצוגה ומונע שליטה בצבעים.

## מה נבנה
מערכת AI שמזהה ומפרידה את הלוגו ל-3 שכבות עצמאיות, כל אחת עם צבע נפרד:
1. **קווים ובניינים** - קו הרקיע, מתאר הבניינים
2. **ריבועים/חלונות** - הריבועים הקטנים בבניין הגבוה
3. **טקסט** - "MALI TENENBAUM" ו-"Architecture & Design"

## שלבים

### 1. Edge Function חדשה: `process-logo`
- מקבלת תמונת לוגו (Base64) ומשתמשת ב-AI (gemini-2.5-flash-image) ליצירת 3 גרסאות צבועות של הלוגו
- עבור כל שכבה, שולחת prompt ל-AI: "Take this logo. Keep ONLY the [lines/squares/text], make them [selected color], make everything else transparent"
- מחזירה 3 תמונות Base64 מופרדות

### 2. עדכון DesignSettings
הוספת שדות חדשים:
```
stripLayers?: {
  lines?: { url: string; color: string; opacity: number };
  windows?: { url: string; color: string; opacity: number };
  text?: { url: string; color: string; opacity: number };
};
stripProcessed?: boolean;
```

### 3. עדכון UI בטאב "לוגו וסטריפ"
- כפתור "נקה רקע + זהה קווים" → קורא ל-Edge Function
- לאחר עיבוד, מציג 3 בקרות צבע נפרדות:
  - 🏗️ צבע קווים ובניינים
  - 🪟 צבע חלונות/ריבועים  
  - ✏️ צבע טקסט
- כל שינוי צבע שולח בקשה ל-AI לצבוע מחדש את השכבה המתאימה
- תצוגה מקדימה חיה: 3 תמונות מורכבות אחת על השנייה (position: absolute)

### 4. עדכון הרינדור והייצוא
- בתצוגה המקדימה ובייצוא HTML/Word/PDF - שילוב 3 השכבות כ-3 תמונות `<img>` ממוקמות absolute אחת מעל השנייה על רקע `stripBgColor`
- כל שכבה עם ה-opacity שלה

## פרטים טכניים
- **Edge Function**: `supabase/functions/process-logo/index.ts` - משתמשת ב-`google/gemini-2.5-flash-image` דרך Lovable AI Gateway
- **קובץ עיקרי**: `HtmlTemplateEditor.tsx` - הוספת UI שכבות + עדכון generateHtml
- **מודל AI**: `google/gemini-2.5-flash-image` עם `modalities: ["image", "text"]` - מאפשר עריכת תמונות
- תמונות השכבות נשמרות כ-Base64 ב-designSettings (ללא צורך ב-Storage)

