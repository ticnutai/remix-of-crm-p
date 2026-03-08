import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eadeymehidcndudeycnf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data: auth } = await sb.auth.signInWithPassword({
  email: "jj1212t@gmail.com",
  password: "543211",
});
console.log("Logged in:", auth.user.email);

const sql = `
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('backups', 'backups', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update backups" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete backups" ON storage.objects;

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
`;

const { data, error } = await sb.functions.invoke("execute-sql", {
  body: { sql, migration_name: "fix_backups_storage_rls" },
});

if (error) console.error("Edge function error:", error);
else console.log("Result:", JSON.stringify(data, null, 2));
