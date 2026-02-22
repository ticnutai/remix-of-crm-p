-- Add calendar_view preference column to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS calendar_view TEXT DEFAULT 'month';
