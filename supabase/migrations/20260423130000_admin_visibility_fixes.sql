-- Admin visibility fixes:
-- 1. Add is_private to reminders (consistent with tasks & meetings).
--    Default false → existing reminders are non-private and visible to admins.
-- 2. Update reminders SELECT RLS to let admins/managers see non-private reminders.
-- 3. Fix tasks SELECT policy — add missing is_private guard (guard against
--    stale policy that may have survived from the initial migration dump).
-- 4. Fix meetings SELECT policy — same guard.
-- Note: meetings and tasks hooks already had their client-side user filters removed
--       in the application layer; the DB policies are the authoritative gate.

-- ── 1. is_private column on reminders ───────────────────────────────────────
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reminders_is_private ON public.reminders (is_private);

-- ── 2. Reminders SELECT — allow admins/managers to see non-private rows ──────
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
CREATE POLICY "Users can view their own reminders"
  ON public.reminders FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

-- ── 3. Tasks SELECT — idempotent re-apply with is_private guard ─────────────
DROP POLICY IF EXISTS "Users can view tasks they created or are assigned to" ON public.tasks;
CREATE POLICY "Users can view tasks they created or are assigned to"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = assigned_to
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

-- Tasks UPDATE — idempotent re-apply with is_private guard
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON public.tasks;
CREATE POLICY "Users can update tasks they created or are assigned to"
  ON public.tasks FOR UPDATE
  USING (
    auth.uid() = created_by
    OR auth.uid() = assigned_to
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

-- Tasks DELETE — idempotent re-apply with is_private guard
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (
    auth.uid() = created_by
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

-- ── 4. Meetings SELECT — idempotent re-apply with is_private guard ──────────
DROP POLICY IF EXISTS "Users can view meetings they created or are invited to" ON public.meetings;
CREATE POLICY "Users can view meetings they created or are invited to"
  ON public.meetings FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = ANY (attendees)
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

-- Meetings UPDATE — idempotent re-apply with is_private guard
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
CREATE POLICY "Users can update their own meetings"
  ON public.meetings FOR UPDATE
  USING (
    auth.uid() = created_by
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );

-- Meetings DELETE — idempotent re-apply with is_private guard
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;
CREATE POLICY "Users can delete their own meetings"
  ON public.meetings FOR DELETE
  USING (
    auth.uid() = created_by
    OR (is_private = false AND public.is_admin_or_manager(auth.uid()))
  );
