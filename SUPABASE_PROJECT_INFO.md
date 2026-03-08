# 🗄️ Supabase Project Info

## פרטי הפרויקט

| פרט                  | ערך                                                                       |
| -------------------- | ------------------------------------------------------------------------- |
| **Project Ref / ID** | `eadeymehidcndudeycnf`                                                    |
| **Project URL**      | `https://eadeymehidcndudeycnf.supabase.co`                                |
| **Dashboard**        | https://supabase.com/dashboard/project/eadeymehidcndudeycnf               |
| **SQL Editor**       | https://supabase.com/dashboard/project/eadeymehidcndudeycnf/sql           |
| **Storage**          | https://supabase.com/dashboard/project/eadeymehidcndudeycnf/storage       |
| **Edge Functions**   | https://supabase.com/dashboard/project/eadeymehidcndudeycnf/functions     |
| **Auth**             | https://supabase.com/dashboard/project/eadeymehidcndudeycnf/auth/users    |
| **Table Editor**     | https://supabase.com/dashboard/project/eadeymehidcndudeycnf/editor        |
| **Logs**             | https://supabase.com/dashboard/project/eadeymehidcndudeycnf/logs/explorer |

---

## 🔑 מפתחות (Keys)

### Anon / Public Key (בטוח לחשיפה)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM
```

**פרטי ה-JWT:**
| שדה | ערך |
|---|---|
| **iss** | supabase |
| **ref** | eadeymehidcndudeycnf |
| **role** | anon |
| **iat** (Issued At) | 1768838684 (19 בינואר 2026) |
| **exp** (Expires) | 2084414684 (2036) |

### Service Role Key (סודי! לא לחשוף!)

- לא שמור בקוד הפרויקט (נכון!)
- זמין רק ב-Supabase Dashboard → Settings → API
- משמש את ה-Edge Functions דרך `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`

---

## 👤 חשבון אדמין

| פרט        | ערך                 |
| ---------- | ------------------- |
| **אימייל** | `jj1212t@gmail.com` |
| **סיסמה**  | `543211`            |

---

## 🌐 Environment Variables

### קובץ `.env` (פרונטנד)

```env
VITE_SUPABASE_URL="https://eadeymehidcndudeycnf.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi...ogpM"
VITE_SUPABASE_PROJECT_ID="eadeymehidcndudeycnf"
```

### Fallbacks ב-`vite.config.ts`

הערכים מוזרקים גם כ-fallback ישירות ב-vite.config.ts (שורות 100-112), כך שגם אם אין .env, האפליקציה תעבוד.

### Edge Functions (צד שרת)

Edge Functions מקבלות אוטומטית מ-Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

---

## 📦 Storage Buckets

| Bucket           | שימוש                                |
| ---------------- | ------------------------------------ |
| **client-files** | קבצי לקוחות, העלאות, גיבויים, הודעות |

---

## ⚡ Edge Functions (19 פונקציות)

| פונקציה                  | תיאור                       |
| ------------------------ | --------------------------- |
| `ai-chat`                | אינטגרציית AI צ'אט          |
| `admin-reset-password`   | איפוס סיסמה לאדמין          |
| `auto-backup`            | גיבוי אוטומטי               |
| `check-reminders`        | בדיקת תזכורות               |
| `create-admin-user`      | יצירת משתמש אדמין           |
| `create-employee`        | יצירת עובד                  |
| `dev-scripts`            | כלי פיתוח                   |
| `execute-sql`            | הרצת SQL (migration runner) |
| `financial-alerts`       | התראות פיננסיות             |
| `google-refresh-token`   | רענון טוקן Google OAuth     |
| `green-invoice`          | אינטגרציית חשבונית ירוקה    |
| `import-backup`          | ייבוא גיבוי                 |
| `invite-client`          | הזמנת לקוח לפורטל           |
| `process-email-queue`    | עיבוד תור אימיילים          |
| `resend-webhook`         | Webhook של Resend           |
| `send-reminder-email`    | שליחת אימייל תזכורת         |
| `send-task-notification` | התראת משימה                 |
| `track-email-click`      | מעקב קליקים באימייל         |
| `track-email-open`       | מעקב פתיחת אימייל           |

---

## 🗃️ טבלאות מסד הנתונים

### Core CRM

- `clients` - לקוחות
- `client_categories` - קטגוריות לקוחות
- `client_sources` - מקורות לקוחות
- `client_contacts` - אנשי קשר
- `profiles` - פרופילי משתמשים

### קבצים ומסמכים

- `client_files` - קבצי לקוחות
- `files` - קבצים כלליים
- `file_folders` - תיקיות
- `file_categories` - קטגוריות קבצים
- `file_metadata` - מטאדאטה
- `file_versions` - גרסאות
- `file_shares` - שיתופים
- `file_public_links` - קישורים ציבוריים
- `documents` - מסמכים
- `contract_documents` - מסמכי חוזים

### שלבים ותהליכים

- `client_stages` - שלבי לקוח
- `client_stage_tasks` - משימות שלב
- `client_folders` - תיקיות לקוח
- `client_folder_stages` - שלבי תיקייה
- `client_folder_tasks` - משימות תיקייה
- `stage_templates` - תבניות שלבים
- `stage_template_stages` - שלבי תבנית
- `stage_template_tasks` - משימות תבנית
- `workflows` - תהליכים
- `workflow_logs` - לוג תהליכים

### כספים

- `payments` - תשלומים
- `invoices` - חשבוניות
- `invoice_payments` - תשלומי חשבונית
- `expenses` - הוצאות
- `budgets` - תקציבים
- `bank_transactions` - תנועות בנק
- `bank_categories` - קטגוריות בנק
- `payment_schedules` - לוחות תשלומים
- `client_additional_payments` - תשלומים נוספים
- `client_payment_stages` - שלבי תשלום
- `financial_alerts` - התראות כספיות

### הצעות מחיר וחוזים

- `quotes` - הצעות מחיר
- `quote_items` - פריטי הצעה
- `quote_payments` - תשלומי הצעה
- `quote_templates` - תבניות הצעות
- `quote_template_versions` - גרסאות תבנית
- `contracts` - חוזים
- `contract_templates` - תבניות חוזים
- `contract_amendments` - תיקוני חוזה
- `signatures` - חתימות

### אימייל

- `email_messages` - הודעות
- `email_templates` - תבניות
- `email_signatures` - חתימות
- `email_campaigns` - קמפיינים
- `email_campaign_recipients` - נמענים
- `email_queue` - תור שליחה
- `email_logs` - לוג
- `email_clicks` - קליקים
- `email_folders` - תיקיות
- `email_folder_items` - פריטי תיקייה
- `email_auto_rules` - כללים אוטומטיים
- `email_rate_limits` - הגבלת קצב
- `email_rate_limit_config` - הגדרות הגבלה
- `email_unsubscribes` - הסרו מרשימה
- `email_metadata` - מטאדאטה

### יומן, משימות, פגישות

- `calendar_events` - אירועים
- `tasks` - משימות
- `task_consultants` - יועצים למשימה
- `meetings` - פגישות
- `reminders` - תזכורות
- `time_entries` - רשומות זמן
- `time_logs` - לוג זמנים
- `weekly_goals` - יעדים שבועיים

### משתמשים והרשאות

- `profiles` - פרופילים
- `roles` - תפקידים
- `user_roles` - תפקידי משתמש
- `permissions` - הרשאות
- `employees` - עובדים
- `consultants` - יועצים
- `client_consultants` - יועצי לקוח
- `user_preferences` - העדפות
- `user_settings` - הגדרות

### טבלאות מותאמות אישית (לא ב-types.ts)

- `client_custom_field_definitions` — הגדרות שדות מותאמים ללקוח
- `field_quick_options` — אפשרויות מהירות לשדות (גוש, חלקה וכו')

> ⚠️ שתי טבלאות אלו נוצרו ידנית ועדיין לא נוספו ל-types.ts. הגישה אליהן בקוד היא דרך:
>
> ```ts
> supabase.from("client_custom_field_definitions" as any);
> supabase.from("field_quick_options" as any);
> ```

### Google אינטגרציות

- `google_accounts` - חשבונות Google
- `google_calendar_accounts` - חשבונות יומן
- `google_calendar_settings` - הגדרות יומן
- `google_calendar_synced_events` - אירועים מסונכרנים
- `google_contacts_sync` - סנכרון אנשי קשר
- `google_drive_files` - קבצי Drive

### לוגים ומערכת

- `activity_log` / `activity_logs` - לוג פעילות
- `audit_log` - לוג ביקורת
- `migration_logs` - לוג מיגרציות
- `notifications` - התראות
- `backups` - גיבויים
- `app_settings` - הגדרות מערכת
- `call_logs` - לוג שיחות
- `whatsapp_log` / `whatsapp_messages` - WhatsApp

### טבלאות מותאמות

- `custom_tables` - טבלאות מותאמות
- `custom_table_data` - נתוני טבלה מותאמת
- `custom_table_permissions` - הרשאות טבלה
- `custom_reports` - דוחות מותאמים
- `custom_spreadsheets` - גליונות
- `table_custom_columns` - עמודות מותאמות
- `client_custom_tabs` - טאבים מותאמים
- `client_tab_columns` - עמודות טאב
- `client_tab_data` - נתוני טאב
- `client_tab_files` - קבצי טאב

### אחר

- `client_portal_tokens` - טוקנים לפורטל לקוח
- `client_messages` - הודעות ללקוח
- `client_deadlines` - דדליינים
- `deadline_templates` - תבניות דדליינים
- `project_updates` - עדכוני פרויקט
- `projects` - פרויקטים
- `data_types` - סוגי נתונים

---

## 🔧 Migration Runner

### הפקודה:

```powershell
node scripts/direct-run.mjs file "supabase/migrations/XXXX.sql"
```

### איך זה עובד:

1. מתחבר עם anon key ל-Supabase
2. מתאמת כ-`jj1212t@gmail.com`
3. קורא את קובץ ה-SQL
4. שולח ל-Edge Function `execute-sql`
5. מריץ את ה-SQL במסד הנתונים

---

## 🔗 Supabase CLI

### קישור לפרויקט:

```bash
supabase link --project-ref eadeymehidcndudeycnf
```

### פקודות שימושיות:

```bash
supabase login              # התחברות
supabase db push            # דחיפת מיגרציות
supabase functions deploy   # דיפלוי פונקציות
supabase db remote commit   # משיכת שינויים מרחוק
```

---

## ✅ בדיקת תקינות (נבדק 12/02/2026)

- ✅ פרויקט Supabase **אחד בלבד** — אין בלבול
- ✅ כל 18+ הקבצים מצביעים לאותו URL
- ✅ Anon Key אחד ויחיד בכל הפרויקט
- ✅ Project Ref אחיד בכל מקום
- ✅ Edge Functions קוראות מ-env (לא hardcoded)
- ✅ Service Role Key **לא** חשוף בקוד

---

## 🔍 איך למצוא את כל המידע הזה בפרויקט אחר

מדריך שלב-אחרי-שלב לשחזור המידע הזה בכל פרויקט Supabase:

### 1. מציאת Project Ref / URL

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

### 2. מציאת Anon Key (מפתח ציבורי)

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

### 3. מציאת Service Role Key

> ⚠️ ה-Service Role Key **לא אמור** להיות בקוד! אם הוא שם — זו בעיית אבטחה.

**איפה לחפש:**

```powershell
Select-String -Path "**/*" -Pattern "service.role|SERVICE_ROLE" -Recurse
```

**ידנית ב-Dashboard:**

- Settings → API → Project API keys → `service_role` (מוסתר, לחצו "Reveal")

---

### 4. מציאת חשבון אדמין

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

### 5. מציאת Storage Buckets

**איפה לחפש:**

```powershell
# מחפש שמות buckets בקוד
Select-String -Path "src/**/*" -Pattern "\.from\(['"](.*?)['""]\)" -Recurse
# או חיפוש ספציפי
Select-String -Path "src/**/*" -Pattern "storage.*from\(|\.from\('.*-files" -Recurse
```

**ידנית ב-Dashboard:**

- Storage → רואים את כל ה-buckets

---

### 6. מציאת Edge Functions

**איפה לחפש:**

```powershell
# כל התיקיות תחת supabase/functions/ הן edge functions
Get-ChildItem -Path "supabase/functions" -Directory | Select-Object Name
```

**ידנית ב-Dashboard:**

- Edge Functions → רשימת כל הפונקציות

---

### 7. מציאת כל הטבלאות

**איפה לחפש:**

**אם יש קובץ types מיוצר:**

```powershell
# חילוץ שמות טבלאות מ-types.ts (Supabase auto-generated)
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

### 8. מציאת Environment Variables

**איפה לחפש:**

```powershell
# מוצא את כל קבצי .env
Get-ChildItem -Path "." -Filter ".env*" -Force

# מחפש שימוש ב-env vars
Select-String -Path "src/**/*" -Pattern "import\.meta\.env\.\w+" -Recurse
Select-String -Path "**/*" -Pattern "process\.env\.\w+" -Recurse
Select-String -Path "supabase/functions/**/*" -Pattern "Deno\.env\.get" -Recurse
```

---

### 9. בדיקה שאין בלבול בין פרויקטים

**הפקודה החשובה:**

```powershell
# מוצא את כל ה-URLs הייחודיים של Supabase
Select-String -Path "**/*" -Pattern "https://\w+\.supabase\.co" -Recurse |
  ForEach-Object {
    [regex]::Match($_.Line, 'https://(\w+)\.supabase\.co').Groups[1].Value
  } | Sort-Object -Unique
```

> אם יוצא יותר מ-ref אחד — יש בלבול!

**בדיקת מפתחות:**

```powershell
# מוצא את כל ה-JWT tokens הייחודיים
Select-String -Path "**/*" -Pattern "eyJhbGciOi" -Recurse |
  ForEach-Object {
    [regex]::Match($_.Line, 'eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+').Value
  } | Sort-Object -Unique
```

> אם יוצא יותר ממפתח אחד — צריך לבדוק למה!

---

### 10. סיכום מהיר — רשימת בדיקה

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
