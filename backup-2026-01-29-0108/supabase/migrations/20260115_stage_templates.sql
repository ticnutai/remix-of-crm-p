-- Stage Templates System
-- Global templates that can be applied to any client

-- Templates table - stores template metadata
CREATE TABLE IF NOT EXISTS public.stage_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Layers',
    color TEXT DEFAULT '#1e3a5f',
    is_multi_stage BOOLEAN DEFAULT false, -- true = contains multiple stages
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Template stages - for multi-stage templates
CREATE TABLE IF NOT EXISTS public.stage_template_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.stage_templates(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    stage_icon TEXT DEFAULT 'FolderOpen',
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Template tasks - tasks within each template stage
CREATE TABLE IF NOT EXISTS public.stage_template_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.stage_templates(id) ON DELETE CASCADE,
    template_stage_id UUID REFERENCES public.stage_template_stages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stage_template_stages_template_id ON public.stage_template_stages(template_id);
CREATE INDEX IF NOT EXISTS idx_stage_template_tasks_template_id ON public.stage_template_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_stage_template_tasks_stage_id ON public.stage_template_tasks(template_stage_id);

-- Enable RLS
ALTER TABLE public.stage_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_template_tasks ENABLE ROW LEVEL SECURITY;

-- Policies - Global read access, authenticated write access
CREATE POLICY "Anyone can read templates" ON public.stage_templates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create templates" ON public.stage_templates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update templates" ON public.stage_templates
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete templates" ON public.stage_templates
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Same policies for template stages
CREATE POLICY "Anyone can read template stages" ON public.stage_template_stages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage template stages" ON public.stage_template_stages
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Same policies for template tasks
CREATE POLICY "Anyone can read template tasks" ON public.stage_template_tasks
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage template tasks" ON public.stage_template_tasks
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_stage_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stage_templates_timestamp
    BEFORE UPDATE ON public.stage_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_stage_templates_updated_at();

-- Comments
COMMENT ON TABLE public.stage_templates IS 'Global templates for client stages and tasks';
COMMENT ON TABLE public.stage_template_stages IS 'Stages within a multi-stage template';
COMMENT ON TABLE public.stage_template_tasks IS 'Tasks within template stages';
