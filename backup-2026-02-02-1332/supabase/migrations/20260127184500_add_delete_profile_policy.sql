-- Add DELETE policy for profiles table
-- Allows admins to delete any profile (except their own)

-- First, drop the policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create DELETE policy for admins
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND id != auth.uid()  -- Prevent self-deletion
);

-- Also add DELETE policy for user_roles (admins can delete any role)
DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;

CREATE POLICY "Admins can delete user_roles" 
ON public.user_roles 
FOR DELETE 
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);
