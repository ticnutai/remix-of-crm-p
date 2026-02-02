-- Email metadata table for storing client links, labels, flags etc.
CREATE TABLE IF NOT EXISTS email_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  linked_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  labels TEXT[] DEFAULT '{}',
  is_flagged BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique email_id per user
  UNIQUE(user_id, email_id)
);

-- Enable RLS
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own email metadata
DROP POLICY IF EXISTS "Users can view own email metadata" ON email_metadata;
CREATE POLICY "Users can view own email metadata"
  ON email_metadata FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email metadata" ON email_metadata;
CREATE POLICY "Users can insert own email metadata"
  ON email_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email metadata" ON email_metadata;
CREATE POLICY "Users can update own email metadata"
  ON email_metadata FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own email metadata" ON email_metadata;
CREATE POLICY "Users can delete own email metadata"
  ON email_metadata FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_metadata_user_id ON email_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_email_id ON email_metadata(email_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_linked_client ON email_metadata(linked_client_id);
