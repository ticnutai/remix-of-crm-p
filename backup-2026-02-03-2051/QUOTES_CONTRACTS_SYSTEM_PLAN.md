# 📋 תוכנית מפורטת - מערכת הצעות מחיר וחוזים מתקדמת

## 🎯 סקירה כללית

### מצב קיים (Existing)
✅ **Quotes Table** - הצעות מחיר בסיסיות
✅ **Quote Payments Table** - תשלומים על הצעות מחיר
✅ **Invoices Table** - חשבוניות
✅ **Invoice Payments Table** - תשלומים על חשבוניות
✅ **Clients Table** - לקוחות
✅ **Reminders System** - תזכורות מתקדמות

### מה נוסיף (New Features)
🆕 **Contracts Table** - טבלת חוזים חתומים
🆕 **Payment Schedules** - לוח תשלומים מתוכנן
🆕 **Payment Reminders** - תזכורות אוטומטיות לתשלומים
🆕 **Quote-Contract-Invoice Workflow** - זרימה אוטומטית
🆕 **Advanced Quote Management** - ניהול מתקדם של הצעות מחיר
🆕 **Contract Templates** - תבניות חוזים
🆕 **Payment Tracking Dashboard** - דשבורד מעקב תשלומים

---

## 📊 Phase 1: Database Schema (Migrations)

### Migration 1: Enhanced Quotes System
**File:** `20260117100000_enhanced_quotes_system.sql`

```sql
-- הוספת שדות חדשים לטבלת quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS 
  quote_template_id uuid REFERENCES quote_templates(id),
  payment_terms text, -- תנאי תשלום
  payment_schedule jsonb DEFAULT '[]'::jsonb, -- לוח תשלומים
  estimated_hours numeric,
  hourly_rate numeric,
  discount_amount numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  advance_payment_required boolean DEFAULT false,
  advance_payment_percentage numeric DEFAULT 0,
  advance_payment_amount numeric,
  contract_type text, -- 'fixed_price', 'hourly', 'milestone'
  currency text DEFAULT 'ILS',
  language text DEFAULT 'he';

-- טבלת תבניות הצעות מחיר
CREATE TABLE quote_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_content text, -- HTML template
  default_terms text,
  default_payment_terms text,
  category text, -- 'construction', 'consulting', 'design', etc.
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- טבלת פריטי הצעת מחיר מפורטים
CREATE TABLE quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  item_order integer DEFAULT 0,
  category text, -- קטגוריה
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'unit', -- 'unit', 'hour', 'sqm', 'day'
  unit_price numeric NOT NULL,
  discount_percentage numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  subtotal numeric GENERATED ALWAYS AS (
    (quantity * unit_price) - COALESCE(discount_amount, 0)
  ) STORED,
  notes text,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_category ON quote_items(category);
CREATE INDEX idx_quote_templates_category ON quote_templates(category);

-- RLS Policies
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Policies (Staff can manage, clients can view their own)
CREATE POLICY "Staff can manage quote templates" ON quote_templates
  FOR ALL USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee')
  );

CREATE POLICY "Staff can manage quote items" ON quote_items
  FOR ALL USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee')
  );

-- Function: Auto-calculate quote totals from items
CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quotes SET
    subtotal = (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM quote_items
      WHERE quote_id = NEW.quote_id
    )
  WHERE id = NEW.quote_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON quote_items
FOR EACH ROW EXECUTE FUNCTION calculate_quote_totals();
```

### Migration 2: Contracts System
**File:** `20260117100001_contracts_system.sql`

