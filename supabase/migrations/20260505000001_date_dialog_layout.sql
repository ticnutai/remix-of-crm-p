-- Add date_dialog_layout column to user_preferences for persisting dialog position/size
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS date_dialog_layout JSONB DEFAULT NULL;
