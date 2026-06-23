# 🗄️ Supabase — כל הפרטים והנתיבים במקום אחד

> מסמך זה מרכז את **כל** המידע על חשבון ה-Supabase של הפרויקט, כולל **נתיבים מלאים** לכל הקבצים הרלוונטיים.

---

## 🔑 פרטי הפרויקט (Credentials)

| פרט             | ערך                                          |
| --------------- | -------------------------------------------- |
| **Project Ref / ID** | `eadeymehidcndudeycnf`                  |
| **Project URL** | `https://eadeymehidcndudeycnf.supabase.co`   |
| **Anon Key**    | ראה למטה ⬇                                   |

### Anon / Publishable Key (מלא — בטוח לחשיפה)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM
```

---

## 📁 נתיבים מלאים לכל הקבצים

> שורש הפרויקט במחשב שלך הוא בדרך כלל משהו כמו:
> `C:\Users\<USER>\<PROJECT_FOLDER>\` (Windows) או `/Users/<USER>/<PROJECT_FOLDER>/` (Mac/Linux).
>
> כל הנתיבים למטה הם **יחסיים לשורש הפרויקט**.

| קובץ                                           | נתיב יחסי מלא                              | סטטוס                |
| ---------------------------------------------- | ------------------------------------------ | -------------------- |
| **`.env`** (משתני סביבה — מכיל את המפתחות)    | `./.env`                                   | ⚠ מוסתר ב-Git        |
| **`.env.example`** (תבנית ציבורית)             | `./.env.example`                           | ✅ גלוי               |
| **Supabase Client** (קוד חיבור)                | `./src/integrations/supabase/client.ts`    | ✅ גלוי               |
| **Supabase Types** (טיפוסי TypeScript)         | `./src/integrations/supabase/types.ts`     | ✅ גלוי (auto-gen)    |
| **Supabase Config** (הגדרות מקומיות)           | `./supabase/config.toml`                   | ✅ גלוי               |
| **Edge Functions** (פונקציות שרת)              | `./supabase/functions/`                    | ✅ תיקייה             |
| **Migrations** (היסטוריית שינויי DB)           | `./supabase/migrations/`                   | ✅ תיקייה             |
| **Vite Config** (fallback לערכי env)           | `./vite.config.ts`                         | ✅ גלוי               |

---

## ⚠ למה אני לא רואה את `.env`?

קובץ `.env` **קיים** בשורש הפרויקט, אבל הוא **מוסתר ע"י Git** דרך `.gitignore` (כדי לא לדחוף סודות ל-GitHub).

### איך לראות אותו:

#### ב-VS Code / Cursor:
1. לחץ `Ctrl + P` (או `Cmd + P` במק)
2. הקלד: `.env`
3. בחר את הקובץ מהרשימה

#### ב-Windows Explorer:
1. פתח את תיקיית הפרויקט
2. View → ✅ Hidden items
3. הקובץ `.env` יופיע

#### דרך טרמינל (PowerShell):
```powershell
# הצגת כל הקבצים כולל מוסתרים
Get-ChildItem -Force -Path . -Filter ".env*"

# הצגת תוכן הקובץ
Get-Content .env
```

#### דרך טרמינל (Mac/Linux):
```bash
ls -la | grep .env
cat .env
```

---

## 📝 תוכן הקובץ `.env` (מה אמור להיות בו)

```env
VITE_SUPABASE_URL="https://eadeymehidcndudeycnf.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM"
VITE_SUPABASE_PROJECT_ID="eadeymehidcndudeycnf"
```

> 💡 אם הקובץ נמחק או חסר — פשוט העתק את התוכן הזה לקובץ חדש בשם `.env` בשורש הפרויקט.

---

## 👤 חשבון אדמין

| פרט        | ערך                 |
| ---------- | ------------------- |
| **Email**  | `jj1212t@gmail.com` |
| **סיסמה**  | `543211`            |

---

## 🔍 איך לאתר את כל הנתיבים האלה במחשב שלך (PowerShell)

```powershell
# מעבר לתיקיית הפרויקט (התאם את הנתיב)
cd C:\Users\<USER>\<PROJECT_FOLDER>

# הצגת הנתיב המלא המוחלט של כל קובץ חשוב
(Get-Item .env -Force).FullName
(Get-Item .env.example).FullName
(Get-Item src\integrations\supabase\client.ts).FullName
(Get-Item src\integrations\supabase\types.ts).FullName
(Get-Item supabase\config.toml).FullName
(Get-Item supabase\functions).FullName
```

ב-Mac/Linux:
```bash
realpath .env
realpath src/integrations/supabase/client.ts
realpath supabase/config.toml
```

---

## 🔧 בדיקה מהירה שהכל מחובר

פתח את `src/integrations/supabase/client.ts` — אמור להיות כתוב שם:

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

זה אומר שהקוד **קורא את הערכים מ-`.env`** — לכן חובה שהקובץ יהיה קיים בשורש.

---

## 📌 סיכום — מה הכי חשוב לזכור

1. ✅ `.env` נמצא ב-**שורש הפרויקט** (לא בתוך `src/` ולא בתוך `supabase/`)
2. ✅ הוא **מוסתר ב-Git** ולכן לא נראה ברשימת הקבצים הרגילה
3. ✅ אם הוא חסר — פשוט צור אותו עם 3 השורות מסעיף "תוכן הקובץ `.env`"
4. ✅ כל המפתחות (URL + Anon Key) כתובים במסמך הזה — תמיד אפשר לחזור לפה

---

**עודכן:** 23 ביוני 2026
