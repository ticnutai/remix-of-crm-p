-- Setup Admin User - e-control CRM Pro
-- This migration ensures the admin user has proper profile and role

-- Note: This assumes user jj1212t@gmail.com already exists in auth.users
-- If running in Lovable, the user should be created via the Auth UI first

-- Function to setup or update admin user profile
CREATE OR REPLACE FUNCTION setup_admin_user(user_email TEXT, user_full_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  -- If user doesn't exist, exit
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User % not found. Please create the user first via Auth UI.', user_email;
    RETURN;
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (target_user_id, user_email, user_full_name, true)
  ON CONFLICT (id) 
  DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    is_active = true;

  -- Ensure admin role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin user % setup completed', user_email;
END;
$$;

-- Execute the function to setup admin user
-- Change these values if needed
DO $$
BEGIN
  PERFORM setup_admin_user('jj1212t@gmail.com', 'מנהל המערכת');
END $$;

-- Drop the temporary function
DROP FUNCTION IF EXISTS setup_admin_user(TEXT, TEXT);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
