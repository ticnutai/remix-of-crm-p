-- Fix RLS policies for quotes table
-- מתקן מדיניות RLS לטבלת הצעות מחיר

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT - users can view quotes they created or quotes for their clients
CREATE POLICY "Users can view their own quotes" ON quotes
FOR SELECT
USING (
  auth.uid() = created_by 
  OR 
  client_id IN (SELECT id FROM clients WHERE created_by = auth.uid())
);

-- Policy for INSERT - users can create quotes for their own clients
CREATE POLICY "Users can insert their own quotes" ON quotes
FOR INSERT
WITH CHECK (
  auth.uid() = created_by 
  AND 
  client_id IN (SELECT id FROM clients WHERE created_by = auth.uid())
);

-- Policy for UPDATE - users can update their own quotes
CREATE POLICY "Users can update their own quotes" ON quotes
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Policy for DELETE - users can delete their own quotes
CREATE POLICY "Users can delete their own quotes" ON quotes
FOR DELETE
USING (auth.uid() = created_by);

-- Also add created_by if missing (in case it doesn't have a default)
ALTER TABLE quotes 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '[OK] RLS policies for quotes table fixed successfully!';
END $$;
