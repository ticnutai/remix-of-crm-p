-- Add sidebar_theme JSONB column to user_preferences for cloud persistence
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS sidebar_theme jsonb DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.user_preferences.sidebar_theme IS 'Sidebar theme settings (colors, fonts, sizes) stored as JSON';