```sql
-- טבלת חוזים חתומים
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  quote_id uuid REFERENCES quotes(id), -- מקושר להצעת מחיר
  client_id uuid REFERENCES clients(id) NOT NULL,
  project_id uuid REFERENCES projects(id),
  
  -- Contract Details
  title text NOT NULL,
  description text,
  contract_type text DEFAULT 'fixed_price', -- 'fixed_price', 'hourly', 'milestone', 'retainer'
  contract_value numeric NOT NULL,
  currency text DEFAULT 'ILS',
  
  -- Dates
  start_date date NOT NULL,
  end_date date,
  signed_date date NOT NULL,
  
  -- Payment Terms
  payment_terms text,
  payment_method text DEFAULT 'bank_transfer',
  advance_payment_required boolean DEFAULT false,
  advance_payment_amount numeric,
  advance_payment_status text DEFAULT 'pending', -- 'pending', 'received', 'waived'
  
  -- Status
  status text DEFAULT 'active', -- 'draft', 'active', 'completed', 'terminated', 'expired'
  termination_reason text,
  terminated_at timestamptz,
  
  -- Documents
  contract_pdf_url text,
  signed_contract_pdf_url text,
  signature_data text, -- חתימה דיגיטלית
  signed_by_client text,
  signed_by_company text,
  
  -- Additional
  terms_and_conditions text,
  special_clauses text,
  notes text,
  tags text[],
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT contracts_status_check CHECK (
    status IN ('draft', 'active', 'completed', 'terminated', 'expired')
  ),
  CONSTRAINT contracts_type_check CHECK (
    contract_type IN ('fixed_price', 'hourly', 'milestone', 'retainer')
  )
);

-- טבלת לוח תשלומים מתוכנן
CREATE TABLE payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id), -- מקושר לחשבונית שנוצרה
  
  -- Schedule Details
  payment_number integer NOT NULL, -- מספר התשלום בסדרה
  description text,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  
  -- Status
  status text DEFAULT 'pending', -- 'pending', 'sent', 'paid', 'overdue', 'cancelled'
  paid_date date,
  paid_amount numeric DEFAULT 0,
  
  -- Reminders
  reminder_sent_at timestamptz,
  reminder_count integer DEFAULT 0,
  next_reminder_date date,
  
  -- Payment Details
  payment_method text,
  payment_reference text,
  notes text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT payment_schedules_status_check CHECK (
    status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')
  ),
  CONSTRAINT payment_schedules_unique_number UNIQUE (contract_id, payment_number)
);

-- טבלת מסמכי חוזה נוספים
CREATE TABLE contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_url text NOT NULL,
  document_type text, -- 'contract', 'addendum', 'invoice', 'receipt', 'other'
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- טבלת שינויים בחוזה (amendments)
CREATE TABLE contract_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  amendment_number integer NOT NULL,
  description text NOT NULL,
  change_type text, -- 'scope', 'price', 'timeline', 'terms', 'other'
  previous_value text,
  new_value text,
  value_change_amount numeric, -- שינוי בסכום החוזה
  approved_by_client boolean DEFAULT false,
  approved_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT contract_amendments_unique UNIQUE (contract_id, amendment_number)
);

-- Create Indexes
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_quote_id ON contracts(quote_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_signed_date ON contracts(signed_date);
CREATE INDEX idx_payment_schedules_contract_id ON payment_schedules(contract_id);
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX idx_contract_documents_contract_id ON contract_documents(contract_id);
CREATE INDEX idx_contract_amendments_contract_id ON contract_amendments(contract_id);

-- RLS Policies
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;

-- Contracts Policies
CREATE POLICY "Staff can view all contracts" ON contracts
  FOR SELECT USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee')
  );

CREATE POLICY "Staff can manage contracts" ON contracts
  FOR ALL USING (
    is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Clients can view their contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contracts.client_id
        AND clients.user_id = auth.uid()
    )
  );

-- Payment Schedules Policies (similar structure)
CREATE POLICY "Staff can manage payment schedules" ON payment_schedules
  FOR ALL USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee')
  );

CREATE POLICY "Staff can manage contract documents" ON contract_documents
  FOR ALL USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee')
  );

CREATE POLICY "Staff can manage contract amendments" ON contract_amendments
  FOR ALL USING (
    is_admin_or_manager(auth.uid())
  );

-- Functions

-- Auto-generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  year_part text;
  seq_part text;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT LPAD((COUNT(*) + 1)::text, 4, '0')
  INTO seq_part
  FROM contracts
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  RETURN 'CNT-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate contract number
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := generate_contract_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contract_number_trigger
BEFORE INSERT ON contracts
FOR EACH ROW EXECUTE FUNCTION set_contract_number();

-- Function: Create payment schedule from contract
CREATE OR REPLACE FUNCTION create_payment_schedule(
  p_contract_id uuid,
  p_num_payments integer,
  p_first_payment_date date
) RETURNS void AS $$
DECLARE
  v_contract contracts;
  v_payment_amount numeric;
  v_current_date date;
  v_i integer;
BEGIN
  -- Get contract details
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- Calculate payment amount
  v_payment_amount := v_contract.contract_value / p_num_payments;
  v_current_date := p_first_payment_date;
  
  -- Create schedule
  FOR v_i IN 1..p_num_payments LOOP
    INSERT INTO payment_schedules (
      contract_id,
      payment_number,
      description,
      amount,
      due_date,
      status
    ) VALUES (
      p_contract_id,
      v_i,
      'תשלום ' || v_i || ' מתוך ' || p_num_payments,
      v_payment_amount,
      v_current_date,
      'pending'
    );
    
    -- Next payment 30 days later
    v_current_date := v_current_date + INTERVAL '30 days';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Check overdue payments and update status
CREATE OR REPLACE FUNCTION check_overdue_payments()
RETURNS void AS $$
BEGIN
  UPDATE payment_schedules
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark contract as completed when all payments done
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_payments numeric;
  v_paid_payments numeric;
BEGIN
  -- Count payments
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'paid')
  INTO v_total_payments, v_paid_payments
  FROM payment_schedules
  WHERE contract_id = NEW.contract_id;
  
  -- If all paid, mark contract as completed
  IF v_total_payments = v_paid_payments AND v_total_payments > 0 THEN
    UPDATE contracts
    SET status = 'completed'
    WHERE id = NEW.contract_id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_status_trigger
AFTER UPDATE ON payment_schedules
FOR EACH ROW
WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
EXECUTE FUNCTION update_contract_status();
```

