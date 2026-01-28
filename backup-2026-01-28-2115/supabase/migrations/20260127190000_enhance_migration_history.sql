-- Enhance get_migration_history to include sql_content and more details
CREATE OR REPLACE FUNCTION public.get_migration_history()
RETURNS TABLE (
  id UUID,
  name TEXT,
  executed_at TIMESTAMPTZ,
  success BOOLEAN,
  error TEXT,
  sql_content TEXT,
  result_message TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, 
    name, 
    executed_at, 
    success, 
    error,
    sql_content,
    NULL::TEXT as result_message  -- Placeholder for future use
  FROM public.migration_logs
  ORDER BY executed_at DESC
  LIMIT 50;
$$;
