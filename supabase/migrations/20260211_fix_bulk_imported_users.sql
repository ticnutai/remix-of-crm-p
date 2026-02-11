-- Fix bulk-imported users who could not sign in
-- Root cause: Users imported from backup on 2026-01-27 had NULL values in fields
-- that GoTrue expects to be empty strings, and missing metadata fields.
-- This caused "Database error querying schema" (500) on sign-in.

-- Step 1: Fix NULL fields that should be empty strings
UPDATE auth.users
SET
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  confirmation_token = COALESCE(confirmation_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  -- Add required fields to raw_user_meta_data
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  -- Remove extra "role" field from raw_app_meta_data (GoThe manages this internally)
  raw_app_meta_data = raw_app_meta_data - 'role'
WHERE last_sign_in_at IS NULL;

-- Step 2: Reset passwords for users who never signed in (temp password: Welcome123!)
UPDATE auth.users
SET encrypted_password = extensions.crypt('Welcome123!', extensions.gen_salt('bf'))
WHERE last_sign_in_at IS NULL;
