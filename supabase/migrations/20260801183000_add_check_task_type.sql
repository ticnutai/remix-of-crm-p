-- Add a third stage row type: a reversible visual check that never completes a task.
ALTER TABLE public.client_stage_tasks
  ADD COLUMN IF NOT EXISTS check_marked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.client_stage_tasks
  DROP CONSTRAINT IF EXISTS client_stage_tasks_task_type_check;

ALTER TABLE public.client_stage_tasks
  ADD CONSTRAINT client_stage_tasks_task_type_check
  CHECK (task_type IN ('task', 'timer_tab', 'check'));

ALTER TABLE public.stage_template_tasks
  DROP CONSTRAINT IF EXISTS stage_template_tasks_task_type_check;

ALTER TABLE public.stage_template_tasks
  ADD CONSTRAINT stage_template_tasks_task_type_check
  CHECK (task_type IN ('task', 'timer_tab', 'check'));

COMMENT ON COLUMN public.client_stage_tasks.check_marked IS
  'Visual red/green state for check rows; independent of task completion.';

COMMENT ON COLUMN public.client_stage_tasks.task_type IS
  'Stage row type: regular task, one-click timer tab, or reversible visual check.';

COMMENT ON COLUMN public.stage_template_tasks.task_type IS
  'Template stage row type: regular task, one-click timer tab, or reversible visual check.';
