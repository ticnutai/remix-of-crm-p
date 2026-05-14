-- Fix mali's profile: set approved + active, ensure admin role
UPDATE public.profiles
SET approval_status = 'approved',
    is_active = true,
    approved_at = COALESCE(approved_at, now())
WHERE email IN ('mali.f.arch2@gmail.com', 'mali.f.arch@gmail.com')
  AND approval_status != 'approved';

-- Ensure mali.f.arch2 has admin role (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE p.email = 'mali.f.arch2@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'admin'
  );
