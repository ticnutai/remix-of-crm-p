# 🚀 מערכת אימייל מתקדמת - גרסה 2.0

## 📋 סיכום שדרוגים חדשים

### ✅ נוסף לאחרונה

#### 1. **Email Queue Processor** 
מעבד תור אוטומטי עם Retry Logic מתקדם
- ✅ Exponential backoff (1min → 5min → 15min)
- ✅ Priority queue (דחוף/רגיל/נמוך)
- ✅ Batch processing (50 אימיילים בבת אחת)
- ✅ Error tracking מפורט
- ✅ Auto-retry עד 3 פעמים

**Edge Function:** `process-email-queue`

#### 2. **Rate Limiting System**
מערכת מגבלות מתקדמת למניעת spam
- ✅ מגבלות שעתיות ויומיות
- ✅ מותאם לפי תפקיד (Admin/Manager/Employee)
- ✅ מעקב real-time
- ✅ התראות אוטומטיות
- ✅ Dashboard למעקב

**טבלאות חדשות:** `email_rate_limits`, `email_rate_limit_config`
**פונקציות:** `check_email_rate_limit()`, `increment_email_rate_limit()`

#### 3. **Email Signatures**
חתימות אוטומטיות אישיות וחברה
- ✅ חתימות HTML מלאות
- ✅ חתימת ברירת מחדל
- ✅ חתימת חברה לכולם
- ✅ ממשק ניהול נוח

**טבלה:** `email_signatures`
**קומפוננטה:** `EmailSignatureManager`

#### 4. **Email Preview & Test**
תצוגה מקדימה ושליחת בדיקות
- ✅ Preview Desktop/Mobile
- ✅ שליחת אימייל בדיקה
- ✅ Variable substitution live
- ✅ תצוגת משתנים

**קומפוננטה:** `EmailPreviewModal`

#### 5. **Scheduled Emails**
תזמון מתקדם עם timezone
- ✅ תזמון לתאריך ושעה ספציפיים
- ✅ תמיכה ב-timezones
- ✅ Edit/Cancel scheduled emails
- ✅ Queue preview

**עדכוני טבלה:** הוספת `timezone`, `send_after`, `cancelled_at` ל-`email_queue`

#### 6. **Unsubscribe Management**
ניהול הסרה מרשימה + GDPR
- ✅ טבלת unsubscribe
- ✅ פונקציה לבדיקת unsubscribe
- ✅ Tracking של IP ו-User Agent
- ✅ סיבת ההסרה

**טבלה:** `email_unsubscribes`
**פונקציה:** `is_email_unsubscribed()`

#### 7. **Email Campaigns**
שליחה המונית מתוכננת (בסיס)
- ✅ טבלאות campaigns
- ✅ Campaign recipients
- ✅ Status tracking
- ✅ Template integration

**טבלאות:** `email_campaigns`, `email_campaign_recipients`

#### 8. **Rate Limit Monitor Component**
קומפוננטת מעקב visual
- ✅ Progress bars למגבלות
- ✅ התראות אוטומטיות
- ✅ רענון אוטומטי כל דקה
- ✅ הצעת שדרוג

**קומפוננטה:** `RateLimitMonitor`

---

## 📊 מגבלות ברירת מחדל

| תפקיד | שעתי | יומי |
|-------|------|------|
| Admin | 500 | 5,000 |
| Manager | 200 | 2,000 |
| Employee | 100 | 1,000 |

---

## 🔧 Edge Functions

### 1. `process-email-queue`
**מה זה עושה:** מעבד תור אימיילים עם retry logic

**כיצד להפעיל:**
```bash
# ידנית
curl -X POST https://[project].supabase.co/functions/v1/process-email-queue

# Cron (מומלץ - כל 5 דקות)
```

**תגובה:**
```json
{
  "success": true,
  "message": "Processed 15 emails",
  "results": {
    "processed": 15,
    "succeeded": 12,
    "failed": 1,
    "retried": 2
  }
}
```

---

## 🗄️ טבלאות חדשות

### `email_rate_limits`
```sql
- id: uuid
- user_id: uuid
- period_start: timestamptz
- period_end: timestamptz
- email_count: integer
- limit_type: text ('hourly', 'daily')
```

### `email_signatures`
```sql
- id: uuid
- user_id: uuid (nullable for company-wide)
- name: text
- html_content: text
- text_content: text
- is_default: boolean
- is_company_wide: boolean
```

### `email_unsubscribes`
```sql
- id: uuid
- email: text (unique)
- reason: text
- unsubscribed_at: timestamptz
- ip_address: text
- user_agent: text
```

### `email_campaigns`
```sql
- id: uuid
- name: text
- template_id: uuid
- status: text
- scheduled_at: timestamptz
- total_recipients: integer
- sent_count: integer
```

---

## 🎨 קומפוננטות חדשות

### `RateLimitMonitor`
```tsx
import { RateLimitMonitor } from '@/components/settings/RateLimitMonitor';

<RateLimitMonitor />
```

### `EmailSignatureManager`
```tsx
import { EmailSignatureManager } from '@/components/settings/EmailSignatureManager';

<EmailSignatureManager />
```

