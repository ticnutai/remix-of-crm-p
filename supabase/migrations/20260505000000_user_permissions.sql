-- ============================================================
-- user_permissions: per-user, per-module access control matrix
-- Modules map to sidebar sections. Admins manage via UI.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module        TEXT NOT NULL,            -- e.g. 'clients', 'employees'
  can_view      BOOLEAN NOT NULL DEFAULT false,
  can_edit      BOOLEAN NOT NULL DEFAULT false,
  can_delete    BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    UUID REFERENCES profiles(id),
  UNIQUE (user_id, module)
);

-- Keep updated_at fresh on every write
CREATE OR REPLACE FUNCTION touch_user_permissions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_permissions_updated_at
BEFORE UPDATE ON user_permissions
FOR EACH ROW EXECUTE FUNCTION touch_user_permissions();

-- ---- RLS ----
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Admins / super-managers: full read-write
CREATE POLICY "perm_admin_all" ON user_permissions
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_manager')
    )
  );

-- Every authenticated user may read their own permissions
CREATE POLICY "perm_user_read_own" ON user_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- ---- Helper: upsert entire user permission set ----
-- Called from application code via RPC so normal users
-- cannot call it (SECURITY DEFINER runs as table owner).
CREATE OR REPLACE FUNCTION set_user_module_permission(
  p_user_id  UUID,
  p_module   TEXT,
  p_view     BOOLEAN,
  p_edit     BOOLEAN,
  p_delete   BOOLEAN,
  p_by       UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only admins may call this
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_manager')
  ) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_delete, updated_by)
  VALUES (p_user_id, p_module, p_view, p_edit, p_delete, p_by)
  ON CONFLICT (user_id, module)
  DO UPDATE SET
    can_view   = EXCLUDED.can_view,
    can_edit   = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    updated_by = EXCLUDED.updated_by;
END;
$$;
