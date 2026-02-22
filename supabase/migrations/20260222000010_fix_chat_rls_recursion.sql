-- Fix: infinite recursion in chat_participants RLS policy
-- The policy "Users can view participants" was referencing chat_participants within itself,
-- causing "infinite recursion detected in policy for relation chat_participants".
-- Fix: use a SECURITY DEFINER function that bypasses RLS for the inner lookup.

-- 1. Create helper function (SECURITY DEFINER bypasses RLS so no recursion)
CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT conversation_id
  FROM public.chat_participants
  WHERE user_id = auth.uid();
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Users can view participants" ON public.chat_participants;

-- 3. Recreate with the security-definer function (no recursion)
CREATE POLICY "Users can view participants" ON public.chat_participants
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );

-- Also fix the same pattern in other tables that might hit the same recursion
-- via chat_participants lookup (they go through RLS too, so let's make them use the function)

DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      id IN (SELECT public.get_my_conversation_ids())
    )
  );

DROP POLICY IF EXISTS "Users can update their conversations" ON public.chat_conversations;
CREATE POLICY "Users can update their conversations" ON public.chat_conversations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      id IN (SELECT public.get_my_conversation_ids())
    )
  );

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );
