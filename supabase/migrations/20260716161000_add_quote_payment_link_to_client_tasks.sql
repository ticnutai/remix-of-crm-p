-- Persist the quote payment assigned to each client-stage task.
-- This makes the client board independent of quote status and name-only joins.

ALTER TABLE public.client_stage_tasks
  ADD COLUMN IF NOT EXISTS payment_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS payment_percentage numeric(7,3),
  ADD COLUMN IF NOT EXISTS payment_quote_id uuid REFERENCES public.saved_quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_step_id text;

CREATE INDEX IF NOT EXISTS idx_client_stage_tasks_payment_quote_id
  ON public.client_stage_tasks(payment_quote_id)
  WHERE payment_quote_id IS NOT NULL;

COMMENT ON COLUMN public.client_stage_tasks.payment_amount IS
  'Base (pre-VAT) amount assigned to this task by a quote payment step.';
COMMENT ON COLUMN public.client_stage_tasks.payment_percentage IS
  'Quote percentage assigned to this task.';
COMMENT ON COLUMN public.client_stage_tasks.payment_quote_id IS
  'Saved quote that last assigned the payment to this task.';
COMMENT ON COLUMN public.client_stage_tasks.payment_step_id IS
  'Payment-schedule step id inside the saved quote.';

-- Backfill existing linked schedules. The newest non-cancelled quote wins per task.
WITH candidates AS (
  SELECT
    task.id AS task_id,
    quote.id AS quote_id,
    step.value ->> 'id' AS step_id,
    NULLIF(step.value ->> 'percentage', '')::numeric AS percentage,
    ROUND(
      COALESCE(quote.base_price, 0)::numeric *
      NULLIF(step.value ->> 'percentage', '')::numeric / 100,
      2
    ) AS amount,
    ROW_NUMBER() OVER (
      PARTITION BY task.id
      ORDER BY quote.updated_at DESC, quote.created_at DESC
    ) AS row_number
  FROM public.saved_quotes quote
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(quote.payment_schedule) = 'array' THEN quote.payment_schedule
      ELSE '[]'::jsonb
    END
  ) AS step(value)
  JOIN public.client_stages stage
    ON stage.client_id = quote.client_id
   AND lower(trim(stage.stage_name)) = lower(trim(step.value ->> 'templateStageName'))
  JOIN public.client_stage_tasks task
    ON task.client_id = quote.client_id
   AND task.stage_id = stage.stage_id
   AND lower(trim(task.title)) = lower(trim(step.value ->> 'templateTaskName'))
  WHERE quote.client_id IS NOT NULL
    AND quote.status NOT IN ('rejected', 'expired', 'cancelled')
    AND NULLIF(step.value ->> 'percentage', '')::numeric > 0
    AND COALESCE(quote.base_price, 0) > 0
)
UPDATE public.client_stage_tasks task
SET
  payment_amount = candidate.amount,
  payment_percentage = candidate.percentage,
  payment_quote_id = candidate.quote_id,
  payment_step_id = candidate.step_id
FROM candidates candidate
WHERE candidate.row_number = 1
  AND task.id = candidate.task_id;
