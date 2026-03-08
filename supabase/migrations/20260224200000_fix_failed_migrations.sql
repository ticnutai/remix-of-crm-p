-- Fix missing columns from failed migrations

-- 1. Add subtotal to quote_items if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'subtotal' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN subtotal numeric GENERATED ALWAYS AS (
      (quantity * unit_price) - COALESCE(discount_amount, 0) - (quantity * unit_price * COALESCE(discount_percentage, 0) / 100)
    ) STORED;
    RAISE NOTICE 'Added subtotal column to quote_items';
  END IF;
END $$;

-- 2. Add missing columns to quote_items 
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'category' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN category text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'unit' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN unit text DEFAULT 'unit';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'discount_percentage' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN discount_percentage numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'discount_amount' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'is_optional' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN is_optional boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'item_order' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.quote_items ADD COLUMN item_order integer DEFAULT 0;
  END IF;
END $$;

-- 3. Now re-run the quotes functions that depend on subtotal
CREATE OR REPLACE FUNCTION update_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal numeric;
  v_vat_rate numeric;
  v_vat_amount numeric;
  v_total numeric;
BEGIN
  SELECT COALESCE(vat_rate, 17) INTO v_vat_rate FROM quotes WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  SELECT COALESCE(SUM(COALESCE(subtotal, quantity * unit_price)), 0)
  INTO v_subtotal
  FROM quote_items
  WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id) AND (is_optional IS NULL OR is_optional = false);
  
  v_vat_amount := v_subtotal * v_vat_rate / 100;
  v_total := v_subtotal + v_vat_amount;
  
  UPDATE quotes SET
    subtotal = v_subtotal,
    vat_amount = v_vat_amount,
    total = v_total,
    updated_at = now()
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_quote_totals ON quote_items;
CREATE TRIGGER trg_update_quote_totals
  AFTER INSERT OR UPDATE OR DELETE ON quote_items
  FOR EACH ROW EXECUTE FUNCTION update_quote_totals();

-- 4. Fix unified_file_system - the "role" column issue
-- The original migration references auth.users.role which doesn't exist
-- Just ensure the function uses user_roles table instead
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1;
  RETURN COALESCE(v_role, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix fix_all_rls - created_by column
-- Add created_by to tables that might be missing it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rate_limits' AND schemaname = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'rate_limits' AND column_name = 'created_by' AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.rate_limits ADD COLUMN created_by uuid REFERENCES auth.users(id);
    END IF;
  END IF;
END $$;
