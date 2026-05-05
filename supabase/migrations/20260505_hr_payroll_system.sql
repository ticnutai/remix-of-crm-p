-- ============================================================
-- HR & Payroll system (Israeli labor law oriented)
--   - Extends employees with HR fields (salary, pension, tax)
--   - Adds employee_leaves (vacation/sick/etc.)
--   - Adds payroll_runs (monthly snapshots)
--   - View: employee_leave_balance
-- All amounts in NIS. Approximate calculations only —
--   not a substitute for an accountant / payroll software.
-- ============================================================

-- 1) Extend employees with HR / payroll columns
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT 'monthly'
    CHECK (employment_type IN ('monthly','hourly','contractor')),
  ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS standard_monthly_hours INTEGER DEFAULT 182, -- typical full-time monthly
  ADD COLUMN IF NOT EXISTS tax_credit_points NUMERIC(4,2) DEFAULT 2.25,
  ADD COLUMN IF NOT EXISTS transport_allowance NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meal_allowance NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pension_employee_pct NUMERIC(5,2) DEFAULT 6.0,
  ADD COLUMN IF NOT EXISTS pension_employer_pct NUMERIC(5,2) DEFAULT 6.5,
  ADD COLUMN IF NOT EXISTS pension_severance_pct NUMERIC(5,2) DEFAULT 6.0,
  ADD COLUMN IF NOT EXISTS study_fund_employee_pct NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS study_fund_employer_pct NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS termination_date DATE;

-- 2) employee_leaves — vacations, sick days, etc.
CREATE TABLE IF NOT EXISTS public.employee_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN (
    'vacation', 'sick', 'mourning', 'reserve', 'maternity', 'unpaid', 'other'
  )),
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  days NUMERIC(5,2) NOT NULL,                       -- working days (can be 0.5)
  status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending','approved','rejected','cancelled')),
  paid BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_leaves_emp     ON public.employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_leaves_dates   ON public.employee_leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_emp_leaves_type    ON public.employee_leaves(leave_type);
CREATE INDEX IF NOT EXISTS idx_emp_leaves_status  ON public.employee_leaves(status);

