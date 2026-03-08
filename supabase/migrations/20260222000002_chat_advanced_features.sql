-- ================================================================
-- Chat Advanced Features Migration
-- pinned messages, polls, scheduled messages, quick replies,
-- tasks from messages, read receipts, message search index
-- ================================================================

-- 1. Add pinned_message_id to chat_conversations
ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS pinned_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quick_replies jsonb DEFAULT '[]'::jsonb;

-- 2. Add video type and forward tracking to chat_messages
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS forwarded_from_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Extend message_type to include video and audio
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type IN ('text','image','file','voice','video','audio','poll','system'));

-- 3. Chat polls table
CREATE TABLE IF NOT EXISTS chat_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{id, text}]
  allow_multiple boolean DEFAULT false,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. Chat poll votes
CREATE TABLE IF NOT EXISTS chat_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES chat_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- 5. Scheduled messages
CREATE TABLE IF NOT EXISTS chat_scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  file_url text,
  file_name text,
  scheduled_at timestamptz NOT NULL,
  sent boolean DEFAULT false,
  sent_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. Tasks created from messages
CREATE TABLE IF NOT EXISTS chat_message_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_title text NOT NULL,
  task_description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_table text DEFAULT 'tasks', -- link to actual tasks table
  task_id uuid, -- ID in the tasks table
  created_at timestamptz DEFAULT now()
);

-- 7. Full-text search index on messages
CREATE INDEX IF NOT EXISTS chat_messages_content_search
  ON chat_messages USING gin(to_tsvector('simple', content));

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS chat_polls_conversation_idx ON chat_polls(conversation_id);
CREATE INDEX IF NOT EXISTS chat_poll_votes_poll_idx ON chat_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS chat_scheduled_idx ON chat_scheduled_messages(scheduled_at) WHERE sent = false;
CREATE INDEX IF NOT EXISTS chat_message_tasks_conv_idx ON chat_message_tasks(conversation_id);

-- 9. RLS policies
ALTER TABLE chat_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage polls" ON chat_polls FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can vote" ON chat_poll_votes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can schedule" ON chat_scheduled_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can create tasks from messages" ON chat_message_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_scheduled_messages;
