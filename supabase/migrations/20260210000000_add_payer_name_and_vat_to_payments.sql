-- Add payer_name to invoice_payments table
ALTER TABLE public.invoice_payments 
ADD COLUMN IF NOT EXISTS payer_name text;

-- Add VAT rate column (default 17%)
ALTER TABLE public.invoice_payments 
ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 17;

-- Add comment
COMMENT ON COLUMN public.invoice_payments.payer_name IS 'Name of the person/entity who made the payment';
COMMENT ON COLUMN public.invoice_payments.vat_rate IS 'VAT rate percentage (default 17%)';

-- Add payment_method values if not exists
DO $$ 
BEGIN
  -- Check if payment_method column has constraints
  ALTER TABLE public.invoice_payments 
  DROP CONSTRAINT IF EXISTS invoice_payments_payment_method_check;
  
  ALTER TABLE public.invoice_payments
  ADD CONSTRAINT invoice_payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card', 'paypal', 'other'));
END $$;
