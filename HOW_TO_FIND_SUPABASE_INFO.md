# 🔍 איך למצוא פרטי Supabase בכל פרויקט

מדריך שלב-אחרי-שלב למציאת כל המידע על חשבון Supabase בפרויקט כלשהו.

---

## 1. מציאת Project Ref / URL

**איפה לחפש:**

```
supabase/config.toml          → project_id = "xxx"
.env / .env.local              → VITE_SUPABASE_URL / SUPABASE_URL
vite.config.ts / next.config.js → fallback URL hardcoded
```

**פקודת חיפוש:**

```powershell
# מחפש כל URL של Supabase בפרויקט
Select-String -Path "**/*" -Pattern "supabase\.co" -Recurse
```

**ידנית ב-Dashboard:**

- https://supabase.com/dashboard → בחר פרויקט → Settings → General → Reference ID

---

## 2. מציאת Anon Key (מפתח ציבורי)

**איפה לחפש:**

```
.env / .env.local              → VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY
vite.config.ts                 → fallback key
scripts/*.mjs                  → SUPABASE_ANON_KEY hardcoded
src/integrations/supabase/     → client.ts initialization
```

**פקודת חיפוש:**

```powershell
# מחפש JWT tokens (כל מפתח Supabase מתחיל ב-eyJhbG)
Select-String -Path "**/*" -Pattern "eyJhbGciOi" -Recurse
```

**ידנית ב-Dashboard:**

- Settings → API → Project API keys → `anon` / `public`

---

## 3. מציאת Service Role Key

> ⚠️ ה-Service Role Key **לא אמור** להיות בקוד! אם הוא שם — זו בעיית אבטחה.

**איפה לחפש:**

```powershell
Select-String -Path "**/*" -Pattern "service.role|SERVICE_ROLE" -Recurse
```

**ידנית ב-Dashboard:**

- Settings → API → Project API keys → `service_role` (מוסתר, לחצו "Reveal")

---

## 4. מציאת חשבון אדמין

**איפה לחפש:**

```
scripts/*.mjs                  → ADMIN_EMAIL / ADMIN_PASSWORD
.env                           → credentials
*LOGIN*.md / *START*.md        → תיעוד כניסה
```

**פקודת חיפוש:**

```powershell
Select-String -Path "**/*" -Pattern "ADMIN_EMAIL|ADMIN_PASSWORD|admin.*@" -Recurse
```

**ידנית ב-Dashboard:**

- Auth → Users → רשימת כל המשתמשים

---

## 5. מציאת Storage Buckets

**איפה לחפש:**

```powershell
# מחפש שמות buckets בקוד
Select-String -Path "src/**/*" -Pattern "storage.*from\(|\.from\('.*-files" -Recurse
```

**ידנית ב-Dashboard:**

- Storage → רואים את כל ה-buckets

---

## 6. מציאת Edge Functions

**איפה לחפש:**

```powershell
# כל התיקיות תחת supabase/functions/ הן edge functions
Get-ChildItem -Path "supabase/functions" -Directory | Select-Object Name
```

**ידנית ב-Dashboard:**

- Edge Functions → רשימת כל הפונקציות

---

## 7. מציאת כל הטבלאות

**אם יש קובץ types מיוצר (Supabase auto-generated):**

```powershell
# חילוץ שמות טבלאות מ-types.ts
Select-String -Path "src/integrations/supabase/types.ts" -Pattern '^\s{6}\w+:\s*\{$' |
  ForEach-Object { $_.Line.Trim().TrimEnd(': {').TrimEnd(' {') } |
  Sort-Object -Unique
```

**חיפוש בקוד:**

```powershell
# מחפש כל קריאות supabase.from('table_name')
Select-String -Path "src/**/*" -Pattern "\.from\(['""](\w+)['""]\)" -Recurse
```

**ידנית ב-Dashboard:**

- Table Editor → רואים את כל הטבלאות

---

## 8. מציאת Environment Variables

**איפה לחפש:**

```powershell
# מוצא את כל קבצי .env
Get-ChildItem -Path "." -Filter ".env*" -Force

# מחפש שימוש ב-env vars בפרונטנד (Vite)
Select-String -Path "src/**/*" -Pattern "import\.meta\.env\.\w+" -Recurse

# מחפש שימוש ב-env vars בצד שרת (Node)
Select-String -Path "**/*" -Pattern "process\.env\.\w+" -Recurse

# מחפש שימוש ב-env vars ב-Edge Functions (Deno)
Select-String -Path "supabase/functions/**/*" -Pattern "Deno\.env\.get" -Recurse
```

---

## 9. בדיקה שאין בלבול בין פרויקטים

**זה החשוב ביותר!** מוודא שכל הקוד מצביע לאותו פרויקט:

**בדיקת URLs:**

```powershell
# מוצא את כל ה-project refs הייחודיים
Select-String -Path "**/*" -Pattern "https://\w+\.supabase\.co" -Recurse |
  ForEach-Object {
    [regex]::Match($_.Line, 'https://(\w+)\.supabase\.co').Groups[1].Value
  } | Sort-Object -Unique
```

> ✅ אם יוצא ref אחד בלבד — הכל תקין
> ❌ אם יוצא יותר מאחד — יש בלבול!

**בדיקת מפתחות:**

```powershell
# מוצא את כל ה-JWT tokens הייחודיים
Select-String -Path "**/*" -Pattern "eyJhbGciOi" -Recurse |
  ForEach-Object {
    [regex]::Match($_.Line, 'eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+').Value
  } | Sort-Object -Unique
```

> ✅ מפתח אחד = תקין
> ❌ כמה מפתחות שונים = צריך לבדוק למה

---

## 10. סיכום מהיר — רשימת בדיקה

| #   | מה לבדוק         | פקודה / מיקום                        |
| --- | ---------------- | ------------------------------------ |
| 1   | Project Ref      | `supabase/config.toml`               |
| 2   | URL              | `.env` → `SUPABASE_URL`              |
| 3   | Anon Key         | `.env` → `SUPABASE_PUBLISHABLE_KEY`  |
| 4   | Service Role Key | Dashboard → Settings → API           |
| 5   | אדמין            | `scripts/` → חפש `ADMIN_EMAIL`       |
| 6   | Buckets          | Dashboard → Storage                  |
| 7   | Edge Functions   | `supabase/functions/`                |
| 8   | טבלאות           | `src/integrations/supabase/types.ts` |
| 9   | Env Vars         | `.env` + `vite.config.ts`            |
| 10  | בלבול?           | חפש refs ייחודיים (צריך להיות 1)     |

---

## 💡 טיפים

- **Anon Key בטוח לחשיפה** — הוא מפתח ציבורי שמוגבל ע"י RLS
- **Service Role Key סודי** — לעולם לא לשים אותו בקוד פרונטנד או ב-VITE\_ variable
- **Edge Functions** מקבלות אוטומטית את `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` מ-Supabase — לא צריך להגדיר ידנית
- ניתן לפענח JWT token ב-https://jwt.io כדי לראות את ה-ref, role, exp
- ב-Dashboard → Settings → General רואים את שם הפרויקט, האזור, והתוכנית (Free/Pro)
