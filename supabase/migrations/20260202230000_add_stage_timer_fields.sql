-- Add timer/working days tracking fields to client_stages table
-- This allows tracking working days countdown for entire stages, not just tasks

-- Add started_at column for when the stage timer was started
ALTER TABLE public.client_stages 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add target_working_days column for the target number of working days
ALTER TABLE public.client_stages 
ADD COLUMN IF NOT EXISTS target_working_days INTEGER;

-- Add display_style column for cycling through different visual styles (1-5)
ALTER TABLE public.client_stages 
ADD COLUMN IF NOT EXISTS timer_display_style INTEGER DEFAULT 1;

-- Also add timer_display_style to client_stage_tasks for consistent styling
ALTER TABLE public.client_stage_tasks 
ADD COLUMN IF NOT EXISTS timer_display_style INTEGER DEFAULT 1;

-- Create index for performance when querying stages with active timers
CREATE INDEX IF NOT EXISTS idx_client_stages_started_at ON public.client_stages(started_at) WHERE started_at IS NOT NULL;

COMMENT ON COLUMN public.client_stages.started_at IS 'When the stage timer was started';
COMMENT ON COLUMN public.client_stages.target_working_days IS 'Target number of working days for completion';
COMMENT ON COLUMN public.client_stages.timer_display_style IS 'Visual style for timer display (1-5)';
COMMENT ON COLUMN public.client_stage_tasks.timer_display_style IS 'Visual style for timer display (1-5)';
