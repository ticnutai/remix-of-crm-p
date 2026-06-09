-- ============================================================
-- Employees source-of-truth hardening
-- - Backfill links between employees <-> profiles
-- - Seed missing employees from profiles
-- - Add safe uniqueness guarantees for user/profile linkage
-- ============================================================

-- 1) Fill missing profile_id from matching user/profile IDs
UPDATE public.employees e
SET profile_id = p.id
FROM public.profiles p
WHERE e.profile_id IS NULL
  AND e.user_id IS NOT NULL
  AND p.id = e.user_id;

-- 2) Fill missing user_id from matching profile IDs
UPDATE public.employees e
SET user_id = p.id
FROM public.profiles p
WHERE e.user_id IS NULL
  AND e.profile_id IS NOT NULL
  AND p.id = e.profile_id;

-- 2.5) Link by email when IDs are missing (avoids duplicate email rows)
UPDATE public.employees e
SET
  profile_id = COALESCE(e.profile_id, p.id),
  user_id = COALESCE(e.user_id, p.id),
  name = COALESCE(NULLIF(TRIM(e.name), ''), NULLIF(TRIM(p.full_name), ''), p.email, e.name),
  phone = COALESCE(e.phone, p.phone),
  department = COALESCE(e.department, p.department),
  position = COALESCE(e.position, p.position),
  hourly_rate = COALESCE(e.hourly_rate, p.hourly_rate, 0),
  is_active = COALESCE(e.is_active, p.is_active, TRUE),
  status = COALESCE(e.status, CASE WHEN COALESCE(p.is_active, TRUE) THEN 'active' ELSE 'inactive' END)
FROM public.profiles p
WHERE e.email IS NOT NULL
  AND p.email IS NOT NULL
  AND lower(e.email) = lower(p.email)
  AND (e.profile_id IS NULL OR e.user_id IS NULL);

-- 3) Seed employees rows for profiles that do not have linked employee records
INSERT INTO public.employees (
  user_id,
  profile_id,
  name,
  email,
  phone,
  department,
  position,
  hourly_rate,
  is_active,
  status
)
SELECT
  p.id,
  p.id,
  COALESCE(NULLIF(TRIM(p.full_name), ''), p.email, 'Unknown Employee') AS name,
  p.email,
  p.phone,
  p.department,
  p.position,
  COALESCE(p.hourly_rate, 0),
  COALESCE(p.is_active, TRUE),
  CASE WHEN COALESCE(p.is_active, TRUE) THEN 'active' ELSE 'inactive' END
FROM public.profiles p
LEFT JOIN public.employees e
  ON e.profile_id = p.id OR e.user_id = p.id
WHERE e.id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.employees e2
    WHERE e2.email IS NOT NULL
      AND p.email IS NOT NULL
      AND lower(e2.email) = lower(p.email)
  );

-- 4) Create unique indexes only when data is clean (avoid migration failure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id_unique
      ON public.employees(user_id)
      WHERE user_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipped idx_employees_user_id_unique: duplicate user_id values exist in employees';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE profile_id IS NOT NULL
    GROUP BY profile_id
    HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_profile_id_unique
      ON public.employees(profile_id)
      WHERE profile_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipped idx_employees_profile_id_unique: duplicate profile_id values exist in employees';
  END IF;
END $$;

-- 5) Helpful lookup index for admin screens
CREATE INDEX IF NOT EXISTS idx_employees_active_name
  ON public.employees(is_active, name);
