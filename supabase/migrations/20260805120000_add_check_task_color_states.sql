ALTER TABLE public.client_stage_tasks
  ADD COLUMN IF NOT EXISTS check_states jsonb NOT NULL DEFAULT '[{"color":"#10b981","filled":false,"label":"מצב התחלתי"},{"color":"#dc2626","filled":true,"label":"מסומן"}]'::jsonb,
  ADD COLUMN IF NOT EXISTS check_state_index integer NOT NULL DEFAULT 0;

UPDATE public.client_stage_tasks
SET check_state_index = CASE WHEN check_marked THEN 1 ELSE 0 END
WHERE task_type = 'check' AND check_state_index = 0 AND check_marked = true;

ALTER TABLE public.stage_template_tasks
  ADD COLUMN IF NOT EXISTS check_states jsonb NOT NULL DEFAULT '[{"color":"#10b981","filled":false,"label":"מצב התחלתי"},{"color":"#dc2626","filled":true,"label":"מסומן"}]'::jsonb;
