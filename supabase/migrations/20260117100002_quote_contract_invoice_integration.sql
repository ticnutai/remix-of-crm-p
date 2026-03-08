-- Quote-Contract-Invoice Integration Migration
-- Created: 2026-01-17
-- Purpose: Functions and automation for workflow integration

-- ============================================================================
-- PART 1: Auto-generate Contract Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS text AS $$
DECLARE
  year_part text;
  seq_part text;
  counter integer;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Count existing contracts this year
  SELECT COUNT(*) + 1
  INTO counter
  FROM contracts
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  seq_part := LPAD(counter::text, 4, '0');
  
  RETURN 'CNT-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-generate contract number on insert
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := generate_contract_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contract_number_trigger ON contracts;
CREATE TRIGGER set_contract_number_trigger
BEFORE INSERT ON contracts
FOR EACH ROW EXECUTE FUNCTION set_contract_number();

-- ============================================================================
-- PART 2: Convert Quote to Contract
-- ============================================================================

CREATE OR REPLACE FUNCTION convert_quote_to_contract(
  p_quote_id uuid,
  p_start_date date,
  p_end_date date DEFAULT NULL,
  p_signed_date date DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_quote quotes;
  v_contract_id uuid;
  v_signed_date date;
BEGIN
  -- Get quote details
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found: %', p_quote_id;
  END IF;
  
  -- Check quote status
  IF v_quote.status NOT IN ('accepted', 'sent') THEN
    RAISE EXCEPTION 'Quote must be accepted or sent. Current status: %', v_quote.status;
  END IF;
  
  -- Check if already converted
  IF v_quote.converted_to_contract_id IS NOT NULL THEN
    RAISE EXCEPTION 'Quote already converted to contract: %', v_quote.converted_to_contract_id;
  END IF;
  
  -- Use provided signed date or quote's signed date or current date
  v_signed_date := COALESCE(p_signed_date, v_quote.signed_date, CURRENT_DATE);
  
  -- Create contract
  INSERT INTO contracts (
    quote_id,
    client_id,
    project_id,
    title,
    description,
    contract_type,
    contract_value,
    currency,
    start_date,
    end_date,
    signed_date,
    payment_terms,
    terms_and_conditions,
    advance_payment_required,
    advance_payment_amount,
    created_by,
    status
  ) VALUES (
    p_quote_id,
    v_quote.client_id,
    v_quote.project_id,
    v_quote.title,
    v_quote.description,
    COALESCE(v_quote.contract_type, 'fixed_price'),
    v_quote.total_amount,
    COALESCE(v_quote.currency, 'ILS'),
    p_start_date,
    p_end_date,
    v_signed_date,
    v_quote.payment_terms,
    v_quote.terms_and_conditions,
    v_quote.advance_payment_required,
    v_quote.advance_payment_amount,
    v_quote.created_by,
    'active'
  ) RETURNING id INTO v_contract_id;
  
  -- Update quote
  UPDATE quotes
  SET 
    converted_to_contract_id = v_contract_id,
    status = 'converted',
    updated_at = now()
  WHERE id = p_quote_id;
  
  -- Log activity
  INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'convert',
    'quote',
    p_quote_id,
    jsonb_build_object(
      'contract_id', v_contract_id,
      'contract_number', (SELECT contract_number FROM contracts WHERE id = v_contract_id)
    )
  );
  
  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION convert_quote_to_contract TO authenticated;

COMMENT ON FUNCTION convert_quote_to_contract IS 'Convert approved quote to active contract';

-- ============================================================================
-- PART 3: Create Payment Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION create_payment_schedule(
  p_contract_id uuid,
  p_num_payments integer,
  p_first_payment_date date,
  p_payment_amounts numeric[] DEFAULT NULL -- Optional array of custom amounts
) RETURNS void AS $$
DECLARE
  v_contract contracts;
  v_payment_amount numeric;
  v_current_date date;
  v_i integer;
  v_total_assigned numeric := 0;
  v_last_payment_amount numeric;
