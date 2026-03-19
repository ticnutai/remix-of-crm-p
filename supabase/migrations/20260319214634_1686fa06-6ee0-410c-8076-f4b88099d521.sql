
CREATE TABLE IF NOT EXISTS public.input_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_key TEXT NOT NULL,
  field_value TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  use_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, field_key, field_value)
);

ALTER TABLE public.input_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own input history"
ON public.input_history
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_input_history_user_field ON public.input_history(user_id, field_key);
