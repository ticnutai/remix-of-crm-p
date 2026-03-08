-- Fix unified file system RLS policies that reference non-existent employees.role column
-- Replace with has_role() function which uses user_roles table

-- Drop and recreate policies for file_metadata
DROP POLICY IF EXISTS "Users can view own files or shared files" ON file_metadata;
CREATE POLICY "Users can view own files or shared files"
  ON file_metadata FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR id IN (SELECT file_id FROM file_shares WHERE shared_with = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can update own files or admins" ON file_metadata;
CREATE POLICY "Users can update own files or admins"
  ON file_metadata FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can delete own files or admins" ON file_metadata;
CREATE POLICY "Users can delete own files or admins"
  ON file_metadata FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- Drop and recreate policies for file_folders
DROP POLICY IF EXISTS "Users can view own folders or shared" ON file_folders;
CREATE POLICY "Users can view own folders or shared"
  ON file_folders FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_shared = TRUE
    OR has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can update own folders" ON file_folders;
CREATE POLICY "Users can update own folders"
  ON file_folders FOR UPDATE
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Users can delete own folders" ON file_folders;
CREATE POLICY "Users can delete own folders"
  ON file_folders FOR DELETE
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- Fix file_public_links
DROP POLICY IF EXISTS "Users can view links for their files" ON file_public_links;
CREATE POLICY "Users can view links for their files"
  ON file_public_links FOR SELECT
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );
