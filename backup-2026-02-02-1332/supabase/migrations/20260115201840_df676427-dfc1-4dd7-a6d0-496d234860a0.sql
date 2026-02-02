-- Add ui_preferences column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS ui_preferences jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_preferences.ui_preferences IS 'Stores all UI preferences synced from localStorage (theme, filters, view modes, etc.)';

-- Create Employee Function - e-control CRM Pro
-- This function creates or updates an employee user with proper role and profile

CREATE OR REPLACE FUNCTION public.create_employee_user(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL,
  p_hourly_rate NUMERIC DEFAULT NULL,
  p_role public.app_role DEFAULT 'employee'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_user RECORD;
  v_is_existing BOOLEAN := FALSE;
BEGIN
  -- Check if calling user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Only administrators can add employees'
    );
  END IF;

  -- Validate email
  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Email is a required field'
    );
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- User exists
    v_is_existing := TRUE;
    
    -- Update or create profile
    INSERT INTO public.profiles (id, email, full_name, phone, is_active)
    VALUES (v_user_id, p_email, p_full_name, p_phone, TRUE)
    ON CONFLICT (id) 
    DO UPDATE SET 
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, profiles.phone),
      is_active = TRUE,
      updated_at = NOW();

    -- Upsert role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'Existing user ' || p_email || ' was successfully added as an employee',
      'user_id', v_user_id,
      'is_existing_user', TRUE
    );
  ELSE
    -- User doesn't exist - cannot create via SQL function
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User does not exist. Please create first in Authentication UI',
      'hint', 'Go to Authentication -> Users -> Invite user'
    );
  END IF;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_employee_user TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_employee_user IS 
'Creates or updates an employee user. Only admins can execute this function.';