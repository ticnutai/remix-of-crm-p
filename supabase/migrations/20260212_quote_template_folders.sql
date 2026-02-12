-- Migration: Add folder support for quote templates
-- Allows organizing quote templates into folders

-- Create folders table
CREATE TABLE IF NOT EXISTS public.quote_template_folders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    color text DEFAULT '#d8ac27',
    icon text DEFAULT 'folder',
    sort_order integer DEFAULT 0,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add folder_id to quote_templates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quote_templates' AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE public.quote_templates 
        ADD COLUMN folder_id uuid REFERENCES public.quote_template_folders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.quote_template_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_template_folders_select' AND tablename = 'quote_template_folders') THEN
        CREATE POLICY quote_template_folders_select ON public.quote_template_folders FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_template_folders_insert' AND tablename = 'quote_template_folders') THEN
        CREATE POLICY quote_template_folders_insert ON public.quote_template_folders FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_template_folders_update' AND tablename = 'quote_template_folders') THEN
        CREATE POLICY quote_template_folders_update ON public.quote_template_folders FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_template_folders_delete' AND tablename = 'quote_template_folders') THEN
        CREATE POLICY quote_template_folders_delete ON public.quote_template_folders FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Auto update updated_at trigger
CREATE OR REPLACE FUNCTION update_quote_template_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quote_template_folders_updated_at ON public.quote_template_folders;
CREATE TRIGGER update_quote_template_folders_updated_at
    BEFORE UPDATE ON public.quote_template_folders
    FOR EACH ROW EXECUTE FUNCTION update_quote_template_folders_updated_at();

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_quote_templates_folder_id ON public.quote_templates(folder_id);
