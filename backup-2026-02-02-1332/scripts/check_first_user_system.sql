-- First User Admin System Check
-- Verifies that the first registered user receives admin role automatically

-- 1. Check if handle_new_user function exists
SELECT 
    'handle_new_user Function' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'NOT FOUND'
    END as status
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Check if on_auth_user_created trigger exists
SELECT 
    'on_auth_user_created Trigger' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'NOT FOUND'
    END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users';

-- 3. List users ordered by creation date
SELECT 
    ROW_NUMBER() OVER (ORDER BY p.created_at) as user_number,
    p.email,
    p.full_name,
    ur.role,
    CASE 
        WHEN ur.role = 'admin' THEN 'Admin'
        WHEN ur.role = 'manager' THEN 'Manager'
        WHEN ur.role = 'employee' THEN 'Employee'
        ELSE 'Unknown'
    END as role_description,
    to_char(p.created_at, 'DD/MM/YYYY HH24:MI') as created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at ASC;

-- 4. Summary
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN ur.role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN ur.role = 'manager' THEN 1 END) as managers,
    COUNT(CASE WHEN ur.role = 'employee' THEN 1 END) as employees
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id;
