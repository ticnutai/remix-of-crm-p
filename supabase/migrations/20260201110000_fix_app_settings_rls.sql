-- Fix app_settings RLS policies to prevent 406 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update own app settings" ON app_settings;
DROP POLICY IF EXISTS "Enable read access for own settings" ON app_settings;
DROP POLICY IF EXISTS "Enable insert for own settings" ON app_settings;
DROP POLICY IF EXISTS "Enable update for own settings" ON app_settings;

-- Create clean, simple policies
CREATE POLICY "app_settings_select_policy"
  ON app_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "app_settings_insert_policy"
  ON app_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "app_settings_update_policy"
  ON app_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create default settings if missing
INSERT INTO app_settings (user_id, vat_rate)
SELECT auth.uid(), 17.0
WHERE NOT EXISTS (
  SELECT 1 FROM app_settings WHERE user_id = auth.uid()
)
AND auth.uid() IS NOT NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON app_settings TO authenticated;