### Migration 3: Quote-Contract-Invoice Integration
**File:** `20260117100002_quote_contract_invoice_integration.sql`

```sql
-- הוספת קישורים בין הטבלאות
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS 
  converted_to_contract_id uuid REFERENCES contracts(id);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  contract_id uuid REFERENCES contracts(id),
  payment_schedule_id uuid REFERENCES payment_schedules(id);

-- Function: Convert Quote to Contract
CREATE OR REPLACE FUNCTION convert_quote_to_contract(
  p_quote_id uuid,
  p_start_date date,
  p_end_date date DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_quote quotes;
  v_contract_id uuid;
BEGIN
  -- Get quote
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  IF v_quote.status != 'accepted' THEN
    RAISE EXCEPTION 'Quote must be accepted first';
  END IF;
  
  -- Create contract
  INSERT INTO contracts (
    quote_id,
    client_id,
    project_id,
    title,
    description,
    contract_value,
    start_date,
    end_date,
    signed_date,
    payment_terms,
    terms_and_conditions,
    created_by
  ) VALUES (
    p_quote_id,
    v_quote.client_id,
    v_quote.project_id,
    v_quote.title,
    v_quote.description,
    v_quote.total_amount,
    p_start_date,
    p_end_date,
    COALESCE(v_quote.signed_date, CURRENT_DATE),
    v_quote.payment_terms,
    v_quote.terms_and_conditions,
    v_quote.created_by
  ) RETURNING id INTO v_contract_id;
  
  -- Update quote
  UPDATE quotes
  SET 
    converted_to_contract_id = v_contract_id,
    status = 'converted'
  WHERE id = p_quote_id;
  
  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Create invoice from payment schedule
CREATE OR REPLACE FUNCTION create_invoice_from_schedule(
  p_payment_schedule_id uuid
) RETURNS uuid AS $$
DECLARE
  v_schedule payment_schedules;
  v_contract contracts;
  v_invoice_id uuid;
  v_invoice_number text;
BEGIN
  -- Get schedule and contract
  SELECT ps.*, c.*
  INTO v_schedule, v_contract
  FROM payment_schedules ps
  JOIN contracts c ON ps.contract_id = c.id
  WHERE ps.id = p_payment_schedule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment schedule not found';
  END IF;
  
  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                      LPAD((SELECT COUNT(*) + 1 FROM invoices)::text, 5, '0');
  
  -- Create invoice
  INSERT INTO invoices (
    client_id,
    project_id,
    invoice_number,
    amount,
    description,
    issue_date,
    due_date,
    created_by,
    contract_id,
    payment_schedule_id
  ) VALUES (
    v_contract.client_id,
    v_contract.project_id,
    v_invoice_number,
    v_schedule.amount,
    v_schedule.description || ' - ' || v_contract.title,
    CURRENT_DATE,
    v_schedule.due_date,
    v_contract.created_by,
    v_contract.id,
    p_payment_schedule_id
  ) RETURNING id INTO v_invoice_id;
  
  -- Update schedule
  UPDATE payment_schedules
  SET 
    invoice_id = v_invoice_id,
    status = 'sent'
  WHERE id = p_payment_schedule_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 Phase 2: React Components

### Component 1: Enhanced Quote Form
**File:** `src/components/quotes/EnhancedQuoteForm.tsx`

**Features:**
- עורך פריטים מתקדם עם קטגוריות
- חישוב אוטומטי של סכומים
- תבניות הצעות מחיר
- לוח תשלומים מוצע
- תנאי תשלום מובנים
- תצוגה מקדימה של PDF

### Component 2: Contracts Management
**File:** `src/components/contracts/ContractsTable.tsx`

**Features:**
- רשימת חוזים עם פילטרים
- סטטוס חוזה (פעיל/הסתיים/בוטל)
- מעקב תשלומים
- מסמכים מצורפים
- אזהרות על תשלומים מתקרבים

### Component 3: Contract Details
**File:** `src/components/contracts/ContractDetails.tsx`

**Features:**
- פרטי חוזה מלאים
- לוח תשלומים אינטראקטיבי
- היסטוריית תשלומים
- מסמכים וחתימות
- שינויים בחוזה (amendments)

### Component 4: Payment Schedule Manager
**File:** `src/components/contracts/PaymentScheduleManager.tsx`

**Features:**
- יצירת לוח תשלומים
- עריכת תשלומים בודדים
- סימון תשלום כשולם
- יצירת חשבונית אוטומטית
- תזכורות אוטומטיות

### Component 5: Payment Tracking Dashboard
**File:** `src/components/contracts/PaymentTrackingDashboard.tsx`

**Features:**
- כרטיסי סטטיסטיקה (תשלומים ממתינים/שולמו/באיחור)
- גרף תזרים מזומנים צפוי
- התראות תשלומים מתקרבים
- רשימת תשלומים לשבוע הקרוב
- מעקב אחר חוזים פעילים

### Component 6: Contract Templates Manager
**File:** `src/components/contracts/ContractTemplatesManager.tsx`

**Features:**
- יצירת תבניות חוזה
- משתנים דינמיים
- שמירת תנאים סטנדרטיים
- קטגוריות (בנייה, ייעוץ, עיצוב, וכו')

---

## 🔔 Phase 3: Reminders Integration

### Edge Function: Contract Payment Reminders
**File:** `supabase/functions/check-contract-payments/index.ts`

**Logic:**
```typescript
// רץ יומי בבוקר
// בודק תשלומים שמגיעים בעוד:
// - 7 ימים (reminder_1)
// - 3 ימים (reminder_2)
// - יום לפני (reminder_3)
// - ביום (urgent)
// - באיחור (overdue)

