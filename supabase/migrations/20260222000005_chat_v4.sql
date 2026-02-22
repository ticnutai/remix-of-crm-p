-- Chat v4: urgent messages, mentions tracking, scheduled view, message links
-- =========================================================

-- 1. Urgent flag on messages
ALTER TABLE chat_messages 
  ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS link_preview jsonb DEFAULT null;

-- 2. Mentions table (track @mentions per message)
CREATE TABLE IF NOT EXISTS chat_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_mentions_user_idx ON chat_mentions(mentioned_user_id, is_read);
CREATE INDEX IF NOT EXISTS chat_mentions_conv_idx ON chat_mentions(conversation_id);

ALTER TABLE chat_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own mentions" ON chat_mentions FOR SELECT USING (mentioned_user_id = auth.uid());
CREATE POLICY "Auth insert mentions" ON chat_mentions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own mentions" ON chat_mentions FOR UPDATE USING (mentioned_user_id = auth.uid());

-- 3. Scheduled messages overview view
CREATE OR REPLACE VIEW chat_scheduled_messages_view AS
SELECT
  sm.id,
  sm.conversation_id,
  cc.title AS conversation_title,
  sm.content,
  sm.scheduled_at,
  sm.sent,
  sm.sender_id,
  p.full_name AS sender_name
FROM chat_scheduled_messages sm
LEFT JOIN chat_conversations cc ON sm.conversation_id = cc.id
LEFT JOIN profiles p ON sm.sender_id = p.id
WHERE sm.sent = false
ORDER BY sm.scheduled_at ASC;

-- 4. Conversation archive support
ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) DEFAULT null;

-- 5. Link preview cache
CREATE TABLE IF NOT EXISTS chat_link_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  title text,
  description text,
  image_url text,
  favicon_url text,
  site_name text,
  fetched_at timestamptz DEFAULT now()
);

-- 6. Realtime for mentions
ALTER PUBLICATION supabase_realtime ADD TABLE chat_mentions;

-- 7. Mark mentions as read function
CREATE OR REPLACE FUNCTION mark_mentions_read(p_conversation_id uuid, p_user_id uuid)
RETURNS void AS $$
  UPDATE chat_mentions
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND mentioned_user_id = p_user_id
    AND is_read = false;
$$ LANGUAGE sql SECURITY DEFINER;
