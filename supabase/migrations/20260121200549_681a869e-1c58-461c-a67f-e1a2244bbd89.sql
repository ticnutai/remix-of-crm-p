-- Create client categories table
CREATE TABLE public.client_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#1e3a5f',
  icon TEXT DEFAULT 'Users',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_categories ENABLE ROW LEVEL SECURITY;

-- Create policies - all users can view and manage categories
CREATE POLICY "Anyone can view categories" ON public.client_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert categories" ON public.client_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON public.client_categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete categories" ON public.client_categories FOR DELETE USING (true);

-- Add category_id to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.client_categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_category_id ON public.clients(category_id);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN(tags);

-- Insert default categories
INSERT INTO public.client_categories (name, color, icon, sort_order) VALUES 
  ('לקוחות', '#1e3a5f', 'Users', 0),
  ('חברים', '#22c55e', 'Heart', 1),
  ('ספקים', '#f59e0b', 'Building', 2),
  ('שותפים', '#8b5cf6', 'Handshake', 3);

-- Create trigger for updated_at
CREATE TRIGGER update_client_categories_updated_at
BEFORE UPDATE ON public.client_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();