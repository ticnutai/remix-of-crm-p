-- First-class client tags: persistent names, colors and ordering.
CREATE TABLE IF NOT EXISTS public.client_tag_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  color TEXT NOT NULL DEFAULT '#1e3a5f',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_tag_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view client tag definitions"
  ON public.client_tag_definitions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert client tag definitions"
  ON public.client_tag_definitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update client tag definitions"
  ON public.client_tag_definitions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete client tag definitions"
  ON public.client_tag_definitions FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_client_tag_definitions_sort_order
  ON public.client_tag_definitions(sort_order, name);

-- Preserve every legacy tag that already exists on a client.
INSERT INTO public.client_tag_definitions (name, sort_order)
SELECT tag_name, row_number() OVER (ORDER BY tag_name) - 1
FROM (
  SELECT DISTINCT btrim(unnest(tags)) AS tag_name
  FROM public.clients
  WHERE tags IS NOT NULL
) legacy_tags
WHERE tag_name <> ''
ON CONFLICT (name) DO NOTHING;

DROP TRIGGER IF EXISTS update_client_tag_definitions_updated_at
  ON public.client_tag_definitions;
CREATE TRIGGER update_client_tag_definitions_updated_at
BEFORE UPDATE ON public.client_tag_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