### `EmailPreviewModal`
```tsx
import { EmailPreviewModal } from '@/components/email/EmailPreviewModal';

<EmailPreviewModal
  open={showPreview}
  onOpenChange={setShowPreview}
  htmlContent="<p>Hello {{userName}}</p>"
  subject="Test Email"
  variables={{ userName: "יוסי" }}
  onSendTest={async (email) => {
    // שלח אימייל בדיקה
  }}
/>
```

---

## ⚙️ הגדרת Cron Jobs

### Supabase Edge Functions Cron
הוסף ל-`supabase/functions/process-email-queue/cron.json`:

```json
{
  "name": "process-email-queue",
  "schedule": "*/5 * * * *",
  "description": "Process email queue every 5 minutes"
}
```

או השתמש ב-pg_cron:

```sql
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://[project].supabase.co/functions/v1/process-email-queue',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  );
  $$
);
```

---

## 🔐 Security

### Rate Limiting
- ✅ Per-user tracking
- ✅ Role-based limits
- ✅ Auto-reset every hour/day
- ✅ IP tracking (future)

### Unsubscribe
- ✅ GDPR compliant
- ✅ One-click unsubscribe
- ✅ Reason tracking
- ✅ Global unsubscribe check

### Webhook Verification
- ⚠️ TODO: Implement Svix signature verification
- ✅ Headers logging

---

## 📈 Performance

### Email Queue
- **Batch Size:** 50 emails per run
- **Frequency:** Every 5 minutes (recommended)
- **Max Retries:** 3 attempts
- **Retry Delays:** 1min, 5min, 15min

### Rate Limits
- **Check Cost:** ~1ms (indexed)
- **Increment Cost:** ~2ms (upsert)
- **Auto Cleanup:** 30 days retention

---

## 🚀 Deployment Checklist

- [ ] Deploy migrations
  ```bash
  supabase db push
  ```

- [ ] Deploy Edge Functions
  ```bash
  supabase functions deploy process-email-queue
  ```

- [ ] Setup Cron Job
  ```bash
  # Via Supabase Dashboard or pg_cron
  ```

- [ ] Configure Rate Limits
  ```sql
  -- Update limits if needed
  UPDATE email_rate_limit_config 
  SET hourly_limit = 1000, daily_limit = 10000
  WHERE role = 'admin';
  ```

- [ ] Test Email Queue
  ```bash
  curl -X POST [url]/process-email-queue
  ```

- [ ] Monitor First 24h
  - Check email_logs for errors
  - Verify rate limits working
  - Test retry logic

---

## 🐛 Troubleshooting

### בעיה: אימיילים לא נשלחים
**פתרון:**
1. בדוק `email_queue` status
2. בדוק `email_logs` לשגיאות
3. הרץ `process-email-queue` ידנית
4. בדוק rate limits: `SELECT * FROM email_rate_limits WHERE user_id = '[user_id]'`

### בעיה: Rate limit errors
**פתרון:**
1. בדוק מגבלות נוכחיות: `SELECT check_email_rate_limit('[user_id]', 'admin')`
2. אפס מונה: `DELETE FROM email_rate_limits WHERE user_id = '[user_id]'`
3. הגדל מגבלות: עדכן `email_rate_limit_config`

### בעיה: Retries לא עובדים
**פתרון:**
1. בדוק `retry_count` ו-`max_retries` בtable
2. ודא ש-`scheduled_at` בעתיד
3. ודא ש-status = 'pending'
4. בדוק logs של process-email-queue

---

## 📝 Todo הבא

### Priority 1
- [ ] Rich Text Editor (Tiptap/TinyMCE)
- [ ] Email Attachments UI
- [ ] Campaign Builder UI
- [ ] Webhook Signature Verification

### Priority 2
- [ ] A/B Testing
- [ ] Template Library (20+ templates)
- [ ] Advanced Analytics (heatmaps)
- [ ] Drip Campaigns

### Priority 3
- [ ] Email Automation Rules
- [ ] Contact Segmentation
- [ ] SMS Integration
- [ ] WhatsApp Integration

---

## 🎓 Best Practices

### שליחת אימיילים
1. ✅ תמיד בדוק rate limits לפני שליחה
2. ✅ השתמש בqueue לשליחות מסיביות
3. ✅ בדוק unsubscribe לפני שליחה
4. ✅ הוסף signature אוטומטית
5. ✅ השתמש ב-templates

### ניהול תור
1. ✅ הרץ queue processor כל 5 דקות
2. ✅ נטר failed emails יומי
3. ✅ נקה queue ישן (>7 ימים)
4. ✅ הגדר alerts על retries גבוהים

### Templates
1. ✅ תמיד בדוק preview לפני שמירה
2. ✅ שלח test email
3. ✅ השתמש במשתנים במקום hardcode
4. ✅ גרסת טקסט לכל HTML

---

**עדכון אחרון:** 17 ינואר 2026
**גרסה:** 2.0.0
**תחזוקה:** GitHub Copilot 🤖
