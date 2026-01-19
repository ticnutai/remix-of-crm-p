-- Add ui_preferences column to store all UI/localStorage preferences as JSON
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS ui_preferences jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_preferences.ui_preferences IS 'Stores all UI preferences synced from localStorage (theme, filters, view modes, etc.)';
