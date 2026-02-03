# 📧 מערכת אימייל מתקדמת - Quick Reference

> **גרסה 2.0** | מערכת שליחת אימיילים מתקדמת עם templates, tracking, rate limiting, ו-analytics

---

## 🚀 Quick Links

| 📄 מסמך | 📝 תיאור |
|---------|----------|
| [EMAIL_SYSTEM_COMPLETE_SUMMARY.md](./EMAIL_SYSTEM_COMPLETE_SUMMARY.md) | 📊 **סיכום מלא** - מה הושלם, features matrix, testing checklist |
| [EMAIL_SYSTEM_V2_README.md](./EMAIL_SYSTEM_V2_README.md) | 📚 **תיעוד טכני** - טבלאות, functions, components, best practices |
| [EMAIL_DEPLOYMENT_GUIDE.md](./EMAIL_DEPLOYMENT_GUIDE.md) | 🚀 **מדריך התקנה** - שלבי deployment, troubleshooting, monitoring |

---

## ⚡ 30-Second Overview

```bash
# 1. Deploy Backend
supabase db push
supabase functions deploy --all

# 2. Configure
# Add RESEND_API_KEY, RESEND_WEBHOOK_SECRET to Supabase Dashboard

# 3. Setup Cron
# Run SQL from EMAIL_DEPLOYMENT_GUIDE.md

# 4. Update Types
supabase gen types typescript --project-id [id] > src/integrations/supabase/types.ts

# 5. Test
npm run dev
# Navigate to: Settings → Email Templates
```

---

## 🎯 מה זה עושה?

### ✅ Core Features

#### 📝 Email Templates
- ניהול templates עם משתנים דינמיים
- קטגוריות (כללי, תזכורת, שיווק, הודעות)
- Preview Desktop/Mobile
- Test send

#### ⚡ Queue & Retry
- Automatic queue processing כל 5 דקות
- Retry logic עם exponential backoff (1min → 5min → 15min)
- עד 3 retries
- Priority queue

#### 🛡️ Rate Limiting
- מגבלות שעתיות ויומיות
- Admin: 500/hr, 5000/day
- Manager: 200/hr, 2000/day  
- Employee: 100/hr, 1000/day
- Auto-reset + alerts

#### 📊 Tracking & Analytics
- Tracking pixels לפתיחות
- Click tracking עם redirect
- Dashboard analytics
- Webhooks לעדכוני סטטוס

#### ✍️ Email Signatures
- חתימות אישיות
- חתימת חברה
- HTML + Text
- Auto-inject

---

## 📦 What's Included?

### Backend (Supabase)
```
📁 supabase/
├── 📁 migrations/
│   ├── 20260117000000_advanced_email_system.sql        # Core tables
│   ├── 20260117000001_add_email_template_to_reminders.sql
│   ├── 20260117000002_rate_limiting.sql
│   └── 20260117000003_advanced_features.sql
│
└── 📁 functions/
    ├── send-reminder-email/        # Main sender
    ├── track-email-open/           # Tracking pixel
    ├── track-email-click/          # Click tracking
    ├── resend-webhook/             # Status updates
    ├── check-reminders/            # Reminder checker
    └── process-email-queue/        # Queue processor
```

### Frontend (React)
```
📁 src/
├── 📁 components/
│   ├── settings/
│   │   ├── EmailTemplateManager.tsx     # Template CRUD
│   │   ├── RateLimitMonitor.tsx         # Rate limits display
│   │   └── EmailSignatureManager.tsx    # Signatures CRUD
│   └── email/
│       └── EmailPreviewModal.tsx        # Preview + Test
│
└── 📁 pages/
    └── EmailAnalytics.tsx               # Analytics dashboard
```

### Documentation
```
📄 EMAIL_SYSTEM_COMPLETE_SUMMARY.md    # סיכום מלא
📄 EMAIL_SYSTEM_V2_README.md           # תיעוד טכני
📄 EMAIL_DEPLOYMENT_GUIDE.md           # מדריך התקנה
📄 EMAIL_QUICK_START.md                # המסמך הזה
```

---

## 🎬 Getting Started

