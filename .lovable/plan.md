

# תוכנית: הוספת לוגו החברה כסטריפ עליון מותאם אישית

## מה נבנה
הלוגו של Mali Tenenbaum (עם קו הרקיע של הבניינים) יהפוך לסטריפ ההדר של הצעות המחיר, במקום הגרדיאנט הזהוב הנוכחי. המשתמש יוכל לבחור צבע רקע וצבע לקווים/טקסטורה בנפרד.

## שלבים

### 1. העלאת הלוגו כ-asset בפרויקט
- העתקת `image-48.png` ל-`src/assets/company-header.png`
- הגדרתו כלוגו ברירת מחדל של החברה

### 2. הוספת מצב הדר חדש: "Custom Strip" (סטריפ מותאם)
בממשק DesignSettings, הוספת אפשרות חדשה `logoPosition: "custom-strip"` שבה:
- הלוגו מתפרס על כל רוחב ההדר (כמו full-width אבל עם שליטה בצבעים)
- **צבע רקע** (backgroundColor) - ניתן לשנות (לבן, שחור, זהב, כל צבע)
- **צבע הקווים/טקסטורה** - שינוי צבע הקווים והבניינים בלוגו באמצעות CSS filter או SVG manipulation
- שקיפות הלוגו נשמרת כך שהרקע נראה מאחור

### 3. בקרות UI חדשות בסיידבר העיצוב
בטאב "לוגו ועיצוב" (`HtmlTemplateEditor.tsx`):
- **בחירת מצב הדר**: רגיל / רוחב מלא / סטריפ מותאם
- **צבע רקע הסטריפ**: color picker
- **צבע הקווים**: color picker (מיושם כ-CSS filter על התמונה)
- **גובה הסטריפ**: slider (כמו הקיים)
- תצוגה מקדימה חיה בזמן שינוי הצבעים

### 4. עדכון ייצוא HTML/PDF
- ה-HTML שנוצר ב-`generateHTML` יתמוך במצב החדש
- הצבעים המותאמים ישתקפו גם ב-PDF/הדפסה

## פרטים טכניים
- **קובץ עיקרי**: `src/components/quotes/QuoteTemplatesManager/HtmlTemplateEditor.tsx`
- **DesignSettings interface**: הוספת שדות `stripBgColor`, `stripLineColor`
- שינוי צבע קווים בתמונת PNG יתבצע באמצעות CSS filters (`brightness`, `sepia`, `hue-rotate`, `saturate`) כדי לאפשר שינוי צבע דינמי ללא צורך ב-SVG
- התמונה תישמר גם בענן (Supabase Storage) כדי שתהיה זמינה בייצוא

