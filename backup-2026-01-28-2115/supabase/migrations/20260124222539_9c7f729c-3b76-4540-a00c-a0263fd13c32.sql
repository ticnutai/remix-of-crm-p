-- Create employees table if not exists
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT,
  position TEXT,
  hourly_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  hire_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage employees" ON public.employees
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can view employees" ON public.employees
  FOR SELECT USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Employees can view themselves" ON public.employees
  FOR SELECT USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add language column to user_preferences if not exists
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'he';

-- Add other potentially missing columns from backup
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jerusalem';

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY';

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS time_format TEXT DEFAULT '24h';

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS week_start TEXT DEFAULT 'sunday';