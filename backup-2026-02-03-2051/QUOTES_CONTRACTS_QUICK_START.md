# 🚀 Quick Start - מערכת הצעות מחיר וחוזים

## ⚡ התחלה מהירה (5 דקות)

### שלב 1: Deploy Database

```bash
# הרץ את ה-migrations
supabase db push

# או ידנית:
psql -h [host] -U [user] -d [database] -f supabase/migrations/20260117100000_enhanced_quotes_system.sql
psql -h [host] -U [user] -d [database] -f supabase/migrations/20260117100001_contracts_system.sql
psql -h [host] -U [user] -d [database] -f supabase/migrations/20260117100002_quote_contract_invoice_integration.sql
```

### שלב 2: Update TypeScript Types

```bash
supabase gen types typescript --project-id [PROJECT_ID] > src/integrations/supabase/types.ts
```

### שלב 3: Start Development

```bash
npm run dev
```

---

## 📋 תסריטי שימוש

### תסריט 1: יצירת הצעת מחיר פשוטה

```typescript
// 1. צור הצעת מחיר
const quote = await supabase
  .from('quotes')
  .insert({
    client_id: 'client-uuid',
    title: 'פרויקט בניית אתר',
    description: 'פיתוח אתר תדמית',
    payment_terms: '50% מראש, 50% בסיום',
    status: 'draft'
  })
  .select()
  .single();

// 2. הוסף פריטים
const items = await supabase
  .from('quote_items')
  .insert([
    {
      quote_id: quote.id,
      description: 'עיצוב UI/UX',
      quantity: 1,
      unit: 'project',
      unit_price: 5000
    },
    {
      quote_id: quote.id,
      description: 'פיתוח Frontend',
      quantity: 40,
      unit: 'hour',
      unit_price: 200
    },
    {
      quote_id: quote.id,
      description: 'פיתוח Backend',
      quantity: 30,
      unit: 'hour',
      unit_price: 250
    }
  ]);

// 3. הסכומים מתעדכנים אוטומטית!
// subtotal, vat_amount, total_amount מחושבים ב-Trigger
```

### תסריט 2: המרת הצעת מחיר לחוזה

```typescript
// 1. אשר הצעת מחיר
await supabase
  .from('quotes')
  .update({
    status: 'accepted',
    signed_date: new Date().toISOString()
  })
  .eq('id', quoteId);

// 2. המר לחוזה
const { data: contract } = await supabase
  .rpc('convert_quote_to_contract', {
    p_quote_id: quoteId,
    p_start_date: '2026-02-01',
    p_end_date: '2026-08-01'
  });

console.log('Contract created:', contract);
// Returns: contract_id (uuid)
```

### תסריט 3: יצירת לוח תשלומים

```typescript
// יצירת 3 תשלומים שווים
await supabase
  .rpc('create_payment_schedule', {
    p_contract_id: contractId,
    p_num_payments: 3,
    p_first_payment_date: '2026-02-15'
  });

// תוצאה:
// Payment 1: 15/02/2026 - ₪4,333
// Payment 2: 17/03/2026 - ₪4,333
// Payment 3: 16/04/2026 - ₪4,334
```

### תסריט 4: יצירת חשבונית מתשלום

```typescript
// יצירה אוטומטית
const { data: invoiceId } = await supabase
  .rpc('create_invoice_from_schedule', {
    p_payment_schedule_id: scheduleId
  });

// החשבונית נוצרת עם:
// - סכום מלוח התשלומים
// - תאריך יעד מלוח התשלומים
// - קישור לחוזה
// - קישור ללקוח
```

### תסריט 5: רישום תשלום

```typescript
// 1. רשום תשלום בחשבונית
await supabase
  .from('invoice_payments')
  .insert({
    invoice_id: invoiceId,
    amount: 4333,
    payment_date: new Date().toISOString(),
    payment_method: 'bank_transfer',
    notes: 'העברה בנקאית - אסמכתא 123456'
  });

// 2. עדכון אוטומטי:
// ✅ invoice.paid_amount += 4333
// ✅ invoice.status = 'paid'
// ✅ payment_schedule.status = 'paid'
// ✅ אם כל התשלומים שולמו → contract.status = 'completed'
```

---

## 🎨 דוגמאות UI Components

