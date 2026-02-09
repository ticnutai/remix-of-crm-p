-- Fix RLS policies based on actual table structure
-- Fix RLS policies based on actual table structure

-- 1. Tasks table - using user_id instead of created_by if needed
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

  -- Enable RLS
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

  -- Check if we have created_by or user_id column
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
    
    -- Use created_by column
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
    
    RAISE NOTICE '[OK] RLS on tasks using created_by column';
    
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'user_id') THEN
    
    -- Use user_id column
    CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT
    USING (
      auth.uid() = user_id 
      OR 
      auth.uid() = assigned_to
      OR
      client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    );

    CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = assigned_to);

    CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE
    USING (auth.uid() = user_id);
    
    RAISE NOTICE '[OK] RLS on tasks using user_id column';
    
  ELSE
    RAISE NOTICE '⚠️ tasks table does not have created_by or user_id column';
  END IF;
END $$;

-- 2. Client Contacts table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_contacts') THEN
    DROP POLICY IF EXISTS "Users can view contacts of their clients" ON client_contacts;
    DROP POLICY IF EXISTS "Users can insert contacts for their clients" ON client_contacts;
    DROP POLICY IF EXISTS "Users can update contacts of their clients" ON client_contacts;
    DROP POLICY IF EXISTS "Users can delete contacts of their clients" ON client_contacts;

    ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

    -- Check which column exists in clients table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clients' AND column_name = 'created_by') THEN
      
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
      
      RAISE NOTICE '[OK] RLS on client_contacts using created_by';
      
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'clients' AND column_name = 'user_id') THEN
      
      CREATE POLICY "Users can view contacts of their clients" ON client_contacts
      FOR SELECT
      USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

      CREATE POLICY "Users can insert contacts for their clients" ON client_contacts
      FOR INSERT
      WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

      CREATE POLICY "Users can update contacts of their clients" ON client_contacts
      FOR UPDATE
      USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

      CREATE POLICY "Users can delete contacts of their clients" ON client_contacts
      FOR DELETE
      USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
      
      RAISE NOTICE '[OK] RLS on client_contacts using user_id';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ client_contacts table does not exist';
  END IF;
END $$;

-- 3. Invoices table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices';
    
    EXECUTE 'ALTER TABLE invoices ENABLE ROW LEVEL SECURITY';
    
    -- Check which columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'created_by') THEN
      
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
      
      RAISE NOTICE '[OK] RLS on invoices using created_by';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'invoices' AND column_name = 'user_id') THEN
      
      EXECUTE 'CREATE POLICY "Users can view their own invoices" ON invoices
      FOR SELECT
      USING (
        auth.uid() = user_id 
        OR 
        client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
      )';
      
      EXECUTE 'CREATE POLICY "Users can insert their own invoices" ON invoices
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
      
      EXECUTE 'CREATE POLICY "Users can update their own invoices" ON invoices
      FOR UPDATE
      USING (auth.uid() = user_id)';
      
      EXECUTE 'CREATE POLICY "Users can delete their own invoices" ON invoices
      FOR DELETE
      USING (auth.uid() = user_id)';
      
      RAISE NOTICE '[OK] RLS on invoices using user_id';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ invoices table does not exist';
  END IF;
END $$;

-- Add indexes for better performance (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_contacts') THEN
    CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
  END IF;
END $$;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '[OK] RLS policies fixed based on actual table structure!';
  RAISE NOTICE '[STATS] Protected tables: tasks, client_contacts, invoices (if exist)';
END $$;
