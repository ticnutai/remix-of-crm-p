-- Hierarchical folders for organizing reusable inspection form templates.

CREATE TABLE IF NOT EXISTS public.inspection_form_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  parent_id UUID REFERENCES public.inspection_form_folders(id) ON DELETE SET NULL,
  color TEXT NOT NULL DEFAULT '#d4a72c',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

ALTER TABLE public.inspection_form_templates
  ADD COLUMN IF NOT EXISTS folder_id UUID
  REFERENCES public.inspection_form_folders(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inspection_form_folders_parent
  ON public.inspection_form_folders(parent_id, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_inspection_form_templates_folder
  ON public.inspection_form_templates(folder_id)
  WHERE folder_id IS NOT NULL;

ALTER TABLE public.inspection_form_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users manage inspection folders"
  ON public.inspection_form_folders;
CREATE POLICY "Authenticated users manage inspection folders"
  ON public.inspection_form_folders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_inspection_form_folders_updated_at
  ON public.inspection_form_folders;
CREATE TRIGGER update_inspection_form_folders_updated_at
BEFORE UPDATE ON public.inspection_form_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
