-- ====================================
-- Field Quick Options
-- ====================================
-- Stores user-defined preset values for quick entry
-- on built-in fields like gush, helka, migrash, street, etc.

CREATE TABLE IF NOT EXISTS field_quick_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,      -- column name e.g. 'gush', 'helka', 'street'
  option_value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, field_name, option_value)
);

ALTER TABLE field_quick_options ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'field_quick_options' AND policyname = 'fqo_select_own'
  ) THEN
    CREATE POLICY fqo_select_own ON field_quick_options
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'field_quick_options' AND policyname = 'fqo_insert_own'
  ) THEN
    CREATE POLICY fqo_insert_own ON field_quick_options
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'field_quick_options' AND policyname = 'fqo_delete_own'
  ) THEN
    CREATE POLICY fqo_delete_own ON field_quick_options
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fqo_user_field ON field_quick_options(user_id, field_name);
