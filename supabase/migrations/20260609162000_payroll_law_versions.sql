-- ============================================================
-- Payroll law versions (official-source controlled)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payroll_law_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name TEXT NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  source_url_tax TEXT NOT NULL,
  source_url_ni TEXT NOT NULL,
  source_snapshot_tax TEXT,
  source_snapshot_ni TEXT,
  tax_credit_point_value NUMERIC(10,2) NOT NULL DEFAULT 248,
  income_tax_brackets JSONB NOT NULL DEFAULT (
    '[{"upTo":7010,"rate":0.10},{"upTo":10060,"rate":0.14},{"upTo":16150,"rate":0.20},{"upTo":22440,"rate":0.31},{"upTo":46690,"rate":0.35},{"upTo":60130,"rate":0.47},{"upTo":999999999,"rate":0.50}]'::jsonb
  ),
  ni_reduced_rate NUMERIC(10,6) NOT NULL DEFAULT 0.004,
  ni_full_rate NUMERIC(10,6) NOT NULL DEFAULT 0.07,
  health_reduced_rate NUMERIC(10,6) NOT NULL DEFAULT 0.031,
  health_full_rate NUMERIC(10,6) NOT NULL DEFAULT 0.05,
  ni_health_threshold NUMERIC(12,2) NOT NULL DEFAULT 7522,
  ni_health_ceiling NUMERIC(12,2) NOT NULL DEFAULT 49030,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_law_versions_active_only
  ON public.payroll_law_versions((is_active))
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_payroll_law_versions_effective_from
  ON public.payroll_law_versions(effective_from DESC);

DROP TRIGGER IF EXISTS trg_payroll_law_versions_updated_at ON public.payroll_law_versions;
CREATE TRIGGER trg_payroll_law_versions_updated_at
  BEFORE UPDATE ON public.payroll_law_versions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.payroll_law_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_law_select_manager" ON public.payroll_law_versions;
CREATE POLICY "payroll_law_select_manager" ON public.payroll_law_versions
  FOR SELECT USING (public.is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "payroll_law_insert_admin" ON public.payroll_law_versions;
CREATE POLICY "payroll_law_insert_admin" ON public.payroll_law_versions
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "payroll_law_update_admin" ON public.payroll_law_versions;
CREATE POLICY "payroll_law_update_admin" ON public.payroll_law_versions
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "payroll_law_delete_admin" ON public.payroll_law_versions;
CREATE POLICY "payroll_law_delete_admin" ON public.payroll_law_versions
  FOR DELETE USING (public.is_admin(auth.uid()));

INSERT INTO public.payroll_law_versions (
  version_name,
  effective_from,
  source_url_tax,
  source_url_ni,
  source_snapshot_tax,
  source_snapshot_ni,
  is_active,
  approved_at
)
SELECT
  'official-default-2026',
  CURRENT_DATE,
  'https://www.taxes.gov.il',
  'https://www.btl.gov.il',
  'Seeded from known official structure. Review monthly with official publications.',
  'Seeded from known official structure. Review monthly with official publications.',
  TRUE,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.payroll_law_versions WHERE is_active = TRUE
);
