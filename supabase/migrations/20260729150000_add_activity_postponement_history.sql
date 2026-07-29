-- Persistent postponement history for tasks, reminders, meetings and stage tasks.
-- Additive only: existing activity data is not rewritten.

ALTER TABLE public.client_stage_tasks
  ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.activity_postponements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('task', 'reminder', 'meeting', 'client_stage_task')),
  entity_id uuid NOT NULL,
  sequence_no integer NOT NULL,
  previous_due_at timestamp with time zone,
  postponed_to timestamp with time zone NOT NULL,
  reason text NOT NULL,
  next_action text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS idx_activity_postponements_entity
  ON public.activity_postponements (entity_type, entity_id, sequence_no DESC);

ALTER TABLE public.activity_postponements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view activity postponements" ON public.activity_postponements;
CREATE POLICY "Authenticated users can view activity postponements"
  ON public.activity_postponements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create activity postponements" ON public.activity_postponements;
CREATE POLICY "Authenticated users can create activity postponements"
  ON public.activity_postponements FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "Authenticated users can update activity postponements" ON public.activity_postponements;
CREATE POLICY "Authenticated users can update activity postponements"
  ON public.activity_postponements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_activity_completed(
  p_entity_type text,
  p_entity_id uuid,
  p_completed boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  CASE p_entity_type
    WHEN 'task' THEN
      UPDATE public.tasks
      SET status = CASE WHEN p_completed THEN 'completed' ELSE 'pending' END,
          completed_at = CASE WHEN p_completed THEN now() ELSE NULL END
      WHERE id = p_entity_id;
    WHEN 'reminder' THEN
      UPDATE public.reminders
      SET is_dismissed = p_completed
      WHERE id = p_entity_id;
    WHEN 'meeting' THEN
      UPDATE public.meetings
      SET status = CASE WHEN p_completed THEN 'completed' ELSE 'scheduled' END
      WHERE id = p_entity_id;
    WHEN 'client_stage_task' THEN
      UPDATE public.client_stage_tasks
      SET completed = p_completed,
          completed_at = CASE WHEN p_completed THEN now() ELSE NULL END
      WHERE id = p_entity_id;
    ELSE
      RAISE EXCEPTION 'Unsupported activity type: %', p_entity_type;
  END CASE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity not found: % %', p_entity_type, p_entity_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.postpone_activity(
  p_entity_type text,
  p_entity_id uuid,
  p_postponed_to timestamp with time zone,
  p_reason text,
  p_next_action text DEFAULT NULL
)
RETURNS public.activity_postponements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_previous_due_at timestamp with time zone;
  v_sequence_no integer;
  v_result public.activity_postponements;
  v_duration interval;
BEGIN
  IF btrim(COALESCE(p_reason, '')) = '' THEN
    RAISE EXCEPTION 'Postponement reason is required';
  END IF;

  IF p_postponed_to IS NULL THEN
    RAISE EXCEPTION 'New due date is required';
  END IF;

  CASE p_entity_type
    WHEN 'task' THEN
      SELECT due_date INTO v_previous_due_at FROM public.tasks WHERE id = p_entity_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
      UPDATE public.tasks SET due_date = p_postponed_to WHERE id = p_entity_id;
    WHEN 'reminder' THEN
      SELECT remind_at INTO v_previous_due_at FROM public.reminders WHERE id = p_entity_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Reminder not found'; END IF;
      UPDATE public.reminders
      SET remind_at = p_postponed_to, is_sent = false, is_dismissed = false
      WHERE id = p_entity_id;
    WHEN 'meeting' THEN
      SELECT start_time, end_time - start_time
      INTO v_previous_due_at, v_duration
      FROM public.meetings WHERE id = p_entity_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Meeting not found'; END IF;
      UPDATE public.meetings
      SET start_time = p_postponed_to,
          end_time = p_postponed_to + COALESCE(v_duration, interval '1 hour')
      WHERE id = p_entity_id;
    WHEN 'client_stage_task' THEN
      SELECT due_date INTO v_previous_due_at FROM public.client_stage_tasks WHERE id = p_entity_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Stage task not found'; END IF;
      UPDATE public.client_stage_tasks SET due_date = p_postponed_to WHERE id = p_entity_id;
    ELSE
      RAISE EXCEPTION 'Unsupported activity type: %', p_entity_type;
  END CASE;

  SELECT COALESCE(MAX(sequence_no), 0) + 1
  INTO v_sequence_no
  FROM public.activity_postponements
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;

  INSERT INTO public.activity_postponements (
    entity_type,
    entity_id,
    sequence_no,
    previous_due_at,
    postponed_to,
    reason,
    next_action,
    created_by
  ) VALUES (
    p_entity_type,
    p_entity_id,
    v_sequence_no,
    v_previous_due_at,
    p_postponed_to,
    btrim(p_reason),
    NULLIF(btrim(COALESCE(p_next_action, '')), ''),
    auth.uid()
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_activity_completed(text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.postpone_activity(text, uuid, timestamp with time zone, text, text) TO authenticated;

