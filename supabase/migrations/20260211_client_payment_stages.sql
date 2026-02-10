-- Payment Stages System for Client Profile
-- Creates a table for tracking payment milestones/stages per client

-- 1. Create payment_stages table
CREATE TABLE IF NOT EXISTS public.client_payment_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    stage_name text NOT NULL,
    stage_number integer NOT NULL DEFAULT 1,
    description text,
    amount numeric(12,2) NOT NULL DEFAULT 0,
    vat_rate numeric(5,2) DEFAULT 17,
    amount_with_vat numeric(12,2) GENERATED ALWAYS AS (amount * (1 + COALESCE(vat_rate, 17) / 100)) STORED,
    is_paid boolean DEFAULT false,
    paid_date date,
    paid_amount numeric(12,2) DEFAULT 0,
    payment_method text DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card', 'bit', 'paypal', 'other')),
    paid_by text,
    payment_reference text,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create additional_payments table for non-stage payments
CREATE TABLE IF NOT EXISTS public.client_additional_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL,
    payment_type text NOT NULL DEFAULT 'other' CHECK (payment_type IN ('extra_hours', 'renderings', 'additional_services', 'expenses', 'materials', 'travel', 'consulting', 'other')),
    description text NOT NULL,
    amount numeric(12,2) NOT NULL DEFAULT 0,
    vat_rate numeric(5,2) DEFAULT 17,
    amount_with_vat numeric(12,2) GENERATED ALWAYS AS (amount * (1 + COALESCE(vat_rate, 17) / 100)) STORED,
    is_paid boolean DEFAULT false,
    paid_date date,
    paid_amount numeric(12,2) DEFAULT 0,
    payment_method text DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card', 'bit', 'paypal', 'other')),
    paid_by text,
    payment_reference text,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_client_payment_stages_client_id ON public.client_payment_stages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payment_stages_is_paid ON public.client_payment_stages(is_paid);
CREATE INDEX IF NOT EXISTS idx_client_additional_payments_client_id ON public.client_additional_payments(client_id);

-- 4. Enable RLS
ALTER TABLE public.client_payment_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_additional_payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for client_payment_stages
DROP POLICY IF EXISTS "staff_view_payment_stages" ON public.client_payment_stages;
CREATE POLICY "staff_view_payment_stages" ON public.client_payment_stages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_insert_payment_stages" ON public.client_payment_stages;
CREATE POLICY "staff_insert_payment_stages" ON public.client_payment_stages
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update_payment_stages" ON public.client_payment_stages;
CREATE POLICY "staff_update_payment_stages" ON public.client_payment_stages
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_delete_payment_stages" ON public.client_payment_stages;
CREATE POLICY "staff_delete_payment_stages" ON public.client_payment_stages
    FOR DELETE TO authenticated USING (true);

-- 6. RLS Policies for client_additional_payments
DROP POLICY IF EXISTS "staff_view_additional_payments" ON public.client_additional_payments;
CREATE POLICY "staff_view_additional_payments" ON public.client_additional_payments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_insert_additional_payments" ON public.client_additional_payments;
CREATE POLICY "staff_insert_additional_payments" ON public.client_additional_payments
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update_additional_payments" ON public.client_additional_payments;
CREATE POLICY "staff_update_additional_payments" ON public.client_additional_payments
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_delete_additional_payments" ON public.client_additional_payments;
CREATE POLICY "staff_delete_additional_payments" ON public.client_additional_payments
    FOR DELETE TO authenticated USING (true);

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_payment_stages_updated_at ON public.client_payment_stages;
CREATE TRIGGER trg_update_payment_stages_updated_at
    BEFORE UPDATE ON public.client_payment_stages
    FOR EACH ROW EXECUTE FUNCTION update_payment_stages_updated_at();

DROP TRIGGER IF EXISTS trg_update_additional_payments_updated_at ON public.client_additional_payments;
CREATE TRIGGER trg_update_additional_payments_updated_at
    BEFORE UPDATE ON public.client_additional_payments
    FOR EACH ROW EXECUTE FUNCTION update_payment_stages_updated_at();
