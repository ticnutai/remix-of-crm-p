-- Repair client files created by the quote editor flow that persisted payment
-- rows but left the corresponding task payment columns empty. A title is used
-- only when it identifies exactly one task for the client.

WITH unique_task_titles AS (
  SELECT client_id, lower(trim(title)) AS normalized_title
  FROM public.client_stage_tasks
  GROUP BY client_id, lower(trim(title))
  HAVING COUNT(*) = 1
),
payment_totals AS (
  SELECT client_id, SUM(amount) AS base_total
  FROM public.client_payment_stages
  GROUP BY client_id
),
latest_payments AS (
  SELECT
    payment.id,
    payment.client_id,
    payment.amount,
    COALESCE(payment.vat_rate, 0) AS vat_rate,
    lower(trim(payment.stage_name)) AS normalized_title,
    ROW_NUMBER() OVER (
      PARTITION BY payment.client_id, lower(trim(payment.stage_name))
      ORDER BY payment.created_at DESC, payment.stage_number DESC
    ) AS row_number
  FROM public.client_payment_stages payment
)
UPDATE public.client_stage_tasks task
SET
  payment_amount = ROUND(payment.amount * (1 + payment.vat_rate / 100.0), 2),
  payment_percentage = CASE
    WHEN totals.base_total > 0
      THEN ROUND(payment.amount * 100 / totals.base_total, 3)
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
