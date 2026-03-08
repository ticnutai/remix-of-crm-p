-- =============================================
-- Chat Files - קישור קבצי שיחה ללקוחות
-- =============================================

-- טבלת קבצי שיחה עם קישור ללקוח
CREATE TABLE IF NOT EXISTS public.chat_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  source text DEFAULT 'upload' CHECK (source IN ('upload', 'google_drive', 'gmail', 'link')),
  drive_file_id text,
  gmail_message_id text,
  thumbnail_url text,
  duration_seconds integer,
  is_archived boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_files_client ON public.chat_files(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_files_conversation ON public.chat_files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_files_message ON public.chat_files(message_id);

ALTER TABLE public.chat_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chat files" ON public.chat_files
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Update chat_conversations to ensure client_id is properly set
-- (already exists from previous migration, just making sure)

-- Helper view: files per client with conversation context
CREATE OR REPLACE VIEW public.client_chat_files AS
  SELECT 
    cf.*,
    c.name as client_name,
    cc.title as conversation_title,
    cc.type as conversation_type,
    p.full_name as uploader_name
  FROM public.chat_files cf
  LEFT JOIN public.clients c ON cf.client_id = c.id
  LEFT JOIN public.chat_conversations cc ON cf.conversation_id = cc.id
  LEFT JOIN public.profiles p ON cf.uploaded_by = p.id;

GRANT SELECT ON public.client_chat_files TO authenticated;
