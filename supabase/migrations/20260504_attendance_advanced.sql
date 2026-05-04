-- ============================================================================
-- Attendance: advanced features (manual entry, day types, approval, lock, audit)
-- ============================================================================

-- 1) Extra columns on attendance_records
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS day_type text NOT NULL DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_entry boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS work_date date;

-- Backfill work_date from clock_in
UPDATE public.attendance_records
SET work_date = (clock_in AT TIME ZONE 'Asia/Jerusalem')::date
WHERE work_date IS NULL AND clock_in IS NOT NULL;

-- Index for fast monthly lookups
CREATE INDEX IF NOT EXISTS idx_attendance_user_workdate
  ON public.attendance_records(user_id, work_date);

-- Constraint values for day_type
DO $$ BEGIN
  ALTER TABLE public.attendance_records
    ADD CONSTRAINT attendance_day_type_check
    CHECK (day_type IN ('work','vacation','sick','army','bereavement','maternity','wfh','absent','holiday'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Audit log
CREATE TABLE IF NOT EXISTS public.attendance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  action text NOT NULL,                 -- create / update / delete / approve / unapprove / lock / unlock
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_user ON public.attendance_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_record ON public.attendance_audit_log(record_id);

ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_read_self_or_manager" ON public.attendance_audit_log;
CREATE POLICY "audit_read_self_or_manager" ON public.attendance_audit_log
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_attendance_manager()
  );

DROP POLICY IF EXISTS "audit_insert_any" ON public.attendance_audit_log;
CREATE POLICY "audit_insert_any" ON public.attendance_audit_log
  FOR INSERT WITH CHECK (changed_by = auth.uid());

-- 3) Trigger: auto-fill work_date and prevent edits to locked rows
CREATE OR REPLACE FUNCTION public.attendance_set_workdate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.work_date IS NULL AND NEW.clock_in IS NOT NULL THEN
    NEW.work_date := (NEW.clock_in AT TIME ZONE 'Asia/Jerusalem')::date;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_attendance_set_workdate ON public.attendance_records;
CREATE TRIGGER trg_attendance_set_workdate
  BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.attendance_set_workdate();

CREATE OR REPLACE FUNCTION public.attendance_block_locked()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.locked = true AND NEW.locked = true)
     AND NOT public.is_attendance_manager() THEN
    RAISE EXCEPTION 'Record is locked';
  END IF;
  IF (TG_OP = 'DELETE' AND OLD.locked = true)
     AND NOT public.is_attendance_manager() THEN
    RAISE EXCEPTION 'Record is locked';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_attendance_block_locked_upd ON public.attendance_records;
CREATE TRIGGER trg_attendance_block_locked_upd
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.attendance_block_locked();

DROP TRIGGER IF EXISTS trg_attendance_block_locked_del ON public.attendance_records;
CREATE TRIGGER trg_attendance_block_locked_del
  BEFORE DELETE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.attendance_block_locked();

-- 4) Audit trigger
CREATE OR REPLACE FUNCTION public.attendance_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_action text;
  v_old jsonb;
  v_new jsonb;
  v_uid uuid;
  v_actor uuid;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_uid := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_uid := NEW.user_id;
    IF OLD.approved_at IS NULL AND NEW.approved_at IS NOT NULL THEN
      v_action := 'approve';
    ELSIF OLD.approved_at IS NOT NULL AND NEW.approved_at IS NULL THEN
      v_action := 'unapprove';
    ELSIF OLD.locked = false AND NEW.locked = true THEN
      v_action := 'lock';
    ELSIF OLD.locked = true AND NEW.locked = false THEN
      v_action := 'unlock';
    ELSE
      v_action := 'update';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_uid := OLD.user_id;
  END IF;

  INSERT INTO public.attendance_audit_log (record_id, user_id, changed_by, action, old_data, new_data)
  VALUES (COALESCE(NEW.id, OLD.id), v_uid, v_actor, v_action, v_old, v_new);

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_attendance_audit ON public.attendance_records;
CREATE TRIGGER trg_attendance_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.attendance_audit_trigger();

-- 5) Helper: lock entire month for a user (manager only)
CREATE OR REPLACE FUNCTION public.attendance_lock_month(p_user_id uuid, p_year int, p_month int, p_lock boolean)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count int;
BEGIN
  IF NOT public.is_attendance_manager() THEN
    RAISE EXCEPTION 'Manager only';
  END IF;
  UPDATE public.attendance_records
     SET locked = p_lock
   WHERE user_id = p_user_id
     AND work_date >= make_date(p_year, p_month, 1)
     AND work_date <  (make_date(p_year, p_month, 1) + interval '1 month')::date;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION public.attendance_lock_month(uuid,int,int,boolean) TO authenticated;
