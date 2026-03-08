-- Migration: Add content fields to stage_template_tasks
-- This allows saving template tasks with their completion status and styling

-- Add content fields to template tasks
ALTER TABLE public.stage_template_tasks 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS background_color TEXT,
ADD COLUMN IF NOT EXISTS text_color TEXT,
ADD COLUMN IF NOT EXISTS is_bold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_working_days INTEGER,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Also add a flag to stage_templates to indicate if it includes content
ALTER TABLE public.stage_templates
ADD COLUMN IF NOT EXISTS includes_task_content BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.stage_template_tasks.completed IS 'Task completion status when saved as template';
COMMENT ON COLUMN public.stage_template_tasks.completed_at IS 'Completion timestamp when saved as template';
COMMENT ON COLUMN public.stage_template_tasks.background_color IS 'Task background color';
COMMENT ON COLUMN public.stage_template_tasks.text_color IS 'Task text color';
COMMENT ON COLUMN public.stage_template_tasks.is_bold IS 'Whether task title is bold';
COMMENT ON COLUMN public.stage_template_tasks.target_working_days IS 'Target days to complete task';
COMMENT ON COLUMN public.stage_template_tasks.started_at IS 'Task timer start timestamp';
COMMENT ON COLUMN public.stage_templates.includes_task_content IS 'Whether template includes task completion data';
