-- Update execute_safe_migration to automatically remove transaction commands
CREATE OR REPLACE FUNCTION public.execute_safe_migration(
  p_migration_name TEXT, 
  p_migration_sql TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
  v_clean_sql TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Only admins can run migrations';
  END IF;
  
  -- Clean transaction commands from SQL
  v_clean_sql := p_migration_sql;
  v_clean_sql := regexp_replace(v_clean_sql, '\mBEGIN\s*;', '', 'gi');
  v_clean_sql := regexp_replace(v_clean_sql, '\mCOMMIT\s*;', '', 'gi');
  v_clean_sql := regexp_replace(v_clean_sql, '\mROLLBACK\s*;', '', 'gi');
  v_clean_sql := regexp_replace(v_clean_sql, '\mSTART\s+TRANSACTION\s*;', '', 'gi');
  v_clean_sql := regexp_replace(v_clean_sql, '\mEND\s*;', '', 'gi');
  
  EXECUTE v_clean_sql;
  
  INSERT INTO public.migration_logs (name, sql_content, executed_at, success, executed_by)
  VALUES (p_migration_name, p_migration_sql, now(), true, v_user_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'name', p_migration_name,
    'message', 'Migration executed successfully (transaction commands were auto-removed)'
  );
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.migration_logs (name, sql_content, executed_at, success, error, executed_by)
  VALUES (p_migration_name, p_migration_sql, now(), false, SQLERRM, v_user_id);
  
  RETURN jsonb_build_object(
    'success', false, 
    'name', p_migration_name,
    'error', SQLERRM
  );
END;
$$;