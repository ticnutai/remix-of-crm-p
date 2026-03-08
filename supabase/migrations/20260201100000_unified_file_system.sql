-- =====================================================
-- מערכת ניהול קבצים מאוחדת - Unified File Management System
-- תאריך: 2026-02-01
-- =====================================================

-- 1. טבלת תיקיות (צריכה להיות ראשונה!)
CREATE TABLE IF NOT EXISTS file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  parent_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
  
  -- בעלות
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  
  -- עיצוב
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  
  -- סטטיסטיקות (מחושבות)
  file_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. טבלת metadata לקבצים
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'other', -- image, video, audio, document, spreadsheet, archive, pdf, other
  mime_type TEXT,
  extension TEXT,
  thumbnail TEXT, -- base64 או URL
  
  -- קישורים
  folder_id UUID REFERENCES file_folders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- בעלות ושיתוף
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  
  -- מטא-דאטה נוסף
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  
  -- סטטיסטיקות
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- תאריכים
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ
);

-- 3. טבלת גרסאות קבצים
CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES file_metadata(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. טבלת שיתופים
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES file_metadata(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions TEXT DEFAULT 'view', -- view, edit, admin
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(file_id, shared_with)
);

-- 5. טבלת קישורים ציבוריים
CREATE TABLE IF NOT EXISTS file_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES file_metadata(id) ON DELETE CASCADE,
  link_token TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text || clock_timestamp()::text) from 1 for 32),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- 6. אינדקסים לביצועים
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

-- 7. RLS Policies
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_public_links ENABLE ROW LEVEL SECURITY;

-- file_metadata policies
CREATE POLICY "Users can view own files or shared files"
  ON file_metadata FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR id IN (SELECT file_id FROM file_shares WHERE shared_with = auth.uid())
    OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can upload files"
  ON file_metadata FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own files or admins"
  ON file_metadata FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete own files or admins"
  ON file_metadata FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin')
  );

-- file_folders policies
CREATE POLICY "Users can view own folders or shared"
  ON file_folders FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_shared = TRUE
    OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create folders"
  ON file_folders FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own folders"
  ON file_folders FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete own folders"
  ON file_folders FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin')
  );

-- file_shares policies
CREATE POLICY "Users can view shares for their files or shares with them"
  ON file_shares FOR SELECT
  USING (
    shared_with = auth.uid()
    OR shared_by = auth.uid()
  );

CREATE POLICY "File owners can create shares"
  ON file_shares FOR INSERT
  WITH CHECK (
    shared_by = auth.uid()
    AND EXISTS (SELECT 1 FROM file_metadata WHERE id = file_id AND uploaded_by = auth.uid())
  );

CREATE POLICY "File owners can delete shares"
  ON file_shares FOR DELETE
  USING (
    shared_by = auth.uid()
  );

-- file_public_links policies  
CREATE POLICY "Users can view links for their files"
  ON file_public_links FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create links for their files"
  ON file_public_links FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their links"
  ON file_public_links FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their links"
  ON file_public_links FOR DELETE
  USING (created_by = auth.uid());

-- 8. פונקציות עזר

-- פונקציה לעדכון סטטיסטיקות תיקייה
CREATE OR REPLACE FUNCTION update_folder_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.folder_id IS NOT NULL THEN
      UPDATE file_folders SET
        file_count = (SELECT COUNT(*) FROM file_metadata WHERE folder_id = NEW.folder_id),
        total_size = (SELECT COALESCE(SUM(size), 0) FROM file_metadata WHERE folder_id = NEW.folder_id),
        updated_at = NOW()
      WHERE id = NEW.folder_id;
    END IF;
    
    -- עדכון תיקייה ישנה אם היה מעבר
    IF TG_OP = 'UPDATE' AND OLD.folder_id IS DISTINCT FROM NEW.folder_id AND OLD.folder_id IS NOT NULL THEN
      UPDATE file_folders SET
        file_count = (SELECT COUNT(*) FROM file_metadata WHERE folder_id = OLD.folder_id),
        total_size = (SELECT COALESCE(SUM(size), 0) FROM file_metadata WHERE folder_id = OLD.folder_id),
        updated_at = NOW()
      WHERE id = OLD.folder_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.folder_id IS NOT NULL THEN
      UPDATE file_folders SET
        file_count = (SELECT COUNT(*) FROM file_metadata WHERE folder_id = OLD.folder_id),
        total_size = (SELECT COALESCE(SUM(size), 0) FROM file_metadata WHERE folder_id = OLD.folder_id),
        updated_at = NOW()
      WHERE id = OLD.folder_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_folder_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_stats();

-- פונקציה לעדכון updated_at
CREATE OR REPLACE FUNCTION update_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_metadata_updated_at
  BEFORE UPDATE ON file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_file_updated_at();

CREATE TRIGGER file_folders_updated_at
  BEFORE UPDATE ON file_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_file_updated_at();

