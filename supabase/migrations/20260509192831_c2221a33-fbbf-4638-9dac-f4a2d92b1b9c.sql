-- Remove overly permissive policies and clean duplicates
DROP POLICY IF EXISTS "Anyone can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can manage reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;

-- Allow admins/managers to update or delete reminders (e.g. reassign user_id)
DROP POLICY IF EXISTS "Admins can update any reminder" ON public.reminders;
CREATE POLICY "Admins can update any reminder"
  ON public.reminders FOR UPDATE
  USING (public.is_admin_or_manager(auth.uid()) AND (is_private = false));

DROP POLICY IF EXISTS "Admins can delete any reminder" ON public.reminders;
CREATE POLICY "Admins can delete any reminder"
  ON public.reminders FOR DELETE
  USING (public.is_admin_or_manager(auth.uid()) AND (is_private = false));