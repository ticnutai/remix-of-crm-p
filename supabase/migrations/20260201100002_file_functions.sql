-- =====================================================
-- מערכת ניהול קבצים - פונקציות
-- =====================================================

-- 1. עדכון סטטיסטיקות תיקיות
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
  FOR EACH ROW EXECUTE FUNCTION update_folder_stats();

-- 2. עדכון updated_at
CREATE OR REPLACE FUNCTION update_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_metadata_updated_at
  BEFORE UPDATE ON file_metadata
  FOR EACH ROW EXECUTE FUNCTION update_file_updated_at();

CREATE TRIGGER file_folders_updated_at
  BEFORE UPDATE ON file_folders
  FOR EACH ROW EXECUTE FUNCTION update_file_updated_at();

-- 3. ספירת הורדות
CREATE OR REPLACE FUNCTION increment_download_count(p_file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE file_metadata 
  SET download_count = download_count + 1, last_accessed = NOW()
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ספירת צפיות
CREATE OR REPLACE FUNCTION increment_view_count(p_file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE file_metadata 
  SET view_count = view_count + 1, last_accessed = NOW()
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. סטטיסטיקות
CREATE OR REPLACE FUNCTION get_file_statistics(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_files', (SELECT COUNT(*) FROM file_metadata WHERE p_user_id IS NULL OR uploaded_by = p_user_id),
    'total_size', (SELECT COALESCE(SUM(size), 0) FROM file_metadata WHERE p_user_id IS NULL OR uploaded_by = p_user_id),
    'files_by_type', (
      SELECT json_object_agg(type, cnt)
      FROM (SELECT type, COUNT(*) as cnt FROM file_metadata WHERE p_user_id IS NULL OR uploaded_by = p_user_id GROUP BY type) t
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. חיפוש
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
  id UUID, name TEXT, path TEXT, size BIGINT, type TEXT, mime_type TEXT,
  extension TEXT, thumbnail TEXT, folder_id UUID, client_id UUID,
  uploaded_by UUID, is_starred BOOLEAN, is_shared BOOLEAN, tags TEXT[],
  category TEXT, download_count INTEGER, view_count INTEGER,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT fm.id, fm.name, fm.path, fm.size, fm.type, fm.mime_type, fm.extension,
         fm.thumbnail, fm.folder_id, fm.client_id, fm.uploaded_by, fm.is_starred,
         fm.is_shared, fm.tags, fm.category, fm.download_count, fm.view_count,
         fm.created_at, fm.updated_at
  FROM file_metadata fm
  WHERE (p_query IS NULL OR fm.name ILIKE '%' || p_query || '%')
    AND (p_type IS NULL OR fm.type = p_type)
    AND (p_folder_id IS NULL OR fm.folder_id = p_folder_id)
    AND (p_tags IS NULL OR fm.tags && p_tags)
    AND (p_date_from IS NULL OR fm.created_at >= p_date_from)
    AND (p_date_to IS NULL OR fm.created_at <= p_date_to)
    AND (p_min_size IS NULL OR fm.size >= p_min_size)
    AND (p_max_size IS NULL OR fm.size <= p_max_size)
    AND (NOT p_starred_only OR fm.is_starred = TRUE)
    AND (p_user_id IS NULL OR fm.uploaded_by = p_user_id OR fm.id IN (SELECT file_id FROM file_shares WHERE shared_with = p_user_id))
  ORDER BY fm.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. תגיות
CREATE OR REPLACE FUNCTION toggle_file_tag(p_file_id UUID, p_tag TEXT)
RETURNS TEXT[] AS $$
DECLARE
  current_tags TEXT[];
  new_tags TEXT[];
BEGIN
  SELECT tags INTO current_tags FROM file_metadata WHERE id = p_file_id;
  IF current_tags IS NULL THEN current_tags := '{}'; END IF;
  IF p_tag = ANY(current_tags) THEN
    new_tags := array_remove(current_tags, p_tag);
  ELSE
    new_tags := array_append(current_tags, p_tag);
  END IF;
  UPDATE file_metadata SET tags = new_tags WHERE id = p_file_id;
  RETURN new_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. כוכב
CREATE OR REPLACE FUNCTION toggle_file_star(p_file_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  new_starred BOOLEAN;
BEGIN
  UPDATE file_metadata SET is_starred = NOT is_starred WHERE id = p_file_id RETURNING is_starred INTO new_starred;
  RETURN new_starred;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. העברת קובץ
CREATE OR REPLACE FUNCTION move_file_to_folder(p_file_id UUID, p_folder_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE file_metadata SET folder_id = p_folder_id WHERE id = p_file_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. תגיות פופולריות
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

-- הרשאות
GRANT EXECUTE ON FUNCTION increment_download_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_files(TEXT, TEXT, UUID, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BIGINT, BIGINT, BOOLEAN, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_file_tag(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_file_star(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_file_to_folder(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_tags(INTEGER) TO authenticated;
