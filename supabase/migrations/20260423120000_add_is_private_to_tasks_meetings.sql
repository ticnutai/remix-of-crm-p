-- Add `is_private` flag to tasks and meetings.
-- When `is_private = true`, only the row creator (or assignee, where applicable)
-- can see / update / delete the row — admins and managers are NOT permitted.
-- This implements the "private item" feature in Quick Add Task / Quick Add Meeting dialogs.

-- ── Columns ─────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- Helpful indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_tasks_is_private    ON public.tasks    (is_private);
CREATE INDEX IF NOT EXISTS idx_meetings_is_private ON public.meetings (is_private);

-- ── RLS policies: tasks ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view tasks they created or are assigned to" ON public.tasks;
CREATE POLICY "Users can view tasks they created or are assigned to"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = assigned_to
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON public.tasks;
CREATE POLICY "Users can update tasks they created or are assigned to"
  ON public.tasks FOR UPDATE
  USING (
    auth.uid() = created_by
    OR auth.uid() = assigned_to
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (
    auth.uid() = created_by
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

-- ── RLS policies: meetings ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view meetings they created or are invited to" ON public.meetings;
CREATE POLICY "Users can view meetings they created or are invited to"
  ON public.meetings FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = ANY (attendees)
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
CREATE POLICY "Users can update their own meetings"
  ON public.meetings FOR UPDATE
  USING (
    auth.uid() = created_by
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;
CREATE POLICY "Users can delete their own meetings"
  ON public.meetings FOR DELETE
  USING (
    auth.uid() = created_by
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );
