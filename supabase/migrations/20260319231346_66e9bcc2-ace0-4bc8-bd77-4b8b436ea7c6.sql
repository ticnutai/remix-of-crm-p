-- Create storage bucket for processed logo layers
INSERT INTO storage.buckets (id, name, public)
VALUES ('logo-layers', 'logo-layers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload logo layers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logo-layers');

-- Allow public read access
CREATE POLICY "Public read access for logo layers"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'logo-layers');

-- Allow authenticated users to manage logo layers
CREATE POLICY "Authenticated users can delete logo layers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logo-layers');

CREATE POLICY "Authenticated users can update logo layers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logo-layers');