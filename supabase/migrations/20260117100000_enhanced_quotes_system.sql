-- Enhanced Quotes System Migration
-- Created: 2026-01-17
-- Purpose: Add advanced quote management capabilities

-- ============================================================================
-- PART 1: Quote Templates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_content text, -- HTML template for quote formatting
  default_terms text, -- Default terms and conditions
  default_payment_terms text, -- Default payment terms
  category text CHECK (category IN ('construction', 'consulting', 'design', 'development', 'marketing', 'other')),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for quote_templates
CREATE INDEX IF NOT EXISTS idx_quote_templates_category ON quote_templates(category);
CREATE INDEX IF NOT EXISTS idx_quote_templates_active ON quote_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quote_templates_created_by ON quote_templates(created_by);

-- RLS for quote_templates
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view quote templates" ON quote_templates
  FOR SELECT USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Staff can insert quote templates" ON quote_templates
  FOR INSERT WITH CHECK (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Staff can update quote templates" ON quote_templates
  FOR UPDATE USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Admins can delete quote templates" ON quote_templates
  FOR DELETE USING (
    is_admin_or_manager(auth.uid())
  );

-- ============================================================================
-- PART 2: Enhanced Quotes Table
-- ============================================================================

-- Add new columns to existing quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_template_id uuid REFERENCES quote_templates(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_schedule jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS estimated_hours numeric;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS hourly_rate numeric;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS advance_payment_required boolean DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS advance_payment_percentage numeric DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS advance_payment_amount numeric;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contract_type text CHECK (contract_type IN ('fixed_price', 'hourly', 'milestone', 'retainer'));
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ILS';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS language text DEFAULT 'he';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_contract_id uuid; -- Will reference contracts table

-- Add index for template reference
CREATE INDEX IF NOT EXISTS idx_quotes_template_id ON quotes(quote_template_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contract_type ON quotes(contract_type);

-- ============================================================================
-- PART 3: Quote Items Table (Detailed Line Items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_order integer DEFAULT 0,
  category text, -- Item category for grouping
  description text NOT NULL,
  quantity numeric DEFAULT 1 CHECK (quantity > 0),
  unit text DEFAULT 'unit', -- 'unit', 'hour', 'day', 'sqm', 'month', etc.
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  subtotal numeric GENERATED ALWAYS AS (
    (quantity * unit_price) - COALESCE(discount_amount, 0) - (quantity * unit_price * COALESCE(discount_percentage, 0) / 100)
  ) STORED,
  notes text,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for quote_items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_category ON quote_items(category);
CREATE INDEX IF NOT EXISTS idx_quote_items_order ON quote_items(quote_id, item_order);

-- RLS for quote_items
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view quote items" ON quote_items
  FOR SELECT USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Staff can insert quote items" ON quote_items
  FOR INSERT WITH CHECK (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Staff can update quote items" ON quote_items
  FOR UPDATE USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Staff can delete quote items" ON quote_items
  FOR DELETE USING (
    is_admin_or_manager(auth.uid()) OR has_role(auth.uid(), 'employee'::app_role)
  );

-- ============================================================================
-- PART 4: Triggers and Functions
-- ============================================================================

-- Function: Auto-calculate quote totals from items
CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal numeric;
  v_vat_rate numeric;
  v_vat_amount numeric;
  v_total numeric;
BEGIN
  -- Get quote VAT rate
  SELECT vat_rate INTO v_vat_rate
  FROM quotes
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  v_vat_rate := COALESCE(v_vat_rate, 18);
  
  -- Calculate subtotal from all items
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_subtotal
  FROM quote_items
  WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  -- Calculate VAT and total
  v_vat_amount := v_subtotal * v_vat_rate / 100;
  v_total := v_subtotal + v_vat_amount;
  
  -- Update quote
  UPDATE quotes SET
    subtotal = v_subtotal,
    vat_amount = v_vat_amount,
    total_amount = v_total,
    updated_at = now()
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update quote totals when items change
DROP TRIGGER IF EXISTS update_quote_totals_trigger ON quote_items;
CREATE TRIGGER update_quote_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON quote_items
FOR EACH ROW EXECUTE FUNCTION calculate_quote_totals();

-- Trigger: Update updated_at for quote_templates
CREATE OR REPLACE FUNCTION update_quote_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quote_template_updated_at_trigger ON quote_templates;
CREATE TRIGGER update_quote_template_updated_at_trigger
BEFORE UPDATE ON quote_templates
FOR EACH ROW EXECUTE FUNCTION update_quote_template_updated_at();

-- Trigger: Update updated_at for quote_items
DROP TRIGGER IF EXISTS update_quote_items_updated_at_trigger ON quote_items;
CREATE TRIGGER update_quote_items_updated_at_trigger
BEFORE UPDATE ON quote_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: Sample Data (Optional)
-- ============================================================================

-- Insert default quote templates
INSERT INTO quote_templates (name, description, category, default_terms, default_payment_terms, created_by) 
VALUES 
  (
    'Standard Quote',
    'Basic quote template',
    'other',
    'Quote validity: 30 days from issue date. Prices do not include VAT.',
    '50% advance, balance upon completion',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    'Software Development Quote',
    'Special template for development projects',
    'development',
    'Quote validity: 45 days. Prices include 3 months of technical support.',
    '30% advance, 40% midway, 30% upon completion',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    'Design Quote',
    'Template for graphic design work',
    'design',
    'Quote validity: 30 days. Includes up to 3 revision rounds.',
    '50% advance, 50% upon final approval',
    (SELECT id FROM auth.users LIMIT 1)
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 6: Comments
-- ============================================================================

COMMENT ON TABLE quote_templates IS 'Quote templates with default terms';
COMMENT ON TABLE quote_items IS 'Detailed line items for quotes';
COMMENT ON COLUMN quotes.payment_schedule IS 'Proposed payment schedule (JSON array)';
COMMENT ON COLUMN quotes.contract_type IS 'Contract type: fixed_price, hourly, milestone, or retainer';
COMMENT ON COLUMN quote_items.subtotal IS 'Auto-calculated: (quantity * unit_price) - discount';
