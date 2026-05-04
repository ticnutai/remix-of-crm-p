-- ============================================================
-- Attendance / Clock-in System
-- Each employee clocks in & out by their authenticated user_id.
-- Admins/managers can view and edit all records and produce
-- summary + monthly reports.
-- ============================================================

-- 1) Main attendance records (one row per clock-in / clock-out cycle)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  -- total minutes, computed when clock_out is set (excludes break_minutes)
  duration_minutes INTEGER,
  -- minutes spent on breaks within this shift
  break_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  -- mark when record was edited manually (by user or admin)
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMPTZ,
  -- optional location captured at clock-in
  location_lat NUMERIC,
  location_lng NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_user      ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_clock_in  ON public.attendance_records(clock_in);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance_records(user_id, clock_in);

-- Only ONE open shift per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_one_open_per_user
  ON public.attendance_records(user_id) WHERE clock_out IS NULL;

-- 2) Breaks taken inside a shift
CREATE TABLE IF NOT EXISTS public.attendance_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  break_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  break_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_breaks_record ON public.attendance_breaks(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_breaks_user   ON public.attendance_breaks(user_id);

-- ============================================================
-- Triggers
-- ============================================================

-- updated_at trigger for attendance_records
CREATE OR REPLACE FUNCTION public.attendance_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Auto-compute duration when clock_out present
  IF NEW.clock_out IS NOT NULL AND NEW.clock_in IS NOT NULL THEN
    NEW.duration_minutes := GREATEST(
      0,
      CAST(EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60 AS INTEGER) - COALESCE(NEW.break_minutes, 0)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_set_updated_at ON public.attendance_records;
CREATE TRIGGER trg_attendance_set_updated_at
  BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.attendance_set_updated_at();

-- When a break ends, compute its duration AND increment parent's break_minutes
CREATE OR REPLACE FUNCTION public.attendance_break_end()
RETURNS TRIGGER AS $$
DECLARE
  added_minutes INTEGER;
BEGIN
  IF NEW.break_end IS NOT NULL AND NEW.break_start IS NOT NULL THEN
    NEW.duration_minutes := GREATEST(
      0,
      CAST(EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 60 AS INTEGER)
    );

    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.break_end IS NULL) THEN
      added_minutes := NEW.duration_minutes;
      UPDATE public.attendance_records
        SET break_minutes = COALESCE(break_minutes, 0) + COALESCE(added_minutes, 0)
        WHERE id = NEW.attendance_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_break_end ON public.attendance_breaks;
CREATE TRIGGER trg_attendance_break_end
  BEFORE INSERT OR UPDATE ON public.attendance_breaks
  FOR EACH ROW EXECUTE FUNCTION public.attendance_break_end();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_breaks  ENABLE ROW LEVEL SECURITY;

-- helper: is current user admin/manager?
CREATE OR REPLACE FUNCTION public.is_attendance_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin','super_manager','manager')
  );
$$;

-- attendance_records policies
DROP POLICY IF EXISTS "attendance_select_own_or_mgr" ON public.attendance_records;
CREATE POLICY "attendance_select_own_or_mgr" ON public.attendance_records
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_attendance_manager()
  );

DROP POLICY IF EXISTS "attendance_insert_own_or_mgr" ON public.attendance_records;
CREATE POLICY "attendance_insert_own_or_mgr" ON public.attendance_records
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR public.is_attendance_manager()
  );

DROP POLICY IF EXISTS "attendance_update_own_or_mgr" ON public.attendance_records;
CREATE POLICY "attendance_update_own_or_mgr" ON public.attendance_records
  FOR UPDATE USING (
    user_id = auth.uid() OR public.is_attendance_manager()
  );

DROP POLICY IF EXISTS "attendance_delete_mgr" ON public.attendance_records;
CREATE POLICY "attendance_delete_mgr" ON public.attendance_records
  FOR DELETE USING ( public.is_attendance_manager() );

-- attendance_breaks policies (mirror)
DROP POLICY IF EXISTS "att_break_select" ON public.attendance_breaks;
CREATE POLICY "att_break_select" ON public.attendance_breaks
  FOR SELECT USING ( user_id = auth.uid() OR public.is_attendance_manager() );

DROP POLICY IF EXISTS "att_break_insert" ON public.attendance_breaks;
CREATE POLICY "att_break_insert" ON public.attendance_breaks
  FOR INSERT WITH CHECK ( user_id = auth.uid() OR public.is_attendance_manager() );

DROP POLICY IF EXISTS "att_break_update" ON public.attendance_breaks;
CREATE POLICY "att_break_update" ON public.attendance_breaks
  FOR UPDATE USING ( user_id = auth.uid() OR public.is_attendance_manager() );

DROP POLICY IF EXISTS "att_break_delete" ON public.attendance_breaks;
CREATE POLICY "att_break_delete" ON public.attendance_breaks
  FOR DELETE USING ( user_id = auth.uid() OR public.is_attendance_manager() );

-- ============================================================
-- Aggregated view: monthly summary per user
-- ============================================================
CREATE OR REPLACE VIEW public.attendance_monthly_summary AS
SELECT
  ar.user_id,
  date_trunc('month', ar.clock_in)::date AS month,
  COUNT(*) FILTER (WHERE ar.clock_out IS NOT NULL) AS shifts_count,
  COALESCE(SUM(ar.duration_minutes), 0) AS total_minutes,
  COALESCE(SUM(ar.break_minutes), 0)    AS total_break_minutes,
  COALESCE(SUM(
    GREATEST(0, COALESCE(ar.duration_minutes, 0) - 510) -- minutes above 8.5h/day
  ), 0) AS overtime_minutes
FROM public.attendance_records ar
WHERE ar.clock_out IS NOT NULL
GROUP BY ar.user_id, date_trunc('month', ar.clock_in);

-- Done.