// שולח:
// 1. אימייל ללקוח
// 2. אימייל למנהל הפרויקט
// 3. התראת דפדפן
// 4. עדכון בactivity_log
```

### Component: Payment Reminder Settings
**File:** `src/components/settings/PaymentReminderSettings.tsx`

**Settings:**
- מתי לשלוח תזכורות (7/3/1 ימים לפני)
- ערוצי תזכורת (אימייל/SMS/וואטסאפ/דפדפן)
- תבניות הודעות
- מי מקבל העתק (CC)

---

## 📱 Phase 4: Client Portal Integration

### Component: Client Contracts View
**File:** `src/components/client-portal/ClientContractsView.tsx`

**Features (Read-Only for Clients):**
- רשימת חוזים פעילים
- לוח תשלומים שלי
- מסמכי חוזה להורדה
- היסטוריית תשלומים
- תזכורות תשלומים
- בקשה להנפקת חשבונית

---

## 🔄 Phase 5: Workflow Automation

### Workflow 1: Quote → Contract → Invoices
```
1. הצעת מחיר נוצרת
2. הצעת מחיר נשלחת ללקוח
3. לקוח מאשר (status = 'accepted')
4. יוצר חוזה אוטומטית (convert_quote_to_contract)
5. מגדיר לוח תשלומים
6. כל תשלום יוצר חשבונית אוטומטית ביום היעד
7. תזכורות אוטומטיות לפני כל תשלום
8. כשהתשלום מתקבל - עדכון אוטומטי
9. כל התשלומים שולמו → חוזה מסומן כהושלם
```

### Workflow 2: Invoice Payment Sync
```
1. תשלום מתקבל בחשבונית
2. עדכון אוטומטי של payment_schedule
3. אם התשלום מלא - סימון 'paid'
4. אם חלקי - עדכון paid_amount
5. עדכון contract.paid_amount
6. בדיקה אם כל התשלומים הושלמו
7. אם כן - חוזה → 'completed'
```

---

## 📊 Phase 6: Reports & Analytics

### Report 1: Contracts Summary
- סה"כ חוזים פעילים
- ערך חוזים כולל
- תשלומים צפויים החודש
- תשלומים באיחור
- חוזים שעומדים להסתיים

### Report 2: Payment Forecast
- תזרים מזומנים חזוי ל-6 חודשים
- גרף תשלומים לפי חודש
- השוואה בין מתוכנן למצב בפועל

### Report 3: Client Payment History
- כל התשלומים של לקוח
- מדדי אמינות (Payment score)
- ממוצע זמן תשלום

---

## 🎯 Phase 7: Integration Points

### 1. Client Profile Integration
```tsx
// הוספת טאב "חוזים" בפרופיל לקוח
<Tabs>
  <Tab value="overview">סקירה כללית</Tab>
  <Tab value="quotes">הצעות מחיר</Tab>
  <Tab value="contracts">חוזים</Tab> {/* NEW */}
  <Tab value="invoices">חשבוניות</Tab>
  <Tab value="payments">תשלומים</Tab> {/* NEW */}
  <Tab value="files">קבצים</Tab>
