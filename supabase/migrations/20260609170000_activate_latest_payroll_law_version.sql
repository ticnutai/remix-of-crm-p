DO $$
DECLARE
  v_target_id uuid;
BEGIN
  SELECT id INTO v_target_id
  FROM public.payroll_law_versions
  WHERE is_active = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No inactive payroll law version found for activation';
  END IF;

  UPDATE public.payroll_law_versions
  SET is_active = false
  WHERE is_active = true;

  UPDATE public.payroll_law_versions
  SET
    is_active = true,
    approved_at = now(),
    approved_by = auth.uid()
  WHERE id = v_target_id;
END;
$$;
