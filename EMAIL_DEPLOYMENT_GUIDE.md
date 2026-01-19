# 📦 מדריך התקנה והפעלה - מערכת אימייל מתקדמת

## 🚀 שלבי התקנה

### שלב 1: הרצת Migrations

```bash
# ודא שאתה בתיקיית הפרויקט
cd c:\Users\jj121\Desktop\n

# הרץ את כל ה-migrations
supabase db push

# או באמצעות Supabase CLI:
supabase migration up
```

**Migrations שיורצו:**
1. ✅ `20260117000000_advanced_email_system.sql` - טבלאות ליבה
2. ✅ `20260117000001_add_email_template_to_reminders.sql` - תמיכת templates ב-reminders
3. ✅ `20260117000002_rate_limiting.sql` - Rate limiting tables + functions
4. ✅ `20260117000003_advanced_features.sql` - Signatures, Unsubscribe, Campaigns

### שלב 2: Deploy Edge Functions

```bash
# Deploy כל ה-Edge Functions
supabase functions deploy send-reminder-email
supabase functions deploy track-email-open
supabase functions deploy track-email-click
supabase functions deploy resend-webhook
supabase functions deploy check-reminders
supabase functions deploy process-email-queue

# או כולם ביחד:
supabase functions deploy --all
```

### שלב 3: הגדרת Environment Variables

עבור ל-Supabase Dashboard > Settings > Edge Functions והוסף:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**איך להשיג API Keys:**

#### Resend API Key
1. צור חשבון ב-[Resend.com](https://resend.com)
2. עבור ל-API Keys
3. Create API Key
4. העתק את ה-Key

#### Resend Webhook Secret
1. עבור ל-Webhooks ב-Resend Dashboard
2. Add Endpoint: `https://[project-id].supabase.co/functions/v1/resend-webhook`
3. בחר events:
   - ✅ email.sent
   - ✅ email.delivered
   - ✅ email.bounced
   - ✅ email.complained
4. Save והעתק את ה-Webhook Secret

### שלב 4: Regenerate Supabase Types

```bash
# זה יעדכן את ה-TypeScript types עבור הטבלאות החדשות
supabase gen types typescript --local > src/integrations/supabase/types.ts

# אם אתה ב-production:
supabase gen types typescript --project-id [project-id] > src/integrations/supabase/types.ts
```

### שלב 5: הגדרת Cron Job (pg_cron)

התחבר ל-Supabase SQL Editor והרץ:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule email queue processor (every 5 minutes)
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://[YOUR-PROJECT-ID].supabase.co/functions/v1/process-email-queue',
    headers:='{"Authorization": "Bearer [YOUR-SERVICE-ROLE-KEY]"}'::jsonb
  );
  $$
);

-- Schedule reminder checker (every minute)
SELECT cron.schedule(
  'check-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://[YOUR-PROJECT-ID].supabase.co/functions/v1/check-reminders',
    headers:='{"Authorization": "Bearer [YOUR-SERVICE-ROLE-KEY]"}'::jsonb
  );
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

**חלופה: Vercel Cron Jobs**

צור `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/email-queue",
    "schedule": "*/5 * * * *"
  }, {
    "path": "/api/cron/check-reminders",
    "schedule": "* * * * *"
  }]
}
```

### שלב 6: בדיקות

#### בדיקה 1: Test Email Template
1. עבור להגדרות → Email Templates
2. צור תבנית חדשה
3. לחץ "תצוגה מקדימה"
4. שלח אימייל בדיקה

#### בדיקה 2: Test Queue Processor
```bash
curl -X POST \
  https://[project-id].supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer [service-role-key]"
```

#### בדיקה 3: Test Rate Limits
```sql
-- Check your rate limits
SELECT check_email_rate_limit('[your-user-id]', 'admin');

-- Should return:
{
  "hourly_limit": 500,
  "hourly_remaining": 500,
  "daily_limit": 5000,
  "daily_remaining": 5000
}
```

#### בדיקה 4: Test Tracking Pixel
1. שלח אימייל עם template
2. פתח את האימייל
3. בדוק `email_logs` - `opened_at` צריך להתעדכן
4. לחץ על קישור באימייל
5. בדוק `email_clicks` - רשומה חדשה צריכה להיווצר

#### בדיקה 5: Test Webhook
```bash
# Send test webhook from Resend Dashboard
# OR manually:
curl -X POST \
  https://[project-id].supabase.co/functions/v1/resend-webhook \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_xxxxx" \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: v1,xxxx" \
  -d '{
    "type": "email.delivered",
    "data": {
      "email_id": "test-123",
      "to": "user@example.com"
    }
  }'
```

---

## ⚙️ הגדרות מתקדמות

### שינוי Rate Limits

```sql
-- הגדל מגבלות עבור Admins
UPDATE email_rate_limit_config
SET 
  hourly_limit = 1000,
  daily_limit = 10000
WHERE role = 'admin';

-- הגדר מגבלות מותאמות אישית
INSERT INTO email_rate_limit_config (role, hourly_limit, daily_limit)
VALUES ('vip', 2000, 20000);
```

