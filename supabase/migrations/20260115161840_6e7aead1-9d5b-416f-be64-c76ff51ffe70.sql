-- Create client_deadlines table
CREATE TABLE IF NOT EXISTS public.client_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  
  start_date DATE NOT NULL,
  deadline_days INTEGER NOT NULL,
  
  reminder_days INTEGER[] DEFAULT ARRAY[10, 5, 3, 1],
  
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  linked_stage_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_deadlines_client_id ON public.client_deadlines(client_id);
CREATE INDEX IF NOT EXISTS idx_client_deadlines_user_id ON public.client_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_client_deadlines_status ON public.client_deadlines(status);

-- Enable RLS
ALTER TABLE public.client_deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own client deadlines"
  ON public.client_deadlines FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client deadlines"
  ON public.client_deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client deadlines"
  ON public.client_deadlines FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client deadlines"
  ON public.client_deadlines FOR DELETE USING (auth.uid() = user_id);

-- Create deadline_templates table
CREATE TABLE IF NOT EXISTS public.deadline_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  deadline_days INTEGER NOT NULL,
  reminder_days INTEGER[] DEFAULT ARRAY[10, 5, 3, 1],
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deadline_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view system and own templates"
  ON public.deadline_templates FOR SELECT
  USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON public.deadline_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can update own templates"
  ON public.deadline_templates FOR UPDATE
  USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can delete own templates"
  ON public.deadline_templates FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- Insert default system templates
INSERT INTO public.deadline_templates (title, description, category, deadline_days, reminder_days, is_system) VALUES
  ('Submission to local committee', 'Deadline for local committee submission', 'submission', 45, ARRAY[10, 5, 3, 1], TRUE),
  ('Response from local committee', 'Waiting time for local committee response', 'response', 30, ARRAY[7, 3, 1], TRUE),
  ('Response from district committee', 'Waiting time for district committee response', 'response', 45, ARRAY[10, 5, 3, 1], TRUE),
  ('Appeal submission', 'Deadline for appeal submission', 'appeal', 14, ARRAY[5, 3, 1], TRUE),
  ('Complete documents', 'Deadline for completing missing documents', 'submission', 21, ARRAY[7, 3, 1], TRUE),
  ('Fire department response', 'Waiting time for fire department approval', 'response', 14, ARRAY[5, 3, 1], TRUE),
  ('Municipality response', 'Waiting time for municipality response', 'response', 30, ARRAY[7, 3, 1], TRUE),
  ('Building permit', 'Building permit process', 'permit', 90, ARRAY[30, 14, 7, 3], TRUE),
  ('Zoning plan approval', 'Zoning plan approval process', 'permit', 180, ARRAY[30, 14, 7], TRUE),
  ('Permit validity', 'Building permit validity period', 'permit', 365, ARRAY[60, 30, 14, 7], TRUE);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_client_deadlines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS client_deadlines_updated_at ON public.client_deadlines;
CREATE TRIGGER client_deadlines_updated_at
  BEFORE UPDATE ON public.client_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_deadlines_updated_at();