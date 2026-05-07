-- Add timer tab fields to client_stage_tasks
-- These fields allow task rows to behave as one-click timer presets.

ALTER TABLE public.client_stage_tasks
ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'task';

ALTER TABLE public.client_stage_tasks
ADD COLUMN IF NOT EXISTS auto_timer_days INTEGER DEFAULT NULL;

ALTER TABLE public.client_stage_tasks
ADD CONSTRAINT client_stage_tasks_task_type_check
CHECK (task_type IN ('task', 'timer_tab'));

ALTER TABLE public.client_stage_tasks
ADD CONSTRAINT client_stage_tasks_auto_timer_days_check
CHECK (auto_timer_days IS NULL OR auto_timer_days > 0);

COMMENT ON COLUMN public.client_stage_tasks.task_type IS 'Task row type: regular task or one-click timer tab';
COMMENT ON COLUMN public.client_stage_tasks.auto_timer_days IS 'Stored working days target used when clicking a timer tab';

CREATE INDEX IF NOT EXISTS idx_client_stage_tasks_task_type
ON public.client_stage_tasks(task_type);