-- Add recipient_phone to reminders (for WhatsApp)
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

-- Create platform_settings table to store API keys server-side
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only admin/manager can access
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_platform_settings" ON platform_settings;
DROP POLICY IF EXISTS "admin_write_platform_settings" ON platform_settings;

CREATE POLICY "admin_read_platform_settings" ON platform_settings
  FOR SELECT USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "admin_write_platform_settings" ON platform_settings
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));
