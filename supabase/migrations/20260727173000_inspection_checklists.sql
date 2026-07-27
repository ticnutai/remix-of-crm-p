-- Operational inspection checklists: reusable templates and auditable runs.

CREATE TABLE IF NOT EXISTS public.inspection_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'clipboard-check',
  color TEXT NOT NULL DEFAULT '#d4a72c',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_form_template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.inspection_form_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT,
  position INTEGER NOT NULL CHECK (position >= 0),
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, position)
);

CREATE TABLE IF NOT EXISTS public.inspection_form_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.inspection_form_templates(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'clipboard-check',
  color TEXT NOT NULL DEFAULT '#d4a72c',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'archived')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_form_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.inspection_form_runs(id) ON DELETE CASCADE,
  template_step_id UUID REFERENCES public.inspection_form_template_steps(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL CHECK (position >= 0),
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, position)
);

CREATE INDEX IF NOT EXISTS idx_inspection_templates_active
  ON public.inspection_form_templates(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_template_steps_order
  ON public.inspection_form_template_steps(template_id, position);
CREATE INDEX IF NOT EXISTS idx_inspection_runs_status_pinned
  ON public.inspection_form_runs(status, is_pinned DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_run_steps_order
  ON public.inspection_form_run_steps(run_id, position);

ALTER TABLE public.inspection_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_form_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_form_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_form_run_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users manage inspection templates"
  ON public.inspection_form_templates;
CREATE POLICY "Authenticated users manage inspection templates"
  ON public.inspection_form_templates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users manage inspection template steps"
  ON public.inspection_form_template_steps;
CREATE POLICY "Authenticated users manage inspection template steps"
  ON public.inspection_form_template_steps
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users manage inspection runs"
  ON public.inspection_form_runs;
CREATE POLICY "Authenticated users manage inspection runs"
  ON public.inspection_form_runs
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users manage inspection run steps"
  ON public.inspection_form_run_steps;
CREATE POLICY "Authenticated users manage inspection run steps"
  ON public.inspection_form_run_steps
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_inspection_form_templates_updated_at
  ON public.inspection_form_templates;
CREATE TRIGGER update_inspection_form_templates_updated_at
BEFORE UPDATE ON public.inspection_form_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspection_form_runs_updated_at
  ON public.inspection_form_runs;
CREATE TRIGGER update_inspection_form_runs_updated_at
BEFORE UPDATE ON public.inspection_form_runs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.start_inspection_form(p_template_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_template public.inspection_form_templates%ROWTYPE;
  v_run_id UUID;
BEGIN
  SELECT *
  INTO v_template
  FROM public.inspection_form_templates
  WHERE id = p_template_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspection form template was not found or is inactive';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.inspection_form_template_steps
    WHERE template_id = p_template_id
  ) THEN
    RAISE EXCEPTION 'Inspection form template has no steps';
  END IF;

  INSERT INTO public.inspection_form_runs (
    template_id,
    template_name,
    description,
    icon_name,
    color,
    created_by
  )
  VALUES (
    v_template.id,
    v_template.name,
    v_template.description,
    v_template.icon_name,
    v_template.color,
    auth.uid()
  )
  RETURNING id INTO v_run_id;

  INSERT INTO public.inspection_form_run_steps (
    run_id,
    template_step_id,
    title,
    description,
    position,
    is_required
  )
  SELECT
    v_run_id,
    id,
    title,
    description,
    position,
    is_required
  FROM public.inspection_form_template_steps
  WHERE template_id = p_template_id
  ORDER BY position;

  RETURN v_run_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_inspection_step_completion(
  p_step_id UUID,
  p_completed BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_step public.inspection_form_run_steps%ROWTYPE;
  v_has_blocking_step BOOLEAN;
  v_all_completed BOOLEAN;
BEGIN
  SELECT *
  INTO v_step
  FROM public.inspection_form_run_steps
  WHERE id = p_step_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspection step was not found';
  END IF;

  IF p_completed THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.inspection_form_run_steps
      WHERE run_id = v_step.run_id
        AND position < v_step.position
        AND is_required = true
        AND is_completed = false
    )
    INTO v_has_blocking_step;

    IF v_has_blocking_step THEN
      RAISE EXCEPTION 'Complete the previous required steps first';
    END IF;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.inspection_form_run_steps
      WHERE run_id = v_step.run_id
        AND position > v_step.position
        AND is_completed = true
    )
    INTO v_has_blocking_step;

    IF v_has_blocking_step THEN
      RAISE EXCEPTION 'Reopen later completed steps first';
    END IF;
  END IF;

  UPDATE public.inspection_form_run_steps
  SET
    is_completed = p_completed,
    completed_by = CASE WHEN p_completed THEN auth.uid() ELSE NULL END,
    completed_at = CASE WHEN p_completed THEN now() ELSE NULL END
  WHERE id = p_step_id;

  SELECT NOT EXISTS (
    SELECT 1
    FROM public.inspection_form_run_steps
    WHERE run_id = v_step.run_id
      AND is_required = true
      AND is_completed = false
  )
  INTO v_all_completed;

  UPDATE public.inspection_form_runs
  SET
    status = CASE WHEN v_all_completed THEN 'completed' ELSE 'in_progress' END,
    completed_at = CASE WHEN v_all_completed THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = v_step.run_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_inspection_form(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_inspection_step_completion(UUID, BOOLEAN)
  TO authenticated;