BEGIN
  -- Validate inputs
  IF p_num_payments <= 0 THEN
    RAISE EXCEPTION 'Number of payments must be positive';
  END IF;
  
  -- Get contract details
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found: %', p_contract_id;
  END IF;
  
  -- Check if schedule already exists
  IF EXISTS (SELECT 1 FROM payment_schedules WHERE contract_id = p_contract_id) THEN
    RAISE EXCEPTION 'Payment schedule already exists for this contract';
  END IF;
  
  v_current_date := p_first_payment_date;
  
  -- If custom amounts provided, use them
  IF p_payment_amounts IS NOT NULL THEN
    IF array_length(p_payment_amounts, 1) != p_num_payments THEN
      RAISE EXCEPTION 'Number of payment amounts must match number of payments';
    END IF;
    
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
        'Payment ' || v_i || ' of ' || p_num_payments,
        p_payment_amounts[v_i],
        v_current_date,
        'pending'
      );
      
      -- Next payment 30 days later
      v_current_date := v_current_date + INTERVAL '30 days';
    END LOOP;
  ELSE
    -- Equal payments
    v_payment_amount := FLOOR(v_contract.contract_value / p_num_payments * 100) / 100;
    
    FOR v_i IN 1..(p_num_payments - 1) LOOP
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
        'Payment ' || v_i || ' of ' || p_num_payments,
        v_payment_amount,
        v_current_date,
        'pending'
      );
      
      v_total_assigned := v_total_assigned + v_payment_amount;
      v_current_date := v_current_date + INTERVAL '30 days';
    END LOOP;
    
    -- Last payment includes any remainder
    v_last_payment_amount := v_contract.contract_value - v_total_assigned;
    
    INSERT INTO payment_schedules (
      contract_id,
      payment_number,
      description,
      amount,
      due_date,
      status
    ) VALUES (
      p_contract_id,
      p_num_payments,
      'Payment ' || p_num_payments || ' of ' || p_num_payments || ' (final)',
      v_last_payment_amount,
      v_current_date,
      'pending'
    );
  END IF;
  
  -- Log activity
  INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'create',
    'payment_schedule',
    p_contract_id,
    jsonb_build_object(
      'num_payments', p_num_payments,
      'first_payment_date', p_first_payment_date
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_payment_schedule TO authenticated;

COMMENT ON FUNCTION create_payment_schedule IS 'Create payment schedule for a contract';

-- ============================================================================
-- PART 4: Create Invoice from Payment Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION create_invoice_from_schedule(
  p_payment_schedule_id uuid
) RETURNS uuid AS $$
DECLARE
  v_schedule payment_schedules;
  v_contract contracts;
  v_invoice_id uuid;
  v_invoice_number text;
  v_year_part text;
  v_counter integer;
BEGIN
  -- Get schedule
  SELECT ps.*
  INTO v_schedule
  FROM payment_schedules ps
  WHERE ps.id = p_payment_schedule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment schedule not found: %', p_payment_schedule_id;
  END IF;
  
  -- Get contract
  SELECT c.*
  INTO v_contract
  FROM contracts c
  WHERE c.id = v_schedule.contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found: %', v_schedule.contract_id;
  END IF;
  
  -- Check if invoice already created
  IF v_schedule.invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Invoice already exists for this payment: %', v_schedule.invoice_id;
  END IF;
  
  -- Check schedule status
  IF v_schedule.status NOT IN ('pending', 'overdue') THEN
    RAISE EXCEPTION 'Cannot create invoice for payment with status: %', v_schedule.status;
  END IF;
  
  -- Generate invoice number
  v_year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1
  INTO v_counter
  FROM invoices
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_invoice_number := 'INV-' || v_year_part || '-' || LPAD(v_counter::text, 5, '0');
  
  -- Create invoice
  INSERT INTO invoices (
    client_id,
    project_id,
    contract_id,
    payment_schedule_id,
    invoice_number,
    amount,
    description,
    issue_date,
    due_date,
    status,
    created_by
  ) VALUES (
    v_contract.client_id,
    v_contract.project_id,
    v_contract.id,
    p_payment_schedule_id,
    v_invoice_number,
    v_schedule.amount,
    v_schedule.description || ' - ' || v_contract.title,
    CURRENT_DATE,
    v_schedule.due_date,
    'sent',
    v_contract.created_by
  ) RETURNING id INTO v_invoice_id;
  
  -- Update schedule
  UPDATE payment_schedules
  SET 
    invoice_id = v_invoice_id,
    status = 'sent',
    updated_at = now()
  WHERE id = p_payment_schedule_id;
  
  -- Log activity
  INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'create',
    'invoice',
    v_invoice_id,
    jsonb_build_object(
      'payment_schedule_id', p_payment_schedule_id,
      'contract_id', v_contract.id
    )
  );
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_invoice_from_schedule TO authenticated;

COMMENT ON FUNCTION create_invoice_from_schedule IS 'Create invoice from payment schedule';

-- ============================================================================
-- PART 5: Check and Update Overdue Payments
-- ============================================================================

CREATE OR REPLACE FUNCTION check_overdue_payments()
RETURNS integer AS $$
DECLARE
  v_updated_count integer;
BEGIN
  -- Update pending payments that are overdue
  UPDATE payment_schedules
  SET 
    status = 'overdue',
    updated_at = now()
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_overdue_payments TO authenticated;

COMMENT ON FUNCTION check_overdue_payments IS 'Check and update payments past due date';