### Prerequisites
- ✅ Supabase Project
- ✅ Resend Account ([resend.com](https://resend.com))
- ✅ Supabase CLI installed
- ✅ Node.js 18+

### Step 1: Deploy Database

```bash
cd c:\Users\jj121\Desktop\n
supabase db push
```

זה יריץ 4 migrations שיוצרות:
- ✅ email_templates
- ✅ email_logs
- ✅ email_clicks
- ✅ email_queue
- ✅ email_rate_limits
- ✅ email_rate_limit_config
- ✅ email_signatures
- ✅ email_unsubscribes
- ✅ email_campaigns
- ✅ email_campaign_recipients

### Step 2: Deploy Edge Functions

```bash
supabase functions deploy --all
```

### Step 3: Configure Environment

Supabase Dashboard → Settings → Edge Functions → Add:

```env
RESEND_API_KEY=re_xxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 4: Setup Cron Jobs

Supabase SQL Editor:

```sql
-- Process email queue every 5 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$ 
    SELECT net.http_post(
      url:='https://[PROJECT-ID].supabase.co/functions/v1/process-email-queue',
      headers:='{"Authorization": "Bearer [SERVICE-ROLE-KEY]"}'::jsonb
    );
  $$
);

-- Check reminders every minute  
SELECT cron.schedule(
  'check-reminders',
  '* * * * *',
  $$
    SELECT net.http_post(
      url:='https://[PROJECT-ID].supabase.co/functions/v1/check-reminders',
      headers:='{"Authorization": "Bearer [SERVICE-ROLE-KEY]"}'::jsonb
    );
  $$
);
```

### Step 5: Update TypeScript Types

```bash
supabase gen types typescript --project-id [PROJECT-ID] > src/integrations/supabase/types.ts
```

### Step 6: Test!

```bash
npm run dev
```

עבור ל:
1. **Settings → Email Templates** - צור template
2. **Preview** - בדוק תצוגה מקדימה
3. **Test Send** - שלח אימייל בדיקה
4. **Email Analytics** - בדוק סטטיסטיקות

---

## 🧪 Quick Tests

### Test 1: Create Template
```typescript
// UI: Settings → Email Templates → New Template
Name: "Welcome Email"
Subject: "Welcome {{userName}}!"
HTML: "<h1>שלום {{userName}}</h1><p>ברוך הבא למערכת</p>"
Variables: ["userName"]
```

### Test 2: Send Test Email
```typescript
// In EmailTemplateManager, click "Preview" → "Test" tab
Test Email: your-email@example.com
Variables: { userName: "יוסי" }
// Click "Send Test Email"
```

### Test 3: Check Rate Limits
```sql
SELECT check_email_rate_limit('[YOUR-USER-ID]', 'admin');
-- Should return: { hourly_limit: 500, daily_limit: 5000, ... }
```

### Test 4: Process Queue Manually
```bash
curl -X POST \
  https://[PROJECT-ID].supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer [SERVICE-ROLE-KEY]"
```

### Test 5: View Analytics
```typescript
// Navigate to: /email-analytics
// Should see: Stats cards, filters, email logs table
```

---

## 🔧 Common Tasks

### שינוי Rate Limits

```sql
UPDATE email_rate_limit_config
SET hourly_limit = 1000, daily_limit = 10000
WHERE role = 'admin';
```

### הוספת Template ברירת מחדל

```sql
INSERT INTO email_templates (name, subject, html_content, category, is_default)
VALUES (
  'Task Reminder',
  '📌 תזכורת: {{taskName}}',
  '<h2>{{taskName}}</h2><p>{{taskDescription}}</p>',
  'reminder',
  true
);
```

### הוספת חתימת חברה

```sql
INSERT INTO email_signatures (name, html_content, is_company_wide, is_default)
VALUES (
  'Company Signature',
  '<div><strong>צוות ArchFlow</strong><br>טלפון: 03-1234567</div>',
  true,
  true
);
```

### בדיקת Failed Emails

```sql
SELECT * FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### ניקוי Queue ישן

```sql
DELETE FROM email_queue
WHERE created_at < NOW() - INTERVAL '7 days'
  AND status IN ('sent', 'failed');
```

---

## 📊 Monitoring Queries

### Email Statistics (24h)

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(open_count), 2) as avg_opens,
  ROUND(AVG(click_count), 2) as avg_clicks
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Top Clicked URLs