-- פונקציה להגדלת מונה הורדות
CREATE OR REPLACE FUNCTION increment_download_count(p_file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE file_metadata 
  SET download_count = download_count + 1,
      last_accessed = NOW()
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה להגדלת מונה צפיות
CREATE OR REPLACE FUNCTION increment_view_count(p_file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE file_metadata 
  SET view_count = view_count + 1,
      last_accessed = NOW()
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לשליפת סטטיסטיקות
CREATE OR REPLACE FUNCTION get_file_statistics(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_files', (
      SELECT COUNT(*) FROM file_metadata 
      WHERE p_user_id IS NULL OR uploaded_by = p_user_id
    ),
    'total_size', (
      SELECT COALESCE(SUM(size), 0) FROM file_metadata 
      WHERE p_user_id IS NULL OR uploaded_by = p_user_id
    ),
    'files_by_type', (
      SELECT json_object_agg(type, cnt)
      FROM (
        SELECT type, COUNT(*) as cnt 
        FROM file_metadata 
        WHERE p_user_id IS NULL OR uploaded_by = p_user_id
        GROUP BY type
      ) t
    ),
    'uploads_this_month', (
      SELECT COUNT(*) FROM file_metadata 
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
      AND (p_user_id IS NULL OR uploaded_by = p_user_id)
    ),
    'shared_files', (
      SELECT COUNT(*) FROM file_metadata 
      WHERE is_shared = TRUE
      AND (p_user_id IS NULL OR uploaded_by = p_user_id)
    ),
    'starred_files', (
      SELECT COUNT(*) FROM file_metadata 
      WHERE is_starred = TRUE
      AND (p_user_id IS NULL OR uploaded_by = p_user_id)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לחיפוש קבצים מתקדם
CREATE OR REPLACE FUNCTION search_files(
  p_query TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_folder_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_min_size BIGINT DEFAULT NULL,
  p_max_size BIGINT DEFAULT NULL,
  p_starred_only BOOLEAN DEFAULT FALSE,
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  path TEXT,
  size BIGINT,
  type TEXT,
  mime_type TEXT,
  extension TEXT,
  thumbnail TEXT,
  folder_id UUID,
  client_id UUID,
  uploaded_by UUID,
  is_starred BOOLEAN,
  is_shared BOOLEAN,
  tags TEXT[],
  category TEXT,
  download_count INTEGER,
  view_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fm.id,
    fm.name,
    fm.path,
    fm.size,
    fm.type,
    fm.mime_type,
    fm.extension,
    fm.thumbnail,
    fm.folder_id,
    fm.client_id,
    fm.uploaded_by,
    fm.is_starred,
    fm.is_shared,
    fm.tags,
    fm.category,
    fm.download_count,
    fm.view_count,
    fm.created_at,
    fm.updated_at
  FROM file_metadata fm
  WHERE 
    -- חיפוש טקסט
    (p_query IS NULL OR fm.name ILIKE '%' || p_query || '%')
    -- סוג קובץ
    AND (p_type IS NULL OR fm.type = p_type)
    -- תיקייה
    AND (p_folder_id IS NULL OR fm.folder_id = p_folder_id)
    -- תגיות
    AND (p_tags IS NULL OR fm.tags && p_tags)
    -- טווח תאריכים
    AND (p_date_from IS NULL OR fm.created_at >= p_date_from)
    AND (p_date_to IS NULL OR fm.created_at <= p_date_to)
    -- טווח גדלים
    AND (p_min_size IS NULL OR fm.size >= p_min_size)
    AND (p_max_size IS NULL OR fm.size <= p_max_size)
    -- מועדפים בלבד
    AND (NOT p_starred_only OR fm.is_starred = TRUE)
    -- בעלות (או שיתוף)
    AND (
      p_user_id IS NULL 
      OR fm.uploaded_by = p_user_id
      OR fm.id IN (SELECT file_id FROM file_shares WHERE shared_with = p_user_id)
    )
  ORDER BY fm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה להוספת/הסרת תגית
CREATE OR REPLACE FUNCTION toggle_file_tag(p_file_id UUID, p_tag TEXT)
RETURNS TEXT[] AS $$
DECLARE
  current_tags TEXT[];
  new_tags TEXT[];
BEGIN
  SELECT tags INTO current_tags FROM file_metadata WHERE id = p_file_id;
  
  IF current_tags IS NULL THEN
    current_tags := '{}';
  END IF;
  
  IF p_tag = ANY(current_tags) THEN
    -- הסר תגית
    new_tags := array_remove(current_tags, p_tag);
  ELSE
    -- הוסף תגית
    new_tags := array_append(current_tags, p_tag);
  END IF;
  
  UPDATE file_metadata SET tags = new_tags WHERE id = p_file_id;
  
  RETURN new_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה להחלפת מצב כוכב
CREATE OR REPLACE FUNCTION toggle_file_star(p_file_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  new_starred BOOLEAN;
BEGIN
  UPDATE file_metadata 
  SET is_starred = NOT is_starred 
  WHERE id = p_file_id
  RETURNING is_starred INTO new_starred;
  
  RETURN new_starred;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה להעברת קובץ לתיקייה
CREATE OR REPLACE FUNCTION move_file_to_folder(p_file_id UUID, p_folder_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE file_metadata 
  SET folder_id = p_folder_id 
  WHERE id = p_file_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לקבלת תגיות פופולריות
CREATE OR REPLACE FUNCTION get_popular_tags(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) as tag, COUNT(*) as count
  FROM file_metadata
  WHERE array_length(tags, 1) > 0
  GROUP BY tag
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הוספת הרשאה לכולם להריץ את הפונקציות
GRANT EXECUTE ON FUNCTION increment_download_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_files(TEXT, TEXT, UUID, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BIGINT, BIGINT, BOOLEAN, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_file_tag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_file_star(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_file_to_folder(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_tags(INTEGER) TO authenticated;

-- הערות
COMMENT ON TABLE file_metadata IS 'טבלת מטא-דאטה מרכזית לכל הקבצים במערכת';
COMMENT ON TABLE file_folders IS 'מבנה תיקיות היררכי לארגון קבצים';
COMMENT ON TABLE file_versions IS 'היסטוריית גרסאות לקבצים';
COMMENT ON TABLE file_shares IS 'הרשאות שיתוף בין משתמשים';
COMMENT ON TABLE file_public_links IS 'קישורים ציבוריים לשיתוף חיצוני';
