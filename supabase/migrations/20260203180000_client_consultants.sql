-- Client-Consultant relationship table
-- Allows tracking which consultants work with which clients

-- Create client_consultants table
CREATE TABLE IF NOT EXISTS public.client_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,
  role TEXT, -- תפקיד היועץ עבור לקוח זה
  start_date DATE, -- תאריך התחלת עבודה
  end_date DATE, -- תאריך סיום עבודה (null = פעיל)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, consultant_id)
);

-- Enable RLS
ALTER TABLE public.client_consultants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_consultants' AND policyname = 'Users can view client consultants') THEN
    CREATE POLICY "Users can view client consultants" ON public.client_consultants FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_consultants' AND policyname = 'Users can insert client consultants') THEN
    CREATE POLICY "Users can insert client consultants" ON public.client_consultants FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_consultants' AND policyname = 'Users can update client consultants') THEN
    CREATE POLICY "Users can update client consultants" ON public.client_consultants FOR UPDATE TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_consultants' AND policyname = 'Users can delete client consultants') THEN
    CREATE POLICY "Users can delete client consultants" ON public.client_consultants FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_consultants_client_id ON public.client_consultants(client_id);
CREATE INDEX IF NOT EXISTS idx_client_consultants_consultant_id ON public.client_consultants(consultant_id);
CREATE INDEX IF NOT EXISTS idx_client_consultants_status ON public.client_consultants(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_client_consultants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_client_consultants_updated_at ON public.client_consultants;
CREATE TRIGGER set_client_consultants_updated_at
  BEFORE UPDATE ON public.client_consultants
  FOR EACH ROW
  EXECUTE FUNCTION update_client_consultants_updated_at();

-- Add client classification columns
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS classification TEXT, -- סיווג: VIP, רגיל, פוטנציאלי
ADD COLUMN IF NOT EXISTS industry TEXT, -- תעשייה/ענף
ADD COLUMN IF NOT EXISTS source TEXT, -- מקור הגעה: המלצה, אינטרנט, פרסום
ADD COLUMN IF NOT EXISTS tags TEXT[]; -- תגיות לסיווג גמיש

-- Index for classification
CREATE INDEX IF NOT EXISTS idx_clients_classification ON public.clients(classification);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON public.clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_source ON public.clients(source);
