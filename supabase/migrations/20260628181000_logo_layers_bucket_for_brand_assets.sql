-- Ensure the shared logo/strip bucket exists for the Flow brand asset library.

INSERT INTO storage.buckets (id, name, public)
VALUES ('logo-layers', 'logo-layers', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Authenticated users can upload logo layers" ON storage.objects;
CREATE POLICY "Authenticated users can upload logo layers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logo-layers');

DROP POLICY IF EXISTS "Public read access for logo layers" ON storage.objects;
CREATE POLICY "Public read access for logo layers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logo-layers');

DROP POLICY IF EXISTS "Authenticated users can delete logo layers" ON storage.objects;
CREATE POLICY "Authenticated users can delete logo layers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'logo-layers');

DROP POLICY IF EXISTS "Authenticated users can update logo layers" ON storage.objects;
CREATE POLICY "Authenticated users can update logo layers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'logo-layers')
WITH CHECK (bucket_id = 'logo-layers');
