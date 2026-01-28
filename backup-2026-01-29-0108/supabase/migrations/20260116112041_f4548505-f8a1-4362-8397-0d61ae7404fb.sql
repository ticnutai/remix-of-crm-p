-- Create google_calendar_settings table for sync preferences
CREATE TABLE IF NOT EXISTS public.google_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sync_direction TEXT DEFAULT 'one_way' CHECK (sync_direction IN ('one_way', 'two_way')),
  selected_calendars JSONB DEFAULT '["primary"]',
  auto_sync_enabled BOOLEAN DEFAULT false,
  auto_sync_interval INTEGER DEFAULT 30,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own settings"
  ON public.google_calendar_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.google_calendar_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.google_calendar_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON public.google_calendar_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_google_calendar_settings_updated_at
  BEFORE UPDATE ON public.google_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();