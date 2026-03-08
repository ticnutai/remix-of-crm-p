-- =============================================
-- Chat & Messaging System
-- מערכת צ'אט ושיחות - פנימי + לקוחות
-- =============================================

-- טבלת שיחות
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  type text NOT NULL DEFAULT 'internal' CHECK (type IN ('internal', 'client', 'group')),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message text,
  last_message_at timestamptz,
  is_archived boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- טבלת משתתפים בשיחה
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  participant_type text NOT NULL DEFAULT 'user' CHECK (participant_type IN ('user', 'client')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  is_admin boolean DEFAULT false,
  CONSTRAINT chat_participants_user_or_client CHECK (
    (user_id IS NOT NULL AND client_id IS NULL) OR 
    (user_id IS NULL AND client_id IS NOT NULL)
  )
);

-- טבלת הודעות
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  sender_type text NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'client')),
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system')),
  file_url text,
  file_name text,
  file_size integer,
  file_type text,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  is_deleted boolean DEFAULT false,
  reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  reactions jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- טבלת קריאת הודעות
CREATE TABLE IF NOT EXISTS public.chat_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- טבלת הקלדה (typing indicators)
CREATE TABLE IF NOT EXISTS public.chat_typing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation ON public.chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated ON public.chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_message_reads_user ON public.chat_message_reads(user_id);

-- עדכון אוטומטי של updated_at בשיחות
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_chat_message ON public.chat_messages;
CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- RLS Policies
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_typing ENABLE ROW LEVEL SECURITY;

-- Conversations: users can see conversations they participate in
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      id IN (
        SELECT conversation_id FROM public.chat_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their conversations" ON public.chat_conversations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      id IN (SELECT conversation_id FROM public.chat_participants WHERE user_id = auth.uid() AND is_admin = true)
    )
  );

-- Participants: users can see participants of their conversations
CREATE POLICY "Users can view participants" ON public.chat_participants
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    conversation_id IN (
      SELECT conversation_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants" ON public.chat_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their participant record" ON public.chat_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Messages: users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    conversation_id IN (
      SELECT conversation_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND sender_id = auth.uid());

CREATE POLICY "Users can edit their messages" ON public.chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Message reads
CREATE POLICY "Users can mark messages as read" ON public.chat_message_reads
  FOR ALL USING (user_id = auth.uid());

-- Typing indicators
CREATE POLICY "Users can manage typing indicators" ON public.chat_typing
  FOR ALL USING (user_id = auth.uid());

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing;
