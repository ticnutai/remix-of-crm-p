-- Add styling columns to client_stage_tasks table
-- These columns allow users to customize the appearance of individual tasks

-- Add background_color column (stores hex color like #FF5733 or null for default)
ALTER TABLE client_stage_tasks 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT NULL;

-- Add text_color column (stores hex color or null for default)
ALTER TABLE client_stage_tasks 
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT NULL;

-- Add is_bold column (boolean for bold text)
ALTER TABLE client_stage_tasks 
ADD COLUMN IF NOT EXISTS is_bold BOOLEAN DEFAULT FALSE;

-- Add a comment to describe the columns
COMMENT ON COLUMN client_stage_tasks.background_color IS 'Custom background color for the task row (hex color)';
COMMENT ON COLUMN client_stage_tasks.text_color IS 'Custom text color for the task title (hex color)';
COMMENT ON COLUMN client_stage_tasks.is_bold IS 'Whether the task title should be displayed in bold';
