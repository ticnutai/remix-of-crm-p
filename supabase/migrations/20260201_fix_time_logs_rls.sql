-- Fix RLS policies for time_logs table
-- מתקן מדיניות RLS לטבלת רישומי זמן

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can insert their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can update their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Users can delete their own time logs" ON time_logs;

-- Enable RLS
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
CREATE POLICY "Users can view their own time logs" ON time_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for INSERT
CREATE POLICY "Users can insert their own time logs" ON time_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE
CREATE POLICY "Users can update their own time logs" ON time_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE
CREATE POLICY "Users can delete their own time logs" ON time_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Add default for user_id if missing
ALTER TABLE time_logs 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_client_id ON time_logs(client_id);

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '[OK] RLS policies for time_logs table fixed successfully!';
END $$;
