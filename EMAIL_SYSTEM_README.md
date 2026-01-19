# מערכת אימייל מתקדמת - ArchFlow

## סקירה כללית

מערכת שליחת אימיילים מתקדמת עם תמיכה מלאה בתבניות HTML, מעקב אחרי פתיחות ולחיצות, וניתוח מעמיק.

## יכולות עיקריות

### ✅ הושלם

#### 1. שליחת אימיילים מתקדמת
- **Edge Function משודרגת**: `send-reminder-email`
- תמיכה בתבניות HTML דינמיות
- מנוע תבניות (Template Engine) לניהול משתנים: `{{variableName}}`
- תמיכה בתנאים: `{{#if condition}}...{{/if}}`
- קבצים מצורפים (attachments)
- רמות עדיפות (high/normal/low)
- תגיות (tags) לסיווג

#### 2. תבניות אימייל
- **טבלה חדשה**: `email_templates`
- 3 תבניות ברירת מחדל:
  - תזכורת בסיסית
  - תזכורת דחופה
  - הזמנה לפגישה
- ממשק ניהול תבניות (`EmailTemplateManager`)
- עורך HTML עם תצוגה מקדימה
- תמיכה במשתנים דינמיים
- קטגוריות: כללי, תזכורת, הודעה, שיווק

#### 3. מעקב ומדידה
- **טבלה**: `email_logs` - יומן כל האימיילים
- **טבלה**: `email_clicks` - מעקב אחרי לחיצות
- **Edge Functions**:
  - `track-email-open` - Tracking pixel 1x1
  - `track-email-click` - מעקב לחיצות עם redirect
  - `resend-webhook` - קבלת עדכונים מ-Resend
- סטטוסים: pending, sent, delivered, opened, clicked, bounced, failed

#### 4. ניתוח וסטטיסטיקות
- **דף חדש**: `/email-analytics`
- סטטיסטיקות בזמן אמת:
  - סה״כ אימיילים
  - שיעור הצלחה
  - שיעור פתיחה (Open Rate)
  - שיעור לחיצה (Click Rate)
- פילטרים לפי זמן וסטטוס
- יומן מפורט של כל אימייל
- התראות על בעיות (bounces, failures)

#### 5. אינטגרציה עם תזכורות
- תמיכה בתבניות בתזכורות
- שדה `email_template_id` בטבלת reminders
- משתנים מותאמים אישית לכל תזכורת
- בחירת תבנית ב-AddReminderDialog

### 🚧 בפיתוח

#### 6. מערכת תור (Email Queue)
- **טבלה**: `email_queue`
- תזמון אימיילים מתקדם
- Retry logic אוטומטי
- עדיפויות (priority queue)
- Rate limiting

## מבנה הטבלאות

### email_templates
```sql
- id: uuid (primary key)
- name: text
- description: text
- subject: text
- html_content: text
- text_content: text
- variables: jsonb (array)
- is_default: boolean
- category: text
- created_by: uuid (FK to auth.users)
- created_at, updated_at: timestamptz
```

### email_logs
```sql
- id: uuid (primary key)
- to_email, from_email, subject: text
- html_content: text
- resend_id: text (ID from Resend)
- status: text (pending/sent/delivered/opened/clicked/bounced/failed)
- sent_at, delivered_at, opened_at, first_clicked_at: timestamptz
- open_count, click_count: integer
- error_message: text
- reminder_id, template_id, user_id: uuid (FK)
- metadata: jsonb
```

### email_clicks
```sql
- id: uuid (primary key)
- email_log_id: uuid (FK to email_logs)
- url: text
- clicked_at: timestamptz
- ip_address, user_agent, location: text
```

### email_queue
```sql
- id: uuid (primary key)
- scheduled_at: timestamptz
- to_email, subject, html_content: text
- template_id: uuid (FK)
- status: text (pending/processing/sent/failed/cancelled)
- priority: integer
- max_retries, retry_count: integer
- reminder_id, user_id: uuid (FK)
- metadata: jsonb
```

## Edge Functions

### send-reminder-email
```typescript
POST /functions/v1/send-reminder-email
{
  to: string,
  title: string,
  message?: string,
  userName?: string,
  templateId?: string,  // NEW
  variables?: Record<string, any>,  // NEW
  reminderId?: string,
  userId?: string,
  actionUrl?: string,
  attachments?: Array<{
    filename: string,
    content: string,  // base64
    type?: string
  }>,
  priority?: 'high' | 'normal' | 'low',
  tags?: string[]
}
```

