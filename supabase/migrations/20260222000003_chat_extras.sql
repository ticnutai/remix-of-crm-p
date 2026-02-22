-- ================================================================
-- Chat Extras: labels, mute, favorites, saved, templates,
-- threads, SLA, read-receipts index, WhatsApp queue, analytics
-- ================================================================

-- 1. Per-conversation user settings (mute, favorite, theme, custom title)
CREATE TABLE IF NOT EXISTS chat_conversation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  theme_color text DEFAULT NULL,        -- '#hex'
  theme_emoji text DEFAULT NULL,        -- '🔥'
  custom_title text DEFAULT NULL,
  UNIQUE(conversation_id, user_id)
);

-- 2. Labels / tags (system-wide or per-org)
CREATE TABLE IF NOT EXISTS chat_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  emoji text DEFAULT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed default labels
INSERT INTO chat_labels (name, color, emoji) VALUES
  ('דחוף', '#ef4444', '🚨'),
  ('תמיכה', '#3b82f6', '🛟'),
  ('חשבונות', '#10b981', '💰'),
  ('פולואפ', '#f59e0b', '🔔'),
  ('חשוב', '#8b5cf6', '⭐')
ON CONFLICT DO NOTHING;

-- 3. Conversation ↔ label junction
CREATE TABLE IF NOT EXISTS chat_conversation_labels (
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES chat_labels(id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, label_id)
);

-- 4. Saved / starred messages (per user)
CREATE TABLE IF NOT EXISTS chat_saved_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- 5. Message templates (quick reply templates)
CREATE TABLE IF NOT EXISTS chat_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  shortcut text DEFAULT NULL,     -- '/thanks' etc.
  category text DEFAULT 'general',
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed default templates
INSERT INTO chat_message_templates (title, content, shortcut, category) VALUES
  ('ברכת שלום', 'שלום! אני כאן לעזור. במה אוכל לסייע?', '/hi', 'greeting'),
  ('אישור קבלה', 'תודה! קיבלנו את הפנייה שלך ונחזור אליך בהקדם.', '/ack', 'greeting'),
  ('המשך טיפול', 'אנחנו בודקים את הנושא ונעדכן אותך תוך 24 שעות.', '/wip', 'status'),
  ('סגירת פנייה', 'הפנייה שלך טופלה בהצלחה. האם יש עוד משהו שאוכל לעזור?', '/close', 'closing'),
  ('תזכורת תשלום', 'שלום, רצינו להזכיר שיש חשבונית פתוחה הממתינה לתשלום.', '/pay', 'billing')
ON CONFLICT DO NOTHING;

-- 6. Thread support — add thread_id to chat_messages
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS thread_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS thread_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mention_ids jsonb DEFAULT '[]'::jsonb; -- [@user_ids]

-- 7. SLA settings per conversation type
CREATE TABLE IF NOT EXISTS chat_sla_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type text NOT NULL,  -- 'client', 'internal', 'group'
  first_response_minutes integer DEFAULT 60,
  resolution_minutes integer DEFAULT 1440,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO chat_sla_settings (conversation_type, first_response_minutes, resolution_minutes) VALUES
  ('client', 60, 480),
  ('internal', 240, 1440),
  ('group', 120, 720)
ON CONFLICT DO NOTHING;

-- 8. SLA per conversation (runtime tracking)
ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS sla_first_response_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sla_resolved_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS theme_emoji text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS label_ids jsonb DEFAULT '[]'::jsonb;

-- 9. WhatsApp/SMS outbound queue
CREATE TABLE IF NOT EXISTS chat_whatsapp_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp', -- 'whatsapp' | 'sms'
  status text DEFAULT 'pending',             -- 'pending' | 'sent' | 'failed'
  sent_at timestamptz,
  error_message text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 10. Analytics: read receipts with better index
CREATE INDEX IF NOT EXISTS chat_participants_last_read_idx
  ON chat_participants(conversation_id, last_read_at);

-- 11. Analytics view (CTE to avoid window-func-inside-aggregate error)
CREATE OR REPLACE VIEW chat_analytics AS
WITH msg_gaps AS (
  SELECT
    cm.conversation_id,
    cm.sender_id,
    EXTRACT(EPOCH FROM (
      cm.created_at - LAG(cm.created_at) OVER (PARTITION BY cm.conversation_id ORDER BY cm.created_at)
    )) / 60 AS gap_minutes
  FROM chat_messages cm
  WHERE cm.is_deleted = false
)
SELECT
  cc.id AS conversation_id,
  cc.title,
  cc.type,
  cc.client_id,
  cl.name AS client_name,
  COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_deleted = false) AS message_count,
  COUNT(DISTINCT cm.sender_id) AS participant_count,
  MAX(cm.created_at) AS last_activity,
  MIN(cm.created_at) AS first_message_at,
  (SELECT AVG(g.gap_minutes)::integer FROM msg_gaps g WHERE g.conversation_id = cc.id AND g.gap_minutes IS NOT NULL) AS avg_response_minutes,
  COUNT(DISTINCT cf.id) AS file_count
FROM chat_conversations cc
LEFT JOIN clients cl ON cc.client_id = cl.id
LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
LEFT JOIN chat_files cf ON cc.id = cf.conversation_id
GROUP BY cc.id, cc.title, cc.type, cc.client_id, cl.name;

-- 12. GIF search log (optional)
CREATE TABLE IF NOT EXISTS chat_gif_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gif_url text NOT NULL,
  gif_id text NOT NULL,
  title text,
  used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, gif_id)
);

-- 13. Indexes
CREATE INDEX IF NOT EXISTS chat_conv_labels_idx ON chat_conversation_labels(conversation_id);
CREATE INDEX IF NOT EXISTS chat_saved_msgs_user_idx ON chat_saved_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_templates_shortcut_idx ON chat_message_templates(shortcut);
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON chat_messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS chat_whatsapp_status_idx ON chat_whatsapp_queue(status);

-- 14. RLS
ALTER TABLE chat_conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversation_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_saved_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sla_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_whatsapp_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_gif_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage conv settings" ON chat_conversation_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth users read labels" ON chat_labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage labels" ON chat_labels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users manage conv labels" ON chat_conversation_labels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage saved msgs" ON chat_saved_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Auth users manage templates" ON chat_message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth read SLA" ON chat_sla_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage whatsapp queue" ON chat_whatsapp_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth manage gif favs" ON chat_gif_favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 15. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversation_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_saved_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_whatsapp_queue;
