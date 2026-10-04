-- Custom client fields are shared by the whole team.
-- Before: each user saw only the fields they created (ccfd_*_own policies), so a
-- field Mali added did not exist for anyone else even though the values live on
-- the shared clients.custom_data.
-- After: every signed-in user sees and can add fields; renaming or deleting a
-- field stays with its creator or an admin, since it affects everyone.
-- user_id is kept as "created by".

DROP POLICY IF EXISTS ccfd_select_own ON public.client_custom_field_definitions;
DROP POLICY IF EXISTS ccfd_select_all ON public.client_custom_field_definitions;
CREATE POLICY ccfd_select_all ON public.client_custom_field_definitions
  FOR SELECT TO authenticated
  USING (true);

-- Insert: unchanged — anyone signed in, recorded as the creator.
DROP POLICY IF EXISTS ccfd_insert_own ON public.client_custom_field_definitions;
CREATE POLICY ccfd_insert_own ON public.client_custom_field_definitions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ccfd_update_own ON public.client_custom_field_definitions;
DROP POLICY IF EXISTS ccfd_update_owner_or_admin ON public.client_custom_field_definitions;
CREATE POLICY ccfd_update_owner_or_admin ON public.client_custom_field_definitions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS ccfd_delete_own ON public.client_custom_field_definitions;
DROP POLICY IF EXISTS ccfd_delete_owner_or_admin ON public.client_custom_field_definitions;
CREATE POLICY ccfd_delete_owner_or_admin ON public.client_custom_field_definitions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ccfd_field_key ON public.client_custom_field_definitions(field_key);
