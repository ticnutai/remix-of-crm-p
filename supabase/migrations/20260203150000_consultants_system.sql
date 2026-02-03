-- Consultants System Migration
-- Creates tables for managing consultants (יועצים, מהנדסים, אדריכלים)

-- Create consultants table (global list of consultants)
CREATE TABLE IF NOT EXISTS public.consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  profession TEXT NOT NULL DEFAULT 'יועץ', -- יועץ, מהנדס, אדריכל
  license_number TEXT,
  id_number TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  specialty TEXT, -- התמחות ספציפית (קונסטרוקציה, חשמל, וכו')
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_consultants table (link between tasks and consultants)
CREATE TABLE IF NOT EXISTS public.task_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  consultant_id UUID NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL, -- המילה שזוהתה: יועץ, מהנדס, אדריכל
  keyword_context TEXT, -- ההקשר: "יועץ קונסטרוקציה"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, consultant_id)
);

-- Enable RLS
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_consultants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consultants' AND policyname = 'Users can view all consultants') THEN
    CREATE POLICY "Users can view all consultants" ON public.consultants FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consultants' AND policyname = 'Users can insert consultants') THEN
    CREATE POLICY "Users can insert consultants" ON public.consultants FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consultants' AND policyname = 'Users can update consultants') THEN
    CREATE POLICY "Users can update consultants" ON public.consultants FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consultants' AND policyname = 'Users can delete consultants') THEN
    CREATE POLICY "Users can delete consultants" ON public.consultants FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- RLS Policies for task_consultants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_consultants' AND policyname = 'Users can view task consultants') THEN
    CREATE POLICY "Users can view task consultants" ON public.task_consultants FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_consultants' AND policyname = 'Users can insert task consultants') THEN
    CREATE POLICY "Users can insert task consultants" ON public.task_consultants FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_consultants' AND policyname = 'Users can update task consultants') THEN
    CREATE POLICY "Users can update task consultants" ON public.task_consultants FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_consultants' AND policyname = 'Users can delete task consultants') THEN
    CREATE POLICY "Users can delete task consultants" ON public.task_consultants FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultants_name ON public.consultants(name);
CREATE INDEX IF NOT EXISTS idx_consultants_profession ON public.consultants(profession);
CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_task_consultants_task_id ON public.task_consultants(task_id);
CREATE INDEX IF NOT EXISTS idx_task_consultants_consultant_id ON public.task_consultants(consultant_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER set_consultants_updated_at
  BEFORE UPDATE ON public.consultants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
