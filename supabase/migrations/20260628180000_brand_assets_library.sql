-- System-wide Flow brand asset library for logos and strips.

CREATE TABLE IF NOT EXISTS public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'bundle' CHECK (kind IN ('logo', 'strip', 'bundle')),
  logo_url text,
  strip_url text,
  design_state jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_assets_kind ON public.brand_assets(kind);
CREATE INDEX IF NOT EXISTS idx_brand_assets_updated_at ON public.brand_assets(updated_at DESC);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read brand assets" ON public.brand_assets;
CREATE POLICY "Authenticated users can read brand assets"
ON public.brand_assets
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create brand assets" ON public.brand_assets;
CREATE POLICY "Authenticated users can create brand assets"
ON public.brand_assets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Authenticated users can update brand assets" ON public.brand_assets;
CREATE POLICY "Authenticated users can update brand assets"
ON public.brand_assets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete brand assets" ON public.brand_assets;
CREATE POLICY "Authenticated users can delete brand assets"
ON public.brand_assets
FOR DELETE
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.update_brand_assets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_brand_assets_updated_at ON public.brand_assets;
CREATE TRIGGER trg_brand_assets_updated_at
BEFORE UPDATE ON public.brand_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_brand_assets_updated_at();
