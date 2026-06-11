-- Saved quote payment events (actual payments by payment schedule steps)
CREATE TABLE IF NOT EXISTS public.saved_quote_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_quote_id uuid NOT NULL REFERENCES public.saved_quotes(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  step_name text NOT NULL,
  amount_net numeric(12,2) NOT NULL DEFAULT 0,
  amount_vat numeric(12,2) NOT NULL DEFAULT 0,
  amount_total numeric(12,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 17,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  is_full_payment boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_quote_payment_events_client_id
  ON public.saved_quote_payment_events(client_id);

CREATE INDEX IF NOT EXISTS idx_saved_quote_payment_events_saved_quote_id
  ON public.saved_quote_payment_events(saved_quote_id);

CREATE INDEX IF NOT EXISTS idx_saved_quote_payment_events_payment_date
  ON public.saved_quote_payment_events(payment_date DESC);

ALTER TABLE public.saved_quote_payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own saved quote payment events" ON public.saved_quote_payment_events;
CREATE POLICY "Users can read own saved quote payment events"
  ON public.saved_quote_payment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.saved_quotes sq
      WHERE sq.id = saved_quote_payment_events.saved_quote_id
        AND sq.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own saved quote payment events" ON public.saved_quote_payment_events;
CREATE POLICY "Users can insert own saved quote payment events"
  ON public.saved_quote_payment_events
  FOR INSERT
  WITH CHECK (
    (created_by IS NULL OR created_by = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.saved_quotes sq
      WHERE sq.id = saved_quote_payment_events.saved_quote_id
        AND sq.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own saved quote payment events" ON public.saved_quote_payment_events;
CREATE POLICY "Users can update own saved quote payment events"
  ON public.saved_quote_payment_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.saved_quotes sq
      WHERE sq.id = saved_quote_payment_events.saved_quote_id
        AND sq.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.saved_quotes sq
      WHERE sq.id = saved_quote_payment_events.saved_quote_id
        AND sq.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own saved quote payment events" ON public.saved_quote_payment_events;
CREATE POLICY "Users can delete own saved quote payment events"
  ON public.saved_quote_payment_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.saved_quotes sq
      WHERE sq.id = saved_quote_payment_events.saved_quote_id
        AND sq.user_id = auth.uid()
    )
  );
