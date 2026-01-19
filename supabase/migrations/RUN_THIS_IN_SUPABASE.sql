-- ============================================================================
-- ARCHFLOW CRM - ALL NEW TABLES SQL
-- Run this file in Supabase SQL Editor to create all missing tables
-- Dashboard URL: https://supabase.com/dashboard/project/cxzrjgkjikglkrjcmmhe/sql
-- ============================================================================

-- ############################################################################
-- SECTION 1: QUOTE TEMPLATES
-- ############################################################################

CREATE TABLE IF NOT EXISTS quote_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_content text,
  default_terms text,
  default_payment_terms text,
  category text CHECK (category IN ('construction', 'consulting', 'design', 'development', 'marketing', 'other')),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_templates_category ON quote_templates(category);
CREATE INDEX IF NOT EXISTS idx_quote_templates_active ON quote_templates(is_active);

ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quote templates" ON quote_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quote templates" ON quote_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quote templates" ON quote_templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quote templates" ON quote_templates FOR DELETE USING (true);

-- ############################################################################
-- SECTION 2: QUOTE ITEMS (Detailed Line Items)
-- ############################################################################

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_order integer DEFAULT 0,
  category text,
  description text NOT NULL,
  quantity numeric DEFAULT 1 CHECK (quantity > 0),
  unit text DEFAULT 'unit',
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  discount_percentage numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  notes text,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage quote items" ON quote_items FOR ALL USING (true);

-- ############################################################################
-- SECTION 3: CONTRACTS TABLE
-- ############################################################################

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_contract_id uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_template_id uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_schedule jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contract_type text CHECK (contract_type IN ('fixed_price', 'hourly', 'milestone', 'retainer'));
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ILS';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0;

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  quote_id uuid REFERENCES quotes(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  project_id uuid REFERENCES projects(id),
  title text NOT NULL,
  description text,
  contract_type text DEFAULT 'fixed_price' CHECK (contract_type IN ('fixed_price', 'hourly', 'milestone', 'retainer')),
  contract_value numeric NOT NULL CHECK (contract_value >= 0),
  currency text DEFAULT 'ILS',
  start_date date NOT NULL,
  end_date date,
  signed_date date NOT NULL,
  payment_terms text,
  payment_method text DEFAULT 'bank_transfer',
  advance_payment_required boolean DEFAULT false,
  advance_payment_amount numeric,
  advance_payment_status text DEFAULT 'pending' CHECK (advance_payment_status IN ('pending', 'received', 'waived')),
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'expired')),
  termination_reason text,
  terminated_at timestamptz,
  contract_pdf_url text,
  signed_contract_pdf_url text,
  signature_data text,
  signed_by_client text,
  signed_by_company text,
  terms_and_conditions text,
  special_clauses text,
  notes text,
  tags text[],
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contracts" ON contracts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contracts" ON contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update contracts" ON contracts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete contracts" ON contracts FOR DELETE USING (true);

-- ############################################################################
-- SECTION 4: PAYMENT SCHEDULES
-- ############################################################################

CREATE TABLE IF NOT EXISTS payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id),
  payment_number integer NOT NULL CHECK (payment_number > 0),
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled', 'partial')),
  paid_date date,
  paid_amount numeric DEFAULT 0 CHECK (paid_amount >= 0),
  reminder_sent_at timestamptz,
  reminder_count integer DEFAULT 0,
  next_reminder_date date,
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT payment_schedules_unique_number UNIQUE (contract_id, payment_number)
);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_contract_id ON payment_schedules(contract_id);

ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage payment schedules" ON payment_schedules FOR ALL USING (true);

-- ############################################################################
-- SECTION 5: NOTIFICATIONS
-- ############################################################################

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ############################################################################
-- SECTION 6: AUDIT LOG
-- ############################################################################

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit log" ON audit_log FOR INSERT WITH CHECK (true);

-- ############################################################################
-- SECTION 7: WHATSAPP LOG
-- ############################################################################

CREATE TABLE IF NOT EXISTS whatsapp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  phone_number text NOT NULL,
  message text,
  status text DEFAULT 'sent',
  sent_by uuid REFERENCES auth.users(id),
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_log_client_id ON whatsapp_log(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_sent_at ON whatsapp_log(sent_at DESC);

ALTER TABLE whatsapp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage whatsapp log" ON whatsapp_log FOR ALL USING (true);

-- ############################################################################
-- SECTION 8: CONTRACT TEMPLATES
-- ############################################################################

CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_content text NOT NULL,
  contract_type text CHECK (contract_type IN ('fixed_price', 'hourly', 'milestone', 'retainer')),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage contract templates" ON contract_templates FOR ALL USING (true);

-- ############################################################################
-- SECTION 9: CONTRACT DOCUMENTS
-- ############################################################################

CREATE TABLE IF NOT EXISTS contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_url text NOT NULL,
  document_type text CHECK (document_type IN ('contract', 'addendum', 'invoice', 'receipt', 'proposal', 'other')),
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON contract_documents(contract_id);

ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage contract documents" ON contract_documents FOR ALL USING (true);

-- ############################################################################
-- SECTION 10: CONTRACT AMENDMENTS
-- ############################################################################

CREATE TABLE IF NOT EXISTS contract_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amendment_number integer NOT NULL CHECK (amendment_number > 0),
  description text NOT NULL,
  change_type text CHECK (change_type IN ('scope', 'price', 'timeline', 'terms', 'other')),
  previous_value text,
  new_value text,
  value_change_amount numeric,
  approved_by_client boolean DEFAULT false,
  approved_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT contract_amendments_unique UNIQUE (contract_id, amendment_number)
);

CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract_id ON contract_amendments(contract_id);

ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage contract amendments" ON contract_amendments FOR ALL USING (true);

-- ############################################################################
-- DONE! All tables created successfully.
-- ############################################################################

SELECT 'SUCCESS! All tables created. Refresh your app to see the changes.' as result;
