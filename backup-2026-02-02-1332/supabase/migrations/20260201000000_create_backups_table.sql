-- Create backups table for cloud backup storage
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  size BIGINT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  data JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_backup_id ON backups(backup_id);

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: Users can see their own backups OR admins can see all
CREATE POLICY "Users can view their own backups or admins see all"
  ON backups FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_admin()
  );

CREATE POLICY "Users can create their own backups"
  ON backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backups or admins can update all"
  ON backups FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR is_admin()
  );

CREATE POLICY "Users can delete their own backups or admins can delete all"
  ON backups FOR DELETE
  USING (
    auth.uid() = user_id 
    OR is_admin()
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_backups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backups_updated_at
  BEFORE UPDATE ON backups
  FOR EACH ROW
  EXECUTE FUNCTION update_backups_updated_at();

-- Add comment
COMMENT ON TABLE backups IS 'Stores backup data in the cloud with user isolation';