DROP TRIGGER IF EXISTS trg_emp_leaves_updated_at ON public.employee_leaves;
CREATE TRIGGER trg_emp_leaves_updated_at
  BEFORE UPDATE ON public.employee_leaves
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.employee_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leaves_select_self_or_mgr" ON public.employee_leaves;
CREATE POLICY "leaves_select_self_or_mgr" ON public.employee_leaves
  FOR SELECT USING (
    public.is_attendance_manager()
    OR EXISTS (SELECT 1 FROM public.employees e
               WHERE e.id = employee_id AND e.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "leaves_insert_self_or_mgr" ON public.employee_leaves;
CREATE POLICY "leaves_insert_self_or_mgr" ON public.employee_leaves
  FOR INSERT WITH CHECK (
    public.is_attendance_manager()
    OR EXISTS (SELECT 1 FROM public.employees e
               WHERE e.id = employee_id AND e.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "leaves_update_mgr" ON public.employee_leaves;
CREATE POLICY "leaves_update_mgr" ON public.employee_leaves
  FOR UPDATE USING ( public.is_attendance_manager() );

DROP POLICY IF EXISTS "leaves_delete_mgr" ON public.employee_leaves;
CREATE POLICY "leaves_delete_mgr" ON public.employee_leaves
  FOR DELETE USING ( public.is_attendance_manager() );

-- 3) payroll_runs — monthly payroll snapshot per employee
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_year  INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  -- inputs (snapshot)
  worked_hours       NUMERIC(8,2) DEFAULT 0,
  overtime_hours_125 NUMERIC(8,2) DEFAULT 0,
  overtime_hours_150 NUMERIC(8,2) DEFAULT 0,
  vacation_days      NUMERIC(5,2) DEFAULT 0,
  sick_days          NUMERIC(5,2) DEFAULT 0,
  base_pay           NUMERIC(12,2) DEFAULT 0,
  overtime_pay       NUMERIC(12,2) DEFAULT 0,
  transport          NUMERIC(12,2) DEFAULT 0,
  meal               NUMERIC(12,2) DEFAULT 0,
  other_additions    NUMERIC(12,2) DEFAULT 0,
  -- gross
  gross_total        NUMERIC(12,2) DEFAULT 0,
  pensionable_base   NUMERIC(12,2) DEFAULT 0,
  -- pension contributions
  pension_employee   NUMERIC(12,2) DEFAULT 0,
  pension_employer   NUMERIC(12,2) DEFAULT 0,
  pension_severance  NUMERIC(12,2) DEFAULT 0,
  study_fund_employee NUMERIC(12,2) DEFAULT 0,
  study_fund_employer NUMERIC(12,2) DEFAULT 0,
  -- deductions (estimated)
  income_tax         NUMERIC(12,2) DEFAULT 0,
  national_insurance NUMERIC(12,2) DEFAULT 0,
  health_tax         NUMERIC(12,2) DEFAULT 0,
  other_deductions   NUMERIC(12,2) DEFAULT 0,
  -- net
  net_total          NUMERIC(12,2) DEFAULT 0,
  -- employer total cost
  employer_total_cost NUMERIC(12,2) DEFAULT 0,
  -- meta
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','final','paid','cancelled')),
  notes TEXT,
  calculation_meta JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_emp_period
  ON public.payroll_runs(employee_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_period
  ON public.payroll_runs(period_year, period_month);

DROP TRIGGER IF EXISTS trg_payroll_runs_updated_at ON public.payroll_runs;
CREATE TRIGGER trg_payroll_runs_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_select_self_or_mgr" ON public.payroll_runs;
CREATE POLICY "payroll_select_self_or_mgr" ON public.payroll_runs
  FOR SELECT USING (
    public.is_attendance_manager()
    OR EXISTS (SELECT 1 FROM public.employees e
               WHERE e.id = employee_id AND e.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "payroll_insert_mgr" ON public.payroll_runs;
CREATE POLICY "payroll_insert_mgr" ON public.payroll_runs
  FOR INSERT WITH CHECK ( public.is_attendance_manager() );

DROP POLICY IF EXISTS "payroll_update_mgr" ON public.payroll_runs;
CREATE POLICY "payroll_update_mgr" ON public.payroll_runs
  FOR UPDATE USING ( public.is_attendance_manager() );

DROP POLICY IF EXISTS "payroll_delete_mgr" ON public.payroll_runs;
CREATE POLICY "payroll_delete_mgr" ON public.payroll_runs
  FOR DELETE USING ( public.is_attendance_manager() );

-- 4) Annual leave balance view (computed on the fly)
-- Entitlement table per Israeli annual-leave law (working days, 5-day week):
--   years 1-5  : 12, 14, 14, 14, 14
--   year  6    : 16
--   year  7    : 18
--   year  8    : 19
--   year  9    : 20
--   year  10   : 21
--   year  11   : 22
--   year  12   : 23
--   year 13    : 24
--   year 14+   : 28
CREATE OR REPLACE FUNCTION public.annual_leave_entitlement(years_of_service INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN years_of_service IS NULL OR years_of_service < 1 THEN 12
    WHEN years_of_service BETWEEN 1 AND 5  THEN 12 + LEAST(years_of_service - 1, 0) * 0  -- still 12 in years 1..4 by simple table; refine below
    ELSE 0
  END;
$$;

-- More accurate version
CREATE OR REPLACE FUNCTION public.annual_leave_entitlement(years_of_service INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN years_of_service IS NULL OR years_of_service < 1 THEN 12
    WHEN years_of_service <= 4   THEN 12
    WHEN years_of_service =  5   THEN 14
    WHEN years_of_service =  6   THEN 16
    WHEN years_of_service =  7   THEN 18
    WHEN years_of_service =  8   THEN 19
    WHEN years_of_service =  9   THEN 20
    WHEN years_of_service = 10   THEN 21
    WHEN years_of_service = 11   THEN 22
    WHEN years_of_service = 12   THEN 23
    WHEN years_of_service = 13   THEN 24
    ELSE 28
  END;
$$;

CREATE OR REPLACE VIEW public.employee_leave_balance AS
SELECT
  e.id AS employee_id,
  e.name,
  e.hire_date,
  GREATEST(0, EXTRACT(YEAR FROM age(CURRENT_DATE, e.hire_date))::INT) AS years_of_service,
  public.annual_leave_entitlement(
    GREATEST(0, EXTRACT(YEAR FROM age(CURRENT_DATE, e.hire_date))::INT)
  ) AS annual_entitlement_days,
  COALESCE((
    SELECT SUM(l.days)
    FROM public.employee_leaves l
    WHERE l.employee_id = e.id
      AND l.leave_type = 'vacation'
      AND l.status = 'approved'
      AND EXTRACT(YEAR FROM l.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  ), 0) AS used_vacation_days_ytd,
  COALESCE((
    SELECT SUM(l.days)
    FROM public.employee_leaves l
    WHERE l.employee_id = e.id
      AND l.leave_type = 'sick'
      AND l.status = 'approved'
      AND EXTRACT(YEAR FROM l.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  ), 0) AS used_sick_days_ytd
FROM public.employees e
WHERE e.is_active = TRUE;

GRANT SELECT ON public.employee_leave_balance TO authenticated;

COMMENT ON TABLE public.employee_leaves IS 'Employee leave records (vacation/sick/etc.) for HR tracking.';
COMMENT ON TABLE public.payroll_runs IS 'Monthly payroll snapshots (gross/net/pension). Approximation only — not a substitute for licensed payroll software.';