```sql
SELECT 
  url,
  COUNT(*) as clicks,
  COUNT(DISTINCT user_id) as unique_users
FROM email_clicks
WHERE clicked_at > NOW() - INTERVAL '7 days'
GROUP BY url
ORDER BY clicks DESC
LIMIT 10;
```

### Rate Limit Usage

```sql
SELECT 
  p.full_name,
  rl.email_count,
  c.hourly_limit,
  ROUND((rl.email_count::decimal / c.hourly_limit) * 100, 1) as usage_percent
FROM email_rate_limits rl
JOIN profiles p ON rl.user_id = p.id
JOIN email_rate_limit_config c ON p.role::text = c.role
WHERE rl.period_type = 'hourly'
  AND rl.period_start > NOW() - INTERVAL '1 hour'
ORDER BY usage_percent DESC;
```

---

## 🐛 Troubleshooting

### בעיה: TypeScript Errors

```bash
# פתרון:
supabase gen types typescript --project-id [id] > src/integrations/supabase/types.ts
rm -rf node_modules/.vite
npm run dev
```

### בעיה: Edge Functions לא עובדות

```bash
# בדוק logs:
supabase functions logs send-reminder-email

# בדוק locally:
supabase functions serve
```

### בעיה: Cron Jobs לא רצים

```sql
-- בדוק status:
SELECT * FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
ORDER BY start_time DESC
LIMIT 5;

-- Trigger manually:
SELECT cron.schedule_trigger('process-email-queue');
```

### בעיה: Rate Limits לא עובדים

```sql
-- Reset user limits:
DELETE FROM email_rate_limits WHERE user_id = '[USER-ID]';

-- Check config:
SELECT * FROM email_rate_limit_config;
```

---

## 🎯 Next Steps

### Priority 1
- [ ] הוסף **Rich Text Editor** (Tiptap)
- [ ] בנה **Campaign Builder UI**
- [ ] צור **Unsubscribe Page**

### Priority 2
- [ ] הוסף **Attachments Support**
- [ ] שלב **A/B Testing**
- [ ] Advanced **Analytics Dashboard**

### Priority 3
- [ ] **Template Library** (20+ templates)
- [ ] **Drip Campaigns**
- [ ] **SMS/WhatsApp Integration**

---

## 📚 Learn More

| נושא | קובץ |
|------|------|
| סיכום מלא + Features Matrix | [EMAIL_SYSTEM_COMPLETE_SUMMARY.md](./EMAIL_SYSTEM_COMPLETE_SUMMARY.md) |
| טבלאות, Functions, Components | [EMAIL_SYSTEM_V2_README.md](./EMAIL_SYSTEM_V2_README.md) |
| התקנה, Troubleshooting, Monitoring | [EMAIL_DEPLOYMENT_GUIDE.md](./EMAIL_DEPLOYMENT_GUIDE.md) |
| Best Practices + Examples | EMAIL_SYSTEM_V2_README.md (Best Practices section) |

---

## 📞 Support

### Logs
```bash
supabase functions logs [function-name]
supabase db logs
```

### SQL Console
```sql
-- Cron jobs
SELECT * FROM cron.job;

-- Email stats
SELECT status, COUNT(*) FROM email_logs GROUP BY status;

-- Failed queue items
SELECT * FROM email_queue WHERE status = 'failed';
```

---

**🎉 מערכת מוכנה לשימוש!**

**גרסה:** 2.0.0  
**תאריך:** 17 ינואר 2026  
**מפתח:** GitHub Copilot 🤖

---

**Quick Commands:**

```bash
# Deploy all
supabase db push && supabase functions deploy --all

# Update types
supabase gen types typescript --project-id [id] > src/integrations/supabase/types.ts

# Test queue
curl -X POST https://[id].supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer [key]"

# View logs
supabase functions logs send-reminder-email --tail

# Check cron
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```