### דוגמה 1: רשימת חוזים

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ContractsList() {
  const { data: contracts } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(name, email),
          payment_schedules(
            id,
            amount,
            due_date,
            status
          )
        `)
        .eq('status', 'active')
        .order('signed_date', { ascending: false });
      
      return data;
    }
  });

  return (
    <div className="space-y-4">
      {contracts?.map(contract => (
        <ContractCard key={contract.id} contract={contract} />
      ))}
    </div>
  );
}
```

### דוגמה 2: לוח תשלומים

```tsx
export function PaymentScheduleTable({ contractId }: { contractId: string }) {
  const { data: schedules } = useQuery({
    queryKey: ['payment-schedules', contractId],
    queryFn: async () => {
      const { data } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('contract_id', contractId)
        .order('payment_number');
      
      return data;
    }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>מספר</TableHead>
          <TableHead>תיאור</TableHead>
          <TableHead>סכום</TableHead>
          <TableHead>תאריך יעד</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead>פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules?.map(schedule => (
          <TableRow key={schedule.id}>
            <TableCell>{schedule.payment_number}</TableCell>
            <TableCell>{schedule.description}</TableCell>
            <TableCell>₪{schedule.amount.toLocaleString()}</TableCell>
            <TableCell>{formatDate(schedule.due_date)}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(schedule.status)}>
                {getStatusLabel(schedule.status)}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger>...</DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => createInvoice(schedule.id)}>
                    צור חשבונית
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => markAsPaid(schedule.id)}>
                    סמן כשולם
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => sendReminder(schedule.id)}>
                    שלח תזכורת
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### דוגמה 3: דשבורד תשלומים

```tsx
export function PaymentsDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      // תשלומים ממתינים
      const { data: pending } = await supabase
        .from('payment_schedules')
        .select('amount')
        .eq('status', 'pending');
      
      // תשלומים באיחור
      const { data: overdue } = await supabase
        .from('payment_schedules')
        .select('amount')
        .eq('status', 'overdue');
      
      // תשלומים השבוע
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data: upcoming } = await supabase
        .from('payment_schedules')
        .select('amount')
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString())
        .lte('due_date', nextWeek.toISOString());
      
      return {
        pending: pending?.reduce((sum, p) => sum + p.amount, 0) || 0,
        overdue: overdue?.reduce((sum, p) => sum + p.amount, 0) || 0,
        upcoming: upcoming?.reduce((sum, p) => sum + p.amount, 0) || 0
      };
    }
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        title="תשלומים ממתינים"
        value={`₪${stats?.pending.toLocaleString()}`}
        icon={Clock}
        variant="default"
      />
      <StatCard
        title="תשלומים באיחור"
        value={`₪${stats?.overdue.toLocaleString()}`}
        icon={AlertCircle}
        variant="destructive"
      />
      <StatCard
        title="תשלומים השבוע"
        value={`₪${stats?.upcoming.toLocaleString()}`}
        icon={Calendar}
        variant="success"
      />
    </div>
  );
}
```

---

## 🔔 הגדרת תזכורות אוטומטיות

### Edge Function: check-contract-payments

```typescript
// supabase/functions/check-contract-payments/index.ts
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // בדוק תשלומים באיחור
  await supabase.rpc('check_overdue_payments');

  // מצא תשלומים שצריכים תזכורת
  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select(`
      *,
      contract:contracts(*, client:clients(*))
    `)
    .eq('status', 'pending')
    .gte('due_date', today.toISOString())
    .lte('due_date', in7Days.toISOString());

  // שלח תזכורות
  for (const schedule of schedules || []) {
    const daysUntilDue = Math.ceil(
      (new Date(schedule.due_date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    );

    let priority = 'low';
    if (daysUntilDue <= 1) priority = 'urgent';
    else if (daysUntilDue <= 3) priority = 'high';

    // שלח אימייל
    await supabase.functions.invoke('send-reminder-email', {
      body: {
        to: schedule.contract.client.email,
        templateId: 'payment-reminder',
        variables: {
          clientName: schedule.contract.client.name,
          amount: schedule.amount,
          dueDate: formatDate(schedule.due_date),
          contractTitle: schedule.contract.title,
          paymentNumber: schedule.payment_number,
          daysUntilDue: daysUntilDue
        },
        priority
      }
    });

    // עדכן מונה תזכורות
    await supabase
      .from('payment_schedules')
      .update({
        reminder_count: schedule.reminder_count + 1,
        reminder_sent_at: new Date().toISOString()
      })
      .eq('id', schedule.id);
  }

  return new Response(
    JSON.stringify({ processed: schedules?.length || 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Cron Setup

```sql
-- הרץ כל יום בשעה 08:00
SELECT cron.schedule(
  'check-contract-payments',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://[PROJECT_ID].supabase.co/functions/v1/check-contract-payments',
    headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  );
  $$
);
```

---

## 📊 Queries שימושיים

### Query 1: חוזים פעילים עם תשלומים הבאים

```sql
SELECT 
  c.contract_number,
  c.title,
  cl.name as client_name,
  c.contract_value,
  COUNT(ps.id) as total_payments,
  COUNT(ps.id) FILTER (WHERE ps.status = 'paid') as paid_payments,
  SUM(ps.amount) FILTER (WHERE ps.status = 'pending') as pending_amount,
  MIN(ps.due_date) FILTER (WHERE ps.status = 'pending') as next_payment_date
FROM contracts c
JOIN clients cl ON c.client_id = cl.id
LEFT JOIN payment_schedules ps ON c.id = ps.contract_id
WHERE c.status = 'active'
GROUP BY c.id, cl.name
ORDER BY next_payment_date ASC;
```

### Query 2: תשלומים באיחור

```sql
SELECT 
  ps.payment_number,
  ps.amount,
  ps.due_date,
  DATE_PART('day', NOW() - ps.due_date) as days_overdue,
  c.contract_number,
  c.title,
  cl.name as client_name,
  cl.email,
  cl.phone
FROM payment_schedules ps
JOIN contracts c ON ps.contract_id = c.id
JOIN clients cl ON c.client_id = cl.id
WHERE ps.status = 'overdue'
ORDER BY ps.due_date ASC;
```

### Query 3: תזרים מזומנים צפוי

```sql
SELECT 
  TO_CHAR(ps.due_date, 'YYYY-MM') as month,
  COUNT(*) as num_payments,
  SUM(ps.amount) as expected_income
FROM payment_schedules ps
WHERE ps.status IN ('pending', 'sent')
  AND ps.due_date >= CURRENT_DATE
  AND ps.due_date <= CURRENT_DATE + INTERVAL '6 months'
GROUP BY TO_CHAR(ps.due_date, 'YYYY-MM')
ORDER BY month;
```

---

## 🎯 Next Steps

### Phase 1 (השבוע)
- [ ] הרץ migrations
- [ ] צור דוגמאות נתונים
- [ ] בדוק functions ידנית
- [ ] בנה ContractsList component
- [ ] בנה PaymentScheduleManager

### Phase 2 (שבוע הבא)
- [ ] העלה Edge Function
- [ ] הגדר Cron Job
- [ ] בנה Payment Dashboard
- [ ] אינטגרציה עם Email System
- [ ] בדיקות End-to-End

### Phase 3 (שבועיים)
- [ ] Client Portal
- [ ] PDF Generation
- [ ] Reports & Analytics
- [ ] Mobile Optimization
- [ ] Documentation

---

## 🐛 Troubleshooting

### בעיה: Triggers לא עובדים
```sql
-- בדוק שה-triggers קיימים
SELECT * FROM pg_trigger WHERE tgname LIKE '%quote%' OR tgname LIKE '%contract%';

-- בדוק logs
SELECT * FROM pg_stat_statements WHERE query LIKE '%update_quote%';
```

### בעיה: חישובים לא נכונים
```sql
-- בדוק subtotal של quote
SELECT 
  q.id,
  q.subtotal as quote_subtotal,
  SUM(qi.subtotal) as calculated_subtotal
FROM quotes q
LEFT JOIN quote_items qi ON q.id = qi.quote_id
GROUP BY q.id
HAVING q.subtotal != COALESCE(SUM(qi.subtotal), 0);
```

### בעיה: תזכורות לא נשלחות
```bash
# בדוק logs של Edge Function
supabase functions logs check-contract-payments --tail

# בדוק Cron status
SELECT * FROM cron.job_run_details 
WHERE jobname = 'check-contract-payments'
ORDER BY start_time DESC 
LIMIT 5;
```

---

**מוכן להתחיל?** 🚀

```bash
git checkout -b feature/contracts-system
# התחל לקודד!
```
