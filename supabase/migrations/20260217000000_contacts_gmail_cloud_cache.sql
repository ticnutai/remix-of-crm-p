-- ================================================================
-- Cloud cache for Google Contacts and Gmail data
-- Stores fetched data so it persists across sessions
-- ================================================================

-- ─── Google Contacts Cache ─────────────────────────────────────
-- Stores actual contact data from Google People API
CREATE TABLE IF NOT EXISTS google_contacts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  google_resource_name TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'ללא שם',
  email TEXT,
  phone TEXT,
  company TEXT,
  photo_url TEXT,
  raw_data JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, google_resource_name)
);

-- ─── Gmail Senders Cache ───────────────────────────────────────
-- Aggregated sender information extracted from Gmail messages
CREATE TABLE IF NOT EXISTS gmail_senders_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_date TIMESTAMPTZ,
  linked_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sender_email)
);

-- ─── RLS Policies ──────────────────────────────────────────────
ALTER TABLE google_contacts_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_senders_cache ENABLE ROW LEVEL SECURITY;

-- Google Contacts Cache policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gcc_select' AND tablename = 'google_contacts_cache') THEN
    CREATE POLICY gcc_select ON google_contacts_cache FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gcc_insert' AND tablename = 'google_contacts_cache') THEN
    CREATE POLICY gcc_insert ON google_contacts_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gcc_update' AND tablename = 'google_contacts_cache') THEN
    CREATE POLICY gcc_update ON google_contacts_cache FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gcc_delete' AND tablename = 'google_contacts_cache') THEN
    CREATE POLICY gcc_delete ON google_contacts_cache FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Gmail Senders Cache policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gsc_select' AND tablename = 'gmail_senders_cache') THEN
    CREATE POLICY gsc_select ON gmail_senders_cache FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gsc_insert' AND tablename = 'gmail_senders_cache') THEN
    CREATE POLICY gsc_insert ON gmail_senders_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gsc_update' AND tablename = 'gmail_senders_cache') THEN
    CREATE POLICY gsc_update ON gmail_senders_cache FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gsc_delete' AND tablename = 'gmail_senders_cache') THEN
    CREATE POLICY gsc_delete ON gmail_senders_cache FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── Indexes for performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gcc_user_id ON google_contacts_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_gcc_email ON google_contacts_cache(email);
CREATE INDEX IF NOT EXISTS idx_gsc_user_id ON gmail_senders_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_sender_email ON gmail_senders_cache(sender_email);

-- ─── Also add RLS policies for email_messages if missing ───────
-- (email_messages table already exists but may need insert/upsert policies)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'em_select_own' AND tablename = 'email_messages') THEN
    CREATE POLICY em_select_own ON email_messages FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'em_insert_own' AND tablename = 'email_messages') THEN
    CREATE POLICY em_insert_own ON email_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'em_update_own' AND tablename = 'email_messages') THEN
    CREATE POLICY em_update_own ON email_messages FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'em_delete_own' AND tablename = 'email_messages') THEN
    CREATE POLICY em_delete_own ON email_messages FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
