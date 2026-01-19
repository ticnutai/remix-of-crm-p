-- Contracts System Migration (Fixed Version)
-- Created: 2026-01-18
-- Purpose: Full contract management with payment schedules

-- ============================================================================
-- PART 1: Add column to quotes first (before creating contracts table)
-- ============================================================================

-- Add converted_to_contract_id column to quotes table (if not exists)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_contract_id uuid;

-- ============================================================================
-- PART 2: Contracts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  quote_id uuid REFERENCES quotes(id), -- Link to originating quote
  client_id uuid NOT NULL REFERENCES clients(id),
  project_id uuid REFERENCES projects(id),
  
  -- Contract Details
  title text NOT NULL,
  description text,
  contract_type text DEFAULT 'fixed_price' CHECK (contract_type IN ('fixed_price', 'hourly', 'milestone', 'retainer')),
  contract_value numeric NOT NULL CHECK (contract_value >= 0),
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
  advance_payment_status text DEFAULT 'pending' CHECK (advance_payment_status IN ('pending', 'received', 'waived')),
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'expired')),
  termination_reason text,
  terminated_at timestamptz,
  
  -- Documents
  contract_pdf_url text,
  signed_contract_pdf_url text,
  signature_data text,
  signed_by_client text,
  signed_by_company text,
  
  -- Additional
  terms_and_conditions text,
  special_clauses text,
  notes text,
  tags text[],
  
  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_quote_id ON contracts(quote_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_signed_date ON contracts(signed_date);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);

-- Add foreign key from quotes to contracts (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_converted_to_contract'
  ) THEN
    ALTER TABLE quotes ADD CONSTRAINT fk_quotes_converted_to_contract 
      FOREIGN KEY (converted_to_contract_id) REFERENCES contracts(id);
  END IF;
END $$;

-- ============================================================================
-- PART 3: Payment Schedules Table
-- ============================================================================

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

-- Indexes for payment_schedules
CREATE INDEX IF NOT EXISTS idx_payment_schedules_contract_id ON payment_schedules(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_invoice_id ON payment_schedules(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status_due_date ON payment_schedules(status, due_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_next_reminder ON payment_schedules(next_reminder_date) WHERE next_reminder_date IS NOT NULL;

-- Add contract and payment_schedule references to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES contracts(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_schedule_id uuid REFERENCES payment_schedules(id);

CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_schedule_id ON invoices(payment_schedule_id);

-- ============================================================================
-- PART 4: Contract Documents Table
-- ============================================================================

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
CREATE INDEX IF NOT EXISTS idx_contract_documents_type ON contract_documents(document_type);

-- ============================================================================
-- PART 5: Contract Amendments Table
-- ============================================================================

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
CREATE INDEX IF NOT EXISTS idx_contract_amendments_type ON contract_amendments(change_type);

-- ============================================================================
-- PART 6: RLS Policies (with DROP IF EXISTS)
-- ============================================================================

-- Contracts Policies
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all contracts" ON contracts;
CREATE POLICY "Staff can view all contracts" ON contracts
  FOR SELECT USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

DROP POLICY IF EXISTS "Staff can insert contracts" ON contracts;
CREATE POLICY "Staff can insert contracts" ON contracts
  FOR INSERT WITH CHECK (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

DROP POLICY IF EXISTS "Staff can update contracts" ON contracts;
CREATE POLICY "Staff can update contracts" ON contracts
  FOR UPDATE USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

DROP POLICY IF EXISTS "Admins can delete contracts" ON contracts;
CREATE POLICY "Admins can delete contracts" ON contracts
  FOR DELETE USING (
    is_admin_or_manager(auth.uid())
  );

DROP POLICY IF EXISTS "Clients can view their contracts" ON contracts;
CREATE POLICY "Clients can view their contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contracts.client_id
        AND clients.user_id = auth.uid()
    )
  );

-- Payment Schedules Policies
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage payment schedules" ON payment_schedules;
CREATE POLICY "Staff can manage payment schedules" ON payment_schedules
  FOR ALL USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

DROP POLICY IF EXISTS "Clients can view their payment schedules" ON payment_schedules;
CREATE POLICY "Clients can view their payment schedules" ON payment_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = payment_schedules.contract_id
        AND cl.user_id = auth.uid()
    )
  );

-- Contract Documents Policies
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage contract documents" ON contract_documents;
CREATE POLICY "Staff can manage contract documents" ON contract_documents
  FOR ALL USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

DROP POLICY IF EXISTS "Clients can view their contract documents" ON contract_documents;
CREATE POLICY "Clients can view their contract documents" ON contract_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = contract_documents.contract_id
        AND cl.user_id = auth.uid()
    )
  );

-- Contract Amendments Policies
ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage contract amendments" ON contract_amendments;
CREATE POLICY "Staff can manage contract amendments" ON contract_amendments
  FOR ALL USING (
    is_admin_or_manager(auth.uid())
  );

DROP POLICY IF EXISTS "Clients can view their contract amendments" ON contract_amendments;
CREATE POLICY "Clients can view their contract amendments" ON contract_amendments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = contract_amendments.contract_id
        AND cl.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 7: Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_contracts_updated_at_trigger ON contracts;
CREATE TRIGGER update_contracts_updated_at_trigger
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_schedules_updated_at_trigger ON payment_schedules;
CREATE TRIGGER update_payment_schedules_updated_at_trigger
BEFORE UPDATE ON payment_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS log_contracts_activity ON contracts;
CREATE TRIGGER log_contracts_activity 
AFTER INSERT OR UPDATE OR DELETE ON contracts 
FOR EACH ROW EXECUTE FUNCTION log_table_activity();

DROP TRIGGER IF EXISTS log_payment_schedules_activity ON payment_schedules;
CREATE TRIGGER log_payment_schedules_activity 
AFTER INSERT OR UPDATE OR DELETE ON payment_schedules 
FOR EACH ROW EXECUTE FUNCTION log_table_activity();

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON TABLE contracts IS 'Signed contracts with clients';
COMMENT ON TABLE payment_schedules IS 'Scheduled payments for contracts';
COMMENT ON TABLE contract_documents IS 'Documents attached to contracts';
COMMENT ON TABLE contract_amendments IS 'Amendments and addendums to contracts';
