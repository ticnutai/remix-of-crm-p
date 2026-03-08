-- Fix execute_safe_migration - using SQL language instead of plpgsql
-- This version doesn't use END; at all, so it can run even with the broken version

DROP FUNCTION IF EXISTS public.execute_safe_migration(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.execute_safe_migration_v2(
  p_migration_name TEXT, 
  p_migration_sql TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $BODY$
DECLARE
  v_user_id UUID := auth.uid();
  v_clean_sql TEXT;
BEGIN
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Only admins can run migrations'
    ;
  END IF
  ;
  
  v_clean_sql := regexp_replace(p_migration_sql, '^\s*BEGIN\s*;', '', 'gim')
  ;
  v_clean_sql := regexp_replace(v_clean_sql, '^\s*COMMIT\s*;', '', 'gim')
  ;
  v_clean_sql := regexp_replace(v_clean_sql, '^\s*ROLLBACK\s*;', '', 'gim')
  ;
  v_clean_sql := regexp_replace(v_clean_sql, '^\s*START\s+TRANSACTION\s*;', '', 'gim')
  ;
  
  EXECUTE v_clean_sql
  ;
  
  INSERT INTO public.migration_logs (name, sql_content, executed_at, success, executed_by)
  VALUES (p_migration_name, p_migration_sql, now(), true, v_user_id)
  ;
  
  RETURN jsonb_build_object('success', true, 'name', p_migration_name, 'message', 'Migration executed successfully')
  ;
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.migration_logs (name, sql_content, executed_at, success, error, executed_by)
  VALUES (p_migration_name, p_migration_sql, now(), false, SQLERRM, v_user_id)
  ;
  
  RETURN jsonb_build_object('success', false, 'name', p_migration_name, 'error', SQLERRM)
  ;
END
$BODY$;

-- Now create an alias to replace the old function
CREATE OR REPLACE FUNCTION public.execute_safe_migration(
  p_migration_name TEXT, 
  p_migration_sql TEXT
) RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $BODY$
  SELECT public.execute_safe_migration_v2($1, $2);
$BODY$;

GRANT EXECUTE ON FUNCTION public.execute_safe_migration_v2(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_safe_migration(TEXT, TEXT) TO authenticated;
