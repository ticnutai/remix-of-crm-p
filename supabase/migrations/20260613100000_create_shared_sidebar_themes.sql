-- Shared sidebar themes visible to all authenticated users.

CREATE TABLE IF NOT EXISTS public.shared_sidebar_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  theme_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_sidebar_themes_updated_at
  ON public.shared_sidebar_themes(updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_sidebar_themes TO authenticated;
GRANT ALL ON public.shared_sidebar_themes TO service_role;

ALTER TABLE public.shared_sidebar_themes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shared_sidebar_themes'
      AND policyname = 'Authenticated can read shared sidebar themes'
  ) THEN
    CREATE POLICY "Authenticated can read shared sidebar themes"
    ON public.shared_sidebar_themes
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shared_sidebar_themes'
      AND policyname = 'Authenticated can insert shared sidebar themes'
  ) THEN
    CREATE POLICY "Authenticated can insert shared sidebar themes"
    ON public.shared_sidebar_themes
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shared_sidebar_themes'
      AND policyname = 'Owner or admin can update shared sidebar themes'
  ) THEN
    CREATE POLICY "Owner or admin can update shared sidebar themes"
    ON public.shared_sidebar_themes
    FOR UPDATE
    TO authenticated
    USING (
      created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
    WITH CHECK (
      created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shared_sidebar_themes'
      AND policyname = 'Owner or admin can delete shared sidebar themes'
  ) THEN
    CREATE POLICY "Owner or admin can delete shared sidebar themes"
    ON public.shared_sidebar_themes
    FOR DELETE
    TO authenticated
    USING (
      created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_shared_sidebar_themes_updated_at ON public.shared_sidebar_themes;

CREATE TRIGGER set_shared_sidebar_themes_updated_at
BEFORE UPDATE ON public.shared_sidebar_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
