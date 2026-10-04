-- מספר חוזה מנהל (Israel Land Authority contract number) on the client.
-- Free text: numbers, letters and symbols (e.g. "12/345-א"), so TEXT, no format check.
-- Edited from the client card / client form and synced from quotes (legacy editor,
-- flow engine and Quotes Pro) back to this column.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS minhal_contract_number TEXT;

COMMENT ON COLUMN public.clients.minhal_contract_number IS 'מספר חוזה מנהל — טקסט חופשי (מספרים, אותיות וסימנים)';
