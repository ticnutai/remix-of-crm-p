
-- Table for saved quotes (from the template editor)
CREATE TABLE public.saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.quote_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  base_price NUMERIC DEFAULT 0,
  vat_rate NUMERIC DEFAULT 17,
  total_with_vat NUMERIC DEFAULT 0,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  project_details JSONB DEFAULT '{}'::jsonb,
  payment_schedule JSONB DEFAULT '[]'::jsonb,
  design_settings JSONB DEFAULT '{}'::jsonb,
  text_boxes JSONB DEFAULT '[]'::jsonb,
  upgrades JSONB DEFAULT '[]'::jsonb,
  pricing_tiers JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved quotes"
  ON public.saved_quotes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_saved_quotes_updated_at
  BEFORE UPDATE ON public.saved_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
