-- 1) Committee questions board per client folder (e.g. "שינוי תב״ע", "היתר בניה").
--    Each folder in the client page shows a board of questions for the
--    planning committee, with the committee's answer, a status and attached
--    files (stored in the public "client-files" bucket; metadata kept here).
-- 2) Time entries get an optional topic: the client folder the time was spent on.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS public.client_folder_committee_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.client_folders(id) ON DELETE CASCADE,
  question text NOT NULL DEFAULT '',
  answer text,
  status text NOT NULL DEFAULT 'open',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_folder_committee_questions
  DROP CONSTRAINT IF EXISTS client_folder_committee_questions_status_check;
ALTER TABLE public.client_folder_committee_questions
  ADD CONSTRAINT client_folder_committee_questions_status_check
  CHECK (status IN ('open', 'answered'));

CREATE INDEX IF NOT EXISTS idx_committee_questions_folder
  ON public.client_folder_committee_questions(folder_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_committee_questions_client
  ON public.client_folder_committee_questions(client_id);

CREATE OR REPLACE FUNCTION public.touch_committee_question_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_committee_questions_updated_at ON public.client_folder_committee_questions;
CREATE TRIGGER trg_committee_questions_updated_at
  BEFORE UPDATE ON public.client_folder_committee_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_committee_question_updated_at();

ALTER TABLE public.client_folder_committee_questions ENABLE ROW LEVEL SECURITY;

-- Office staff only (admins, managers, employees) - not client-portal users.
DROP POLICY IF EXISTS "Staff can view committee questions" ON public.client_folder_committee_questions;
CREATE POLICY "Staff can view committee questions" ON public.client_folder_committee_questions
  FOR SELECT TO authenticated
  USING (public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::app_role));

DROP POLICY IF EXISTS "Staff can add committee questions" ON public.client_folder_committee_questions;
CREATE POLICY "Staff can add committee questions" ON public.client_folder_committee_questions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::app_role));

DROP POLICY IF EXISTS "Staff can update committee questions" ON public.client_folder_committee_questions;
CREATE POLICY "Staff can update committee questions" ON public.client_folder_committee_questions
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::app_role));

DROP POLICY IF EXISTS "Staff can delete committee questions" ON public.client_folder_committee_questions;
CREATE POLICY "Staff can delete committee questions" ON public.client_folder_committee_questions
  FOR DELETE TO authenticated
  USING (public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'employee'::app_role));

-- Time entry topic
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.client_folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_folder_id ON public.time_entries(folder_id);
COMMENT ON COLUMN public.time_entries.folder_id IS 'Topic of the time entry: the client folder (e.g. שינוי תב״ע) the time was spent on';
