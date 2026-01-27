-- Check if the handle_new_user function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND trigger_name = 'on_auth_user_created';

-- Check current user count and their roles
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at ASC;
