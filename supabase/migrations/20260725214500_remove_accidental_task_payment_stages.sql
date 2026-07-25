-- A short-lived client sync created a zero-value payment-stage row whenever a
-- regular stage task was completed. Such rows have a task link but no payable
-- amount, so they cannot be real payment milestones.
DELETE FROM public.client_payment_stages
WHERE linked_task_id IS NOT NULL
  AND COALESCE(amount, 0) = 0
  AND COALESCE(amount_with_vat, 0) = 0;