### הגדרת Retry Policy

ערוך `process-email-queue/index.ts`:

```typescript
const RETRY_DELAYS = [60, 300, 900]; // 1min, 5min, 15min
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;
```

### הגדרת חתימת חברה Default

```sql
-- הוסף חתימת חברה ברירת מחדל
INSERT INTO email_signatures (
  name,
  html_content,
  text_content,
  is_company_wide,
  is_default
) VALUES (
  'חתימת חברה',
  '<div style="font-family: Arial;"><strong>צוות ArchFlow</strong><br>טלפון: 03-1234567<br>אימייל: info@archflow.com</div>',
  'צוות ArchFlow\nטלפון: 03-1234567\nאימייל: info@archflow.com',
  true,
  true
);
```

---

## 🔧 Troubleshooting

### בעיה: Types Errors בReact

**פתרון:**
```bash
# Regenerate types
supabase gen types typescript --project-id [project-id] > src/integrations/supabase/types.ts

# אם יש שגיאות, אפס את ה-cache:
rm -rf node_modules/.vite
npm run dev
```

### בעיה: Edge Functions לא עובדות

**בדיקות:**
```bash
# 1. Check function logs
supabase functions logs send-reminder-email

# 2. Test locally
supabase functions serve
curl -X POST http://localhost:54321/functions/v1/send-reminder-email \
  -H "Authorization: Bearer [anon-key]" \
  -d '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'

# 3. Check environment variables
supabase secrets list
```

### בעיה: Cron Jobs לא רצים

**בדיקות:**
```sql
-- Check if cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check job status
SELECT * FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
ORDER BY start_time DESC 
LIMIT 5;

-- Manually trigger job
SELECT cron.schedule_trigger('process-email-queue');
```

### בעיה: Rate Limits לא עובדים

**בדיקות:**
```sql
-- Check config
SELECT * FROM email_rate_limit_config;

-- Check user's current limits
SELECT * FROM email_rate_limits WHERE user_id = '[user-id]';

-- Manually test function
SELECT check_email_rate_limit('[user-id]', 'admin');

-- Reset limits
DELETE FROM email_rate_limits WHERE user_id = '[user-id]';
```

### בעיה: Tracking Pixels לא עובדים

**בדיקות:**
1. בדוק ש-Edge Function deployed:
   ```bash
   supabase functions list
   ```

2. בדוק logs:
   ```bash
   supabase functions logs track-email-open
   ```

3. בדוק ידנית:
   ```bash
   curl "https://[project-id].supabase.co/functions/v1/track-email-open?email_id=test-123&user_id=test-user"
   ```

4. בדוק שה-pixel מוזרק לאימייל:
   ```sql
   SELECT html_content FROM email_logs WHERE id = '[email-id]';
   -- צריך לראות: <img src="https://...track-email-open?email_id=...">
   ```

---

## 📊 Monitoring

### Dashboard Queries

```sql
-- Email sending statistics (last 24h)
SELECT 
  status,
  COUNT(*) as count,
  AVG(open_count) as avg_opens,
  AVG(click_count) as avg_clicks
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Top clicked URLs
SELECT 
  url,
  COUNT(*) as clicks,
  COUNT(DISTINCT user_id) as unique_users
FROM email_clicks
WHERE clicked_at > NOW() - INTERVAL '7 days'
GROUP BY url
ORDER BY clicks DESC
LIMIT 10;

-- Rate limit usage by user
SELECT 
  p.full_name,
  p.email,
  rl.email_count,
  c.hourly_limit,
  c.daily_limit
FROM email_rate_limits rl
JOIN profiles p ON rl.user_id = p.id
JOIN email_rate_limit_config c ON p.role::text = c.role
WHERE rl.period_start > NOW() - INTERVAL '1 hour'
ORDER BY rl.email_count DESC;

-- Failed emails (retry needed)
SELECT 
  id,
  to_email,
  subject,
  error_message,
  retry_count,
  scheduled_at
FROM email_queue
WHERE status = 'failed'
  AND retry_count < max_retries
ORDER BY scheduled_at;
```

### Alerts להגדיר

1. **High failure rate** - יותר מ-10% failures בשעה
2. **Rate limit warnings** - משתמש עבר 80% מהמגבלה
3. **Queue backlog** - יותר מ-100 אימיילים בQueue
4. **Webhook failures** - Webhook לא עובד 3 פעמים ברצף

---

## 🎯 Next Steps

- [ ] הוסף Rich Text Editor (Tiptap)
- [ ] בנה UI לCampaigns
- [ ] הוסף A/B Testing
- [ ] שלב SMS/WhatsApp
- [ ] Dashboard analytics מתקדם
- [ ] Template Library (20+ templates)

---

**עדכון אחרון:** 17 ינואר 2026  
**גרסה:** 2.0.0  
**Support:** GitHub Copilot 🤖
