-- ============================================================
-- user_permissions: per-user, per-module access control matrix
-- Fixed for projects that store roles in user_roles table.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module        TEXT NOT NULL,
  can_view      BOOLEAN NOT NULL DEFAULT false,
  can_edit      BOOLEAN NOT NULL DEFAULT false,
  can_delete    BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    UUID REFERENCES public.profiles(id),
  UNIQUE (user_id, module)
);

CREATE OR REPLACE FUNCTION public.touch_user_permissions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_permissions_updated_at ON public.user_permissions;
CREATE TRIGGER trg_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW EXECUTE FUNCTION public.touch_user_permissions();

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perm_admin_all" ON public.user_permissions;
CREATE POLICY "perm_admin_all" ON public.user_permissions
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_manager'::public.app_role)
  );

DROP POLICY IF EXISTS "perm_user_read_own" ON public.user_permissions;
CREATE POLICY "perm_user_read_own" ON public.user_permissions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_user_module_permission(
  p_user_id  UUID,
  p_module   TEXT,
  p_view     BOOLEAN,
  p_edit     BOOLEAN,
  p_delete   BOOLEAN,
  p_by       UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_manager'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  INSERT INTO public.user_permissions (user_id, module, can_view, can_edit, can_delete, updated_by)
  VALUES (p_user_id, p_module, p_view, p_edit, p_delete, p_by)
  ON CONFLICT (user_id, module)
  DO UPDATE SET
    can_view   = EXCLUDED.can_view,
    can_edit   = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    updated_by = EXCLUDED.updated_by;
END;
$$;
