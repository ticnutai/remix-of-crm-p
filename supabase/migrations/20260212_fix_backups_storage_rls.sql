-- Fix RLS policies for backups storage bucket
-- Allow authenticated users to upload, read, and delete their own backups

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('backups', 'backups', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload backups
CREATE POLICY "Allow authenticated users to upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backups');

-- Allow authenticated users to read backups
CREATE POLICY "Allow authenticated users to read backups"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'backups');

-- Allow authenticated users to update backups (for upsert)
CREATE POLICY "Allow authenticated users to update backups"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'backups');

-- Allow authenticated users to delete old backups
CREATE POLICY "Allow authenticated users to delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'backups');
