-- Repair payment links that were saved before the client stage tasks existed.
-- The application now syncs tasks before applying these links, while this
-- migration restores existing data and supports both assignment-source shapes.

WITH quote_candidates AS (
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
   AND lower(trim(stage.stage_name)) = lower(trim(COALESCE(
     NULLIF(step.value ->> 'templateStageName', ''),
     NULLIF(step.value ->> 'quoteTemplateStageName', '')
   )))
  JOIN public.client_stage_tasks task
    ON task.client_id = quote.client_id
   AND task.stage_id = stage.stage_id
   AND lower(trim(task.title)) = lower(trim(COALESCE(
     NULLIF(step.value ->> 'templateTaskName', ''),
     NULLIF(step.value ->> 'quoteTemplateItemText', '')
   )))
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
FROM quote_candidates candidate
WHERE candidate.row_number = 1
  AND task.id = candidate.task_id;

-- Older client files sometimes have payment rows but no usable saved quote.
-- In that case restore a link only when the payment name identifies one unique
-- task in the client, so the repair cannot attach money to an ambiguous task.
WITH payment_totals AS (
  SELECT client_id, SUM(amount) AS total_amount
  FROM public.client_payment_stages
  GROUP BY client_id
),
unique_task_titles AS (
  SELECT client_id, lower(trim(title)) AS normalized_title
  FROM public.client_stage_tasks
  GROUP BY client_id, lower(trim(title))
  HAVING COUNT(*) = 1
),
latest_payments AS (
  SELECT
    payment.id,
    payment.client_id,
    payment.amount,
    lower(trim(payment.stage_name)) AS normalized_title,
    ROW_NUMBER() OVER (
      PARTITION BY payment.client_id, lower(trim(payment.stage_name))
      ORDER BY payment.created_at DESC, payment.stage_number DESC
    ) AS row_number
  FROM public.client_payment_stages payment
)
UPDATE public.client_stage_tasks task
SET
  payment_amount = payment.amount,
  payment_percentage = CASE
    WHEN totals.total_amount > 0
      THEN ROUND(payment.amount * 100 / totals.total_amount, 3)
    ELSE NULL
  END,
  payment_step_id = 'client_payment_stage:' || payment.id::text
FROM latest_payments payment
JOIN unique_task_titles unique_title
  ON unique_title.client_id = payment.client_id
 AND unique_title.normalized_title = payment.normalized_title
JOIN payment_totals totals
  ON totals.client_id = payment.client_id
WHERE payment.row_number = 1
  AND task.client_id = payment.client_id
  AND lower(trim(task.title)) = payment.normalized_title
  AND task.payment_amount IS NULL;
