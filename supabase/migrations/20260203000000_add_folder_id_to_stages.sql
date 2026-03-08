-- Migration: Add folder_id to client_stages
-- This allows stages to be organized into folders

-- Add folder_id column to client_stages table
ALTER TABLE public.client_stages
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.client_folders(id) ON DELETE SET NULL;

-- Create index for faster folder filtering
CREATE INDEX IF NOT EXISTS idx_client_stages_folder_id ON public.client_stages(folder_id);

-- Add a comment explaining the column
COMMENT ON COLUMN public.client_stages.folder_id IS 'Reference to the folder this stage belongs to (optional)';
