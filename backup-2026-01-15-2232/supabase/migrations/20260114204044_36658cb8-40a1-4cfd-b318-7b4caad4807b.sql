-- Create migration logs table
CREATE TABLE public.migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sql_content TEXT,
  executed_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false,
  error TEXT,
  executed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.migration_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view migration logs
CREATE POLICY "Admins can view migration logs"
ON public.migration_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Only admins can insert migration logs
CREATE POLICY "Admins can insert migration logs"
ON public.migration_logs
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Create the secure migration execution function
CREATE OR REPLACE FUNCTION public.execute_safe_migration(
  p_migration_name TEXT,
  p_migration_sql TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Only admins can run migrations
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Only admins can run migrations';
  END IF;
  
  -- Execute the SQL
  EXECUTE p_migration_sql;
  
  -- Log success
  INSERT INTO public.migration_logs (name, sql_content, executed_at, success, executed_by)
  VALUES (p_migration_name, p_migration_sql, now(), true, v_user_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'name', p_migration_name,
    'message', 'Migration executed successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log failure
  INSERT INTO public.migration_logs (name, sql_content, executed_at, success, error, executed_by)
  VALUES (p_migration_name, p_migration_sql, now(), false, SQLERRM, v_user_id);
  
  RETURN jsonb_build_object(
    'success', false, 
    'name', p_migration_name,
    'error', SQLERRM
  );
END;
$$;

-- Create function to get migration history
CREATE OR REPLACE FUNCTION public.get_migration_history()
RETURNS TABLE (
  id UUID,
  name TEXT,
  executed_at TIMESTAMPTZ,
  success BOOLEAN,
  error TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, executed_at, success, error
  FROM public.migration_logs
  ORDER BY executed_at DESC
  LIMIT 50;
$$;