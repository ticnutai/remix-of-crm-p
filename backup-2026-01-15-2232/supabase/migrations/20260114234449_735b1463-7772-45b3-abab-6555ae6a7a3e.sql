-- Add data_type_id column to client_stages to link stages with data types
ALTER TABLE public.client_stages 
ADD COLUMN IF NOT EXISTS data_type_id UUID REFERENCES public.data_types(id) ON DELETE SET NULL;

-- Add is_completed column to track stage completion status
ALTER TABLE public.client_stages 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Add completed_at column to track when stage was completed
ALTER TABLE public.client_stages 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_stages_data_type_id ON public.client_stages(data_type_id);
CREATE INDEX IF NOT EXISTS idx_client_stages_is_completed ON public.client_stages(is_completed);

-- Enable realtime for client_stages
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_stages;