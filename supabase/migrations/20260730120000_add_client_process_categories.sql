-- Independent many-to-many classification of clients by stage-template category.
-- These assignments deliberately do not create, update, or delete client stages,
-- stage tasks, payments, or any other workflow data.

CREATE TABLE IF NOT EXISTS public.client_process_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  stage_template_id uuid NOT NULL REFERENCES public.stage_templates(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_process_categories_unique_assignment
    UNIQUE (client_id, stage_template_id)
);

CREATE INDEX IF NOT EXISTS idx_client_process_categories_client_id
  ON public.client_process_categories(client_id);

CREATE INDEX IF NOT EXISTS idx_client_process_categories_stage_template_id
  ON public.client_process_categories(stage_template_id);

ALTER TABLE public.client_process_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view client process categories"
  ON public.client_process_categories;
CREATE POLICY "Authenticated users can view client process categories"
  ON public.client_process_categories
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add client process categories"
  ON public.client_process_categories;
CREATE POLICY "Authenticated users can add client process categories"
  ON public.client_process_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can remove client process categories"
  ON public.client_process_categories;
CREATE POLICY "Authenticated users can remove client process categories"
  ON public.client_process_categories
  FOR DELETE
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, DELETE ON public.client_process_categories TO authenticated;
GRANT ALL ON public.client_process_categories TO service_role;

COMMENT ON TABLE public.client_process_categories IS
  'Independent client classification by stage-template category; never mutates workflow stages, tasks, or payments.';

-- Preserve the classification users already see today. This is a one-time,
-- non-destructive copy inferred from template-prefixed client stages.
INSERT INTO public.client_process_categories (client_id, stage_template_id)
SELECT DISTINCT stage.client_id, template.id
FROM public.client_stages AS stage
JOIN public.stage_templates AS template
  ON stage.stage_id LIKE ('template_' || template.id::text || '_%')
ON CONFLICT (client_id, stage_template_id) DO NOTHING;
