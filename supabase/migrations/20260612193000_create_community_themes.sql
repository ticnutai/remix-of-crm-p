-- Community themes published by admins and readable by all authenticated users.

CREATE TABLE IF NOT EXISTS public.community_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_he text NOT NULL,
  primary_hsl text NOT NULL,
  secondary_hsl text NOT NULL,
  primary_hex text NOT NULL,
  secondary_hex text NOT NULL,
  element_overrides jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS name_he text;
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS primary_hsl text;
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS secondary_hsl text;
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS primary_hex text;
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS secondary_hex text;
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS element_overrides jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.community_themes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.community_themes
SET
  name_he = COALESCE(NULLIF(name_he, ''), name),
  primary_hsl = COALESCE(NULLIF(primary_hsl, ''), '220 45% 18%'),
  secondary_hsl = COALESCE(NULLIF(secondary_hsl, ''), '43 45% 60%'),
  primary_hex = COALESCE(NULLIF(primary_hex, ''), '#1b2541'),
  secondary_hex = COALESCE(NULLIF(secondary_hex, ''), '#c9a962'),
  element_overrides = COALESCE(element_overrides, '[]'::jsonb),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE true;

ALTER TABLE public.community_themes
  ALTER COLUMN name_he SET NOT NULL,
  ALTER COLUMN primary_hsl SET NOT NULL,
  ALTER COLUMN secondary_hsl SET NOT NULL,
  ALTER COLUMN primary_hex SET NOT NULL,
  ALTER COLUMN secondary_hex SET NOT NULL,
  ALTER COLUMN element_overrides SET DEFAULT '[]'::jsonb,
  ALTER COLUMN element_overrides SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS community_themes_slug_key ON public.community_themes(slug);
CREATE INDEX IF NOT EXISTS idx_community_themes_created_at ON public.community_themes(created_at DESC);

GRANT SELECT ON public.community_themes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_themes TO authenticated;
GRANT ALL ON public.community_themes TO service_role;

ALTER TABLE public.community_themes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_themes'
      AND policyname = 'Anyone authenticated can read community themes'
  ) THEN
    CREATE POLICY "Anyone authenticated can read community themes"
    ON public.community_themes
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_themes'
      AND policyname = 'Admins can insert community themes'
  ) THEN
    CREATE POLICY "Admins can insert community themes"
    ON public.community_themes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_themes'
      AND policyname = 'Admins can update community themes'
  ) THEN
    CREATE POLICY "Admins can update community themes"
    ON public.community_themes
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_themes'
      AND policyname = 'Admins can delete community themes'
  ) THEN
    CREATE POLICY "Admins can delete community themes"
    ON public.community_themes
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_community_themes_updated_at ON public.community_themes;

CREATE TRIGGER set_community_themes_updated_at
BEFORE UPDATE ON public.community_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