</Tabs>
```

### 2. Finance Dashboard Integration
```tsx
// הוספת כרטיסים חדשים
<StatCard title="חוזים פעילים" value={activeContracts} />
<StatCard title="תשלומים צפויים החודש" value={expectedPayments} />
<StatCard title="תשלומים באיחור" value={overduePayments} variant="destructive" />
```

### 3. Reminders Integration
```typescript
// יצירת תזכורת אוטומטית לכל תשלום
CREATE TRIGGER create_payment_reminder
AFTER INSERT ON payment_schedules
FOR EACH ROW
EXECUTE FUNCTION create_payment_reminder_auto();
```

---

## 🧪 Phase 8: Testing Plan

### Unit Tests
- [ ] Contract creation
- [ ] Payment schedule generation
- [ ] Quote to contract conversion
- [ ] Payment schedule to invoice
- [ ] Overdue payment detection
- [ ] Contract completion detection

### Integration Tests
- [ ] Full workflow: Quote → Contract → Payments → Invoices
- [ ] Payment reminder sending
- [ ] Client portal access
- [ ] File uploads
- [ ] PDF generation

### Manual Tests
- [ ] Create quote with items
- [ ] Convert to contract
- [ ] Generate payment schedule
- [ ] Create invoice from schedule
- [ ] Mark payment as received
- [ ] Check reminders sent
- [ ] Verify contract status updates

---

## 📅 Timeline & Priorities

### Priority 1 (Week 1) - Core Functionality
- ✅ Migration 1: Enhanced Quotes
- ✅ Migration 2: Contracts System
- ✅ Migration 3: Integration
- ✅ Component: Enhanced Quote Form
- ✅ Component: Contracts Table
- ✅ Component: Contract Details

### Priority 2 (Week 2) - Payments & Reminders
- ✅ Component: Payment Schedule Manager
- ✅ Component: Payment Tracking Dashboard
- ✅ Edge Function: Payment Reminders
- ✅ Integration: Reminders System

### Priority 3 (Week 3) - Client Portal & Polish
- ✅ Client Portal: Contracts View
- ✅ Component: Contract Templates
- ✅ Reports & Analytics
- ✅ Testing & Bug Fixes

---

## 📝 Implementation Checklist

### Database
- [ ] Run Migration 1 - Enhanced Quotes
- [ ] Run Migration 2 - Contracts System
- [ ] Run Migration 3 - Integration
- [ ] Test all functions manually
- [ ] Seed sample data

### Backend
- [ ] Edge Function: check-contract-payments
- [ ] Edge Function: generate-contract-pdf
- [ ] Update existing Edge Functions for integration

### Frontend
- [ ] EnhancedQuoteForm component
- [ ] ContractsTable component
- [ ] ContractDetails component
- [ ] PaymentScheduleManager component
- [ ] PaymentTrackingDashboard component
- [ ] ContractTemplatesManager component
- [ ] Client Portal integration
- [ ] Routes & navigation

### Integration
- [ ] Add Contracts tab to Client Profile
- [ ] Add Payments tab to Client Profile
- [ ] Update Finance Dashboard
- [ ] Connect to Reminders system
- [ ] Update Email templates

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Client feedback

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Video tutorials

---

## 💡 Additional Features (Future)

### Phase 9 (Optional Enhancements)
- 📱 WhatsApp payment reminders
- 💳 Payment gateway integration (PayPal, Stripe, etc.)
- 📄 E-signature integration (DocuSign, HelloSign)
- 🤖 AI-powered payment predictions
- 📊 Advanced analytics dashboard
- 🔄 Recurring contracts automation
- 💼 Multi-currency support
- 🌍 Multi-language contracts
- 📧 Automatic late fee calculation
- 🔐 Contract approval workflow

---

## 🎯 Success Metrics

### KPIs to Track
- ⏱️ Time to convert quote → contract: < 5 minutes
- 📧 Payment reminder open rate: > 80%
- 💰 On-time payment rate: > 90%
- 📝 Contract creation time: < 10 minutes
- 👥 Client satisfaction score: > 4.5/5

---

**תוכנית זו מספקת:**
✅ מבנה מלא של Database
✅ כל הפונקציות הנדרשות
✅ רכיבי UI מפורטים
✅ אינטגרציה מלאה עם מערכות קיימות
✅ אוטומציה של תהליכים
✅ תזכורות אוטומטיות
✅ דשבורדים למעקב
✅ פורטל לקוחות

**האם להתחיל ביישום?** 🚀