### track-email-open
```
GET /functions/v1/track-email-open?id={email_log_id}
```
מחזיר tracking pixel 1x1 ומעדכן את email_logs.

### track-email-click
```
GET /functions/v1/track-email-click?id={email_log_id}&url={target_url}
```
רושם לחיצה ועושה redirect ל-URL היעד.

### resend-webhook
```
POST /functions/v1/resend-webhook
```
מקבל webhooks מ-Resend על אירועים:
- email.sent
- email.delivered
- email.opened
- email.clicked
- email.bounced
- email.complained

## שימוש

### יצירת תבנית חדשה
1. עבור להגדרות > תבניות אימייל (Admin בלבד)
2. לחץ "תבנית חדשה"
3. מלא פרטים: שם, קטגוריה, נושא
4. הוסף משתנים (לדוגמה: userName, title, message)
5. כתוב HTML עם משתנים: `{{userName}}`
6. שמור

### שליחת אימייל עם תבנית
```typescript
// בקומפוננטת AddReminderDialog
const reminderData = {
  title: "פגישה חשובה",
  message: "אל תשכח להגיע",
  remind_at: "2026-01-20T10:00:00",
  reminder_types: ['email'],
  recipient_emails: ['user@example.com'],
  email_template_id: "template-uuid",  // בחירת תבנית
  email_variables: {  // משתנים מותאמים
    userName: "יוסי",
    meetingDate: "20/01/2026",
    meetingTime: "10:00"
  }
};
```

### צפייה בסטטיסטיקות
1. עבור ל-Email Analytics
2. בחר טווח זמן (24h/7d/30d/all)
3. סנן לפי סטטוס
4. צפה בכרטיסי סטטיסטיקות
5. בדוק יומן מפורט

## קונפיגורציה

### משתני סביבה נדרשים
```env
RESEND_API_KEY=re_xxx  # מפתח API של Resend
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### הגדרת Webhook ב-Resend
1. עבור ל-Resend Dashboard
2. Settings > Webhooks
3. הוסף URL: `https://[your-project].supabase.co/functions/v1/resend-webhook`
4. בחר אירועים: sent, delivered, opened, clicked, bounced
5. שמור

## קבצים חשובים

### Migrations
- `20260117000000_advanced_email_system.sql` - טבלאות ותבניות
- `20260117000001_add_email_template_to_reminders.sql` - חיבור לתזכורות

### Components
- `src/components/settings/EmailTemplateManager.tsx` - ניהול תבניות
- `src/components/reminders/AddReminderDialog.tsx` - בחירת תבנית

### Pages
- `src/pages/EmailAnalytics.tsx` - דשבורד אנליטיקה

### Edge Functions
- `supabase/functions/send-reminder-email/`
- `supabase/functions/track-email-open/`
- `supabase/functions/track-email-click/`
- `supabase/functions/resend-webhook/`
- `supabase/functions/check-reminders/` - עודכן לתמיכה בתבניות

## תכונות מתקדמות

### מנוע התבניות
התבניות תומכות ב:
- משתנים פשוטים: `{{variableName}}`
- תנאים: `{{#if condition}}content{{/if}}`
- ניתן להרחיב בעתיד ל-loops, filters ועוד

### Tracking
כל קישור באימייל יכול לעבור דרך:
```
/functions/v1/track-email-click?id={email_log_id}&url={encoded_url}
```

### קבצים מצורפים
```typescript
attachments: [
  {
    filename: "invoice.pdf",
    content: "base64_encoded_content",
    type: "application/pdf"
  }
]
```

## Performance

- Indexes על כל FK וסטטוסים
- Pagination בדשבורד (100 רשומות)
- Lazy loading של תבניות
- Efficient queries עם select specific columns

## Security

- RLS (Row Level Security) על כל הטבלאות
- Users יכולים לראות רק את האימיילים שלהם
- Templates נגישות לכולם, עריכה רק למי שיצר
- Admin only access לניהול תבניות
- Webhook signature verification (TODO)

## עבודה עתידית

1. ✅ WYSIWYG editor מלא (TinyMCE/Quill)
2. ✅ Import/Export תבניות
3. ✅ A/B Testing של תבניות
4. ✅ Email scheduling מתקדם
5. ✅ Auto-retry על failures
6. ✅ Rate limiting
7. ✅ Unsubscribe handling
8. ✅ GDPR compliance tools

## תמיכה טכנית

מערכת זו בנויה על:
- **Supabase**: Database + Edge Functions
- **Resend**: Email delivery service
- **React + TypeScript**: Frontend
- **Shadcn/ui**: UI Components

לשאלות: צור issue בריפו או פנה לתמיכה הטכנית.