-- ============================================================================
-- PART 6: Mark Contract as Completed When All Payments Done
-- ============================================================================

CREATE OR REPLACE FUNCTION update_contract_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_total_payments integer;
  v_paid_payments integer;
  v_contract_id uuid;
BEGIN
  v_contract_id := COALESCE(NEW.contract_id, OLD.contract_id);
  
  -- Count total and paid payments
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'paid')
  INTO v_total_payments, v_paid_payments
  FROM payment_schedules
  WHERE contract_id = v_contract_id;
  
  -- If all payments are paid, mark contract as completed
  IF v_total_payments > 0 AND v_total_payments = v_paid_payments THEN
    UPDATE contracts
    SET 
      status = 'completed',
      updated_at = now()
    WHERE id = v_contract_id 
      AND status = 'active';
      
    -- Log completion
    IF FOUND THEN
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
      VALUES (
        auth.uid(),
        'complete',
        'contract',
        v_contract_id,
        jsonb_build_object('reason', 'all_payments_completed')
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update contract status when payment is marked as paid
DROP TRIGGER IF EXISTS update_contract_status_trigger ON payment_schedules;
CREATE TRIGGER update_contract_status_trigger
AFTER UPDATE ON payment_schedules
FOR EACH ROW
WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
EXECUTE FUNCTION update_contract_status_on_payment();

-- ============================================================================
-- PART 7: Sync Payment Schedule Status with Invoice Payment
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_payment_schedule_with_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice invoices;
  v_schedule_id uuid;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  IF NOT FOUND OR v_invoice.payment_schedule_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  v_schedule_id := v_invoice.payment_schedule_id;
  
  -- Update payment schedule based on invoice status
  IF v_invoice.status = 'paid' THEN
    UPDATE payment_schedules
    SET 
      status = 'paid',
      paid_amount = v_invoice.paid_amount,
      paid_date = CURRENT_DATE,
      updated_at = now()
    WHERE id = v_schedule_id;
  ELSIF v_invoice.status = 'overdue' THEN
    UPDATE payment_schedules
    SET 
      status = 'overdue',
      updated_at = now()
    WHERE id = v_schedule_id
      AND status NOT IN ('paid', 'cancelled');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Sync payment schedule when invoice payment is updated
DROP TRIGGER IF EXISTS sync_payment_schedule_trigger ON invoice_payments;
CREATE TRIGGER sync_payment_schedule_trigger
AFTER INSERT OR UPDATE ON invoice_payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_schedule_with_invoice();

-- ============================================================================
-- PART 8: Helper Functions
-- ============================================================================

-- Function: Get contract summary with payment statistics
CREATE OR REPLACE FUNCTION get_contract_summary(p_contract_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'contract_id', c.id,
    'contract_number', c.contract_number,
    'title', c.title,
    'client_name', cl.name,
    'contract_value', c.contract_value,
    'status', c.status,
    'total_payments', COUNT(ps.id),
    'paid_payments', COUNT(ps.id) FILTER (WHERE ps.status = 'paid'),
    'pending_payments', COUNT(ps.id) FILTER (WHERE ps.status = 'pending'),
    'overdue_payments', COUNT(ps.id) FILTER (WHERE ps.status = 'overdue'),
    'total_paid', COALESCE(SUM(ps.paid_amount), 0),
    'total_pending', COALESCE(SUM(ps.amount) FILTER (WHERE ps.status IN ('pending', 'overdue')), 0),
    'next_payment_date', MIN(ps.due_date) FILTER (WHERE ps.status = 'pending'),
    'completion_percentage', ROUND(
      (COUNT(ps.id) FILTER (WHERE ps.status = 'paid')::numeric / NULLIF(COUNT(ps.id), 0) * 100),
      2
    )
  ) INTO v_result
  FROM contracts c
  JOIN clients cl ON c.client_id = cl.id
  LEFT JOIN payment_schedules ps ON c.id = ps.contract_id
  WHERE c.id = p_contract_id
  GROUP BY c.id, c.contract_number, c.title, c.contract_value, c.status, cl.name;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_contract_summary TO authenticated;

COMMENT ON FUNCTION get_contract_summary IS 'Get contract summary including payment statistics';

-- ============================================================================
-- PART 9: Comments
-- ============================================================================

COMMENT ON FUNCTION convert_quote_to_contract IS 'Automatic conversion of approved quote to active contract';
COMMENT ON FUNCTION create_payment_schedule IS 'Create scheduled payment plan for a contract';
COMMENT ON FUNCTION create_invoice_from_schedule IS 'Automatic invoice creation from payment schedule';
COMMENT ON FUNCTION check_overdue_payments IS 'Daily check and update of overdue payments';
