-- ====================================
-- Custom Client Fields System
-- ====================================
-- Stores definitions for dynamic custom fields that users can add to clients.
-- Field values are stored in the existing clients.custom_data JSONB column.

-- Table for field definitions (shared per user)
CREATE TABLE IF NOT EXISTS client_custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,           -- unique key per user (e.g. "membership_type")
  label TEXT NOT NULL,               -- display label (e.g. "סוג חברות")
  field_type TEXT NOT NULL DEFAULT 'text',  -- text, number, date, select, email, phone, textarea
  options JSONB DEFAULT '[]'::jsonb, -- for select type: ["option1","option2"]
  placeholder TEXT DEFAULT '',
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  section TEXT DEFAULT 'custom',     -- section grouping
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, field_key)
);

-- Enable RLS
ALTER TABLE client_custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_custom_field_definitions' 
    AND policyname = 'ccfd_select_own'
  ) THEN
    CREATE POLICY ccfd_select_own ON client_custom_field_definitions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_custom_field_definitions' 
    AND policyname = 'ccfd_insert_own'
  ) THEN
    CREATE POLICY ccfd_insert_own ON client_custom_field_definitions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_custom_field_definitions' 
    AND policyname = 'ccfd_update_own'
  ) THEN
    CREATE POLICY ccfd_update_own ON client_custom_field_definitions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_custom_field_definitions' 
    AND policyname = 'ccfd_delete_own'
  ) THEN
    CREATE POLICY ccfd_delete_own ON client_custom_field_definitions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_ccfd_user_id ON client_custom_field_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_ccfd_sort ON client_custom_field_definitions(user_id, sort_order);

-- Ensure clients.custom_data column exists and has a good default
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'custom_data'
  ) THEN
    -- Column exists, ensure default is set
    ALTER TABLE clients ALTER COLUMN custom_data SET DEFAULT '{}'::jsonb;
  ELSE
    -- Column doesn't exist, create it
    ALTER TABLE clients ADD COLUMN custom_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
