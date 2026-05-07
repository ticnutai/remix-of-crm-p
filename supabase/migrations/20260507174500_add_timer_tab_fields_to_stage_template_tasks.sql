-- Add timer-tab structure fields to template tasks.
-- This allows templates to preserve "timer tab" behavior with preset days.

ALTER TABLE public.stage_template_tasks
ADD COLUMN IF NOT EXISTS task_type TEXT;

ALTER TABLE public.stage_template_tasks
ADD COLUMN IF NOT EXISTS auto_timer_days INTEGER;

-- Ensure defaults and nullability stay consistent even if column existed before.
ALTER TABLE public.stage_template_tasks
ALTER COLUMN task_type SET DEFAULT 'task';

UPDATE public.stage_template_tasks
SET task_type = 'task'
WHERE task_type IS NULL;

ALTER TABLE public.stage_template_tasks
ALTER COLUMN task_type SET NOT NULL;

-- Normalize invalid values from legacy/manual inserts.
UPDATE public.stage_template_tasks
SET task_type = 'task'
WHERE task_type NOT IN ('task', 'timer_tab');

UPDATE public.stage_template_tasks
SET auto_timer_days = NULL
WHERE auto_timer_days IS NOT NULL AND auto_timer_days <= 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stage_template_tasks_task_type_check'
  ) THEN
    ALTER TABLE public.stage_template_tasks
    ADD CONSTRAINT stage_template_tasks_task_type_check
    CHECK (task_type IN ('task', 'timer_tab'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stage_template_tasks_auto_timer_days_check'
  ) THEN
    ALTER TABLE public.stage_template_tasks
    ADD CONSTRAINT stage_template_tasks_auto_timer_days_check
    CHECK (auto_timer_days IS NULL OR auto_timer_days > 0);
  END IF;
END $$;

COMMENT ON COLUMN public.stage_template_tasks.task_type IS 'Template task type: regular task or one-click timer tab';
COMMENT ON COLUMN public.stage_template_tasks.auto_timer_days IS 'Preset working days used by timer-tab tasks when activated';

CREATE INDEX IF NOT EXISTS idx_stage_template_tasks_task_type
ON public.stage_template_tasks(task_type);
