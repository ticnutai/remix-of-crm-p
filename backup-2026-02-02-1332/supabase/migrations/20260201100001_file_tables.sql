-- =====================================================
-- מערכת ניהול קבצים - טבלאות בלבד
-- =====================================================

-- 1. טבלת תיקיות
CREATE TABLE IF NOT EXISTS file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  parent_id UUID,
  created_by UUID,
  is_shared BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  file_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. טבלת קבצים
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'other',
  mime_type TEXT,
  extension TEXT,
  thumbnail TEXT,
  folder_id UUID,
  client_id UUID,
  uploaded_by UUID,
  is_starred BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ
);

-- 3. טבלת גרסאות
CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_by UUID,
  changes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. טבלת שיתופים
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL,
  permissions TEXT DEFAULT 'view',
  shared_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(file_id, shared_with)
);

-- 5. טבלת קישורים ציבוריים
CREATE TABLE IF NOT EXISTS file_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
  link_token TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text || clock_timestamp()::text) from 1 for 32),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- 6. אינדקסים
CREATE INDEX IF NOT EXISTS idx_file_metadata_folder ON file_metadata(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_client ON file_metadata(client_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_user ON file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_metadata_type ON file_metadata(type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_starred ON file_metadata(is_starred) WHERE is_starred = TRUE;
CREATE INDEX IF NOT EXISTS idx_file_metadata_tags ON file_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created ON file_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_name ON file_metadata(name);
CREATE INDEX IF NOT EXISTS idx_file_folders_parent ON file_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_user ON file_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_user ON file_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_file_public_links_token ON file_public_links(link_token);

-- 7. RLS
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_public_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own files or shared files" ON file_metadata FOR SELECT
  USING (uploaded_by = auth.uid() OR id IN (SELECT file_id FROM file_shares WHERE shared_with = auth.uid()));

CREATE POLICY "Users can upload files" ON file_metadata FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own files" ON file_metadata FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own files" ON file_metadata FOR DELETE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can view own folders" ON file_folders FOR SELECT
  USING (created_by = auth.uid() OR is_shared = TRUE);

CREATE POLICY "Users can create folders" ON file_folders FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own folders" ON file_folders FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own folders" ON file_folders FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Users can view shares" ON file_shares FOR SELECT
  USING (shared_with = auth.uid() OR shared_by = auth.uid());

CREATE POLICY "File owners can create shares" ON file_shares FOR INSERT
  WITH CHECK (shared_by = auth.uid() AND EXISTS (SELECT 1 FROM file_metadata WHERE id = file_id AND uploaded_by = auth.uid()));

CREATE POLICY "File owners can delete shares" ON file_shares FOR DELETE
  USING (shared_by = auth.uid());

CREATE POLICY "Users can view their links" ON file_public_links FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create links" ON file_public_links FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their links" ON file_public_links FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their links" ON file_public_links FOR DELETE
  USING (created_by = auth.uid());
