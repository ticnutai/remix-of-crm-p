-- Fix all critical RLS policies
-- תיקון כל מדיניות RLS קריטיות

-- 1. Tasks table
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON tasks
FOR SELECT
USING (
  auth.uid() = created_by 
  OR 
  auth.uid() = assigned_to
  OR
  client_id IN (SELECT id FROM clients WHERE created_by = auth.uid())
);

CREATE POLICY "Users can insert their own tasks" ON tasks
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own tasks" ON tasks
FOR UPDATE
USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their own tasks" ON tasks
FOR DELETE
USING (auth.uid() = created_by);

-- 2. Client Contacts table
DROP POLICY IF EXISTS "Users can view contacts of their clients" ON client_contacts;
DROP POLICY IF EXISTS "Users can insert contacts for their clients" ON client_contacts;
DROP POLICY IF EXISTS "Users can update contacts of their clients" ON client_contacts;
DROP POLICY IF EXISTS "Users can delete contacts of their clients" ON client_contacts;

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts of their clients" ON client_contacts
FOR SELECT
USING (client_id IN (SELECT id FROM clients WHERE created_by = auth.uid()));

CREATE POLICY "Users can insert contacts for their clients" ON client_contacts
FOR INSERT
WITH CHECK (client_id IN (SELECT id FROM clients WHERE created_by = auth.uid()));

CREATE POLICY "Users can update contacts of their clients" ON client_contacts
FOR UPDATE
USING (client_id IN (SELECT id FROM clients WHERE created_by = auth.uid()));

CREATE POLICY "Users can delete contacts of their clients" ON client_contacts
FOR DELETE
USING (client_id IN (SELECT id FROM clients WHERE created_by = auth.uid()));

-- 3. Invoices table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices';
    
    EXECUTE 'ALTER TABLE invoices ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT
    USING (
      auth.uid() = created_by 
      OR 
      client_id IN (SELECT id FROM clients WHERE created_by = auth.uid())
    )';
    
    EXECUTE 'CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT
    WITH CHECK (auth.uid() = created_by)';
    
    EXECUTE 'CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE
    USING (auth.uid() = created_by)';
    
    EXECUTE 'CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE
    USING (auth.uid() = created_by)';
    
    RAISE NOTICE '✅ RLS policies for invoices table fixed!';
  END IF;
END $$;

-- 4. Payments table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own payments" ON payments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own payments" ON payments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own payments" ON payments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own payments" ON payments';
    
    EXECUTE 'ALTER TABLE payments ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT
    USING (
      auth.uid() = created_by 
      OR 
      invoice_id IN (SELECT id FROM invoices WHERE created_by = auth.uid())
    )';
    
    EXECUTE 'CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT
    WITH CHECK (auth.uid() = created_by)';
    
    EXECUTE 'CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE
    USING (auth.uid() = created_by)';
    
    EXECUTE 'CREATE POLICY "Users can delete their own payments" ON payments
    FOR DELETE
    USING (auth.uid() = created_by)';
    
    RAISE NOTICE '✅ RLS policies for payments table fixed!';
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ All critical RLS policies fixed successfully!';
  RAISE NOTICE '📊 Tables protected: tasks, client_contacts, invoices, payments';
END $$;
