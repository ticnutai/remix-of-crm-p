CREATE TABLE public.flow_design_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_builtin boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_design_presets TO authenticated;
GRANT ALL ON public.flow_design_presets TO service_role;

ALTER TABLE public.flow_design_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own and builtin presets" ON public.flow_design_presets
  FOR SELECT TO authenticated
  USING (is_builtin = true OR user_id = auth.uid());

CREATE POLICY "Users insert own presets" ON public.flow_design_presets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_builtin = false);

CREATE POLICY "Users update own presets" ON public.flow_design_presets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_builtin = false)
  WITH CHECK (user_id = auth.uid() AND is_builtin = false);

CREATE POLICY "Users delete own presets" ON public.flow_design_presets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND is_builtin = false);

CREATE TRIGGER flow_design_presets_updated_at
  BEFORE UPDATE ON public.flow_design_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.flow_design_presets (name, is_builtin, config) VALUES
('קלאסי משפטי', true, '{"fonts":{"body":"Frank Ruhl Libre, serif","heading":"Frank Ruhl Libre, serif","size":"14px"},"colors":{"text":"#1a1a1a","heading":"#000000","accent":"#7a1f1f","muted":"#666666"},"spacing":{"lineHeight":"1.8","paragraphGap":"12px"},"headings":{"h1":{"size":"24px","weight":"700"},"h2":{"size":"19px","weight":"700"}},"page":{"margin":"20mm"}}'::jsonb),
('יוקרתי נייבי-זהב', true, '{"fonts":{"body":"Heebo, sans-serif","heading":"Heebo, sans-serif","size":"14px"},"colors":{"text":"#162C58","heading":"#162C58","accent":"#d8ac27","muted":"#5a6a85"},"spacing":{"lineHeight":"1.7","paragraphGap":"14px"},"headings":{"h1":{"size":"26px","weight":"700"},"h2":{"size":"20px","weight":"600"}},"page":{"margin":"22mm"}}'::jsonb),
('מודרני מינימלי', true, '{"fonts":{"body":"Heebo, sans-serif","heading":"Heebo, sans-serif","size":"13px"},"colors":{"text":"#222222","heading":"#111111","accent":"#3B82F6","muted":"#888888"},"spacing":{"lineHeight":"1.6","paragraphGap":"10px"},"headings":{"h1":{"size":"22px","weight":"600"},"h2":{"size":"17px","weight":"600"}},"page":{"margin":"18mm"}}'::jsonb);