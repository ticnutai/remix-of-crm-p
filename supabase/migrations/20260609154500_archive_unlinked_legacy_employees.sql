-- ============================================================
-- Archive legacy employees that are not linked to auth/profile
-- ============================================================

UPDATE public.employees
SET
  is_active = FALSE,
  status = COALESCE(NULLIF(status, ''), 'legacy_unlinked')
WHERE user_id IS NULL
  AND profile_id IS NULL
  AND COALESCE(is_active, TRUE) = TRUE;
