-- Some client files were created before saved_quotes was persisted correctly,
-- while their client_payment_stages were created successfully. Recover those
-- links by matching the payment-stage name to a unique task title per client.

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
