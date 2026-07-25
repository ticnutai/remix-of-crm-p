-- Saved quotes can become shared operational records once they are linked to a
-- client contract. Contracts are visible to staff, so their source quote must
-- follow the same access model or the "Open in Flow V2" link becomes unusable
-- for everyone except the original creator.

DROP POLICY IF EXISTS "Staff can view all saved quotes"
  ON public.saved_quotes;

CREATE POLICY "Staff can view all saved quotes"
  ON public.saved_quotes
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_manager(auth.uid())
    OR public.has_role(auth.uid(), 'employee'::public.app_role)
  );

DROP POLICY IF EXISTS "Staff can update all saved quotes"
  ON public.saved_quotes;

CREATE POLICY "Staff can update all saved quotes"
  ON public.saved_quotes
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_manager(auth.uid())
    OR public.has_role(auth.uid(), 'employee'::public.app_role)
  )
  WITH CHECK (
    public.is_admin_or_manager(auth.uid())
    OR public.has_role(auth.uid(), 'employee'::public.app_role)
  );
