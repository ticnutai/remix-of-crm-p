-- Employee-Client Assignment table
-- Allows defining which clients each employee can access/see

-- Create employee_client_assignments table
CREATE TABLE IF NOT EXISTS public.employee_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, client_id)
);

-- Enable RLS
ALTER TABLE public.employee_client_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_client_assignments' AND policyname = 'Users can view employee client assignments') THEN
    CREATE POLICY "Users can view employee client assignments" ON public.employee_client_assignments FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_client_assignments' AND policyname = 'Users can insert employee client assignments') THEN
    CREATE POLICY "Users can insert employee client assignments" ON public.employee_client_assignments FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_client_assignments' AND policyname = 'Users can update employee client assignments') THEN
    CREATE POLICY "Users can update employee client assignments" ON public.employee_client_assignments FOR UPDATE TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_client_assignments' AND policyname = 'Users can delete employee client assignments') THEN
    CREATE POLICY "Users can delete employee client assignments" ON public.employee_client_assignments FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eca_employee_id ON public.employee_client_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_eca_client_id ON public.employee_client_assignments(client_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_client_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employee_client_assignments_updated_at ON public.employee_client_assignments;
CREATE TRIGGER set_employee_client_assignments_updated_at
  BEFORE UPDATE ON public.employee_client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_client_assignments_updated_at();
