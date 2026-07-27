-- Link regular CRM tasks to the inspection form run that created them.
-- Existing tasks remain unchanged, and deleting a run keeps the task while
-- removing only the source link.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS inspection_run_id UUID
  REFERENCES public.inspection_form_runs(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_inspection_run_id
  ON public.tasks(inspection_run_id)
  WHERE inspection_run_id IS NOT NULL;

COMMENT ON COLUMN public.tasks.inspection_run_id IS
  'Optional inspection form run from which this task was created.';
