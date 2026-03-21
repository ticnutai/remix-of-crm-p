
-- Create storage bucket for client task files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload client files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-files');

-- Allow public read
CREATE POLICY "Public read client files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'client-files');
