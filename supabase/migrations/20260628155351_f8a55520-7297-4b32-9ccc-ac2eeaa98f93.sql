CREATE TABLE public.user_saved_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('text','highlight','underline')),
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, color)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_saved_colors TO authenticated;
GRANT ALL ON public.user_saved_colors TO service_role;
ALTER TABLE public.user_saved_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their saved colors" ON public.user_saved_colors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_saved_colors_user_cat ON public.user_saved_colors(user_id, category, created_at DESC);