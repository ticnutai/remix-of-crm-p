
-- 1. הרחבת employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('single','married','divorced','widowed','separated')),
  ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children_data JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spouse_works BOOLEAN,
  ADD COLUMN IF NOT EXISTS spouse_id_number TEXT,
  ADD COLUMN IF NOT EXISTS address_street TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_zip TEXT,
  ADD COLUMN IF NOT EXISTS address_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS address_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS aliyah_date DATE,
  ADD COLUMN IF NOT EXISTS disability_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS academic_degree TEXT,
  ADD COLUMN IF NOT EXISTS degree_completion_year INTEGER,
  ADD COLUMN IF NOT EXISTS profession_code TEXT,
  ADD COLUMN IF NOT EXISTS position_ratio_pct NUMERIC(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS work_distance_km NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS has_company_car BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS company_car_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_company_phone BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS company_phone_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clothing_allowance_annual NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recuperation_days_used NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS pension_fund_name TEXT,
  ADD COLUMN IF NOT EXISTS pension_policy_number TEXT,
  ADD COLUMN IF NOT EXISTS study_fund_name TEXT,
  ADD COLUMN IF NOT EXISTS study_fund_policy_number TEXT;

-- 2. טבלה חדשה - ערכי יום הבראה לפי שנה
CREATE TABLE IF NOT EXISTS public.payroll_recuperation_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  sector TEXT NOT NULL DEFAULT 'private',
  daily_rate NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (year, sector)
);

GRANT SELECT ON public.payroll_recuperation_rates TO authenticated;
GRANT ALL ON public.payroll_recuperation_rates TO service_role;

ALTER TABLE public.payroll_recuperation_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read recuperation rates"
  ON public.payroll_recuperation_rates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Only admins can manage recuperation rates"
  ON public.payroll_recuperation_rates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default values
INSERT INTO public.payroll_recuperation_rates (year, sector, daily_rate, notes) VALUES
  (2024, 'private', 418, 'מגזר פרטי 2024'),
  (2025, 'private', 432, 'מגזר פרטי 2025'),
  (2026, 'private', 471, 'מגזר פרטי 2026 (הערכה)'),
  (2024, 'public', 471, 'מגזר ציבורי 2024'),
  (2025, 'public', 486, 'מגזר ציבורי 2025'),
  (2026, 'public', 504, 'מגזר ציבורי 2026 (הערכה)')
ON CONFLICT (year, sector) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_payroll_recuperation_rates_updated_at
  BEFORE UPDATE ON public.payroll_recuperation_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
