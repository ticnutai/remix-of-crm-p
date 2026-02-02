-- Add timer/working days tracking columns to client_stage_tasks table
-- These columns enable tracking of working days for each task

-- Add started_at column - when the timer was started (clicking the start button)
ALTER TABLE client_stage_tasks 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add target_working_days column - the target number of working days (e.g., 45 days)
ALTER TABLE client_stage_tasks 
ADD COLUMN IF NOT EXISTS target_working_days INTEGER DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN client_stage_tasks.started_at IS 'Timestamp when the working days timer was started';
COMMENT ON COLUMN client_stage_tasks.target_working_days IS 'Target number of working days for this task (e.g., 45 for spatial control)';

-- Create index for faster queries on tasks with active timers
CREATE INDEX IF NOT EXISTS idx_client_stage_tasks_started_at ON client_stage_tasks(started_at) WHERE started_at IS NOT NULL;
