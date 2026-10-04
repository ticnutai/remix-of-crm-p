-- מספר תב"ע חדשה (new zoning plan number) on the client.
-- Free text: numbers, letters and symbols, so TEXT with no format check.
-- Edited from the client card / client form and synced from quotes (legacy
-- editor, flow engine and Quotes Pro) back to this column — same as
-- minhal_contract_number.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS new_taba_number TEXT;

COMMENT ON COLUMN public.clients.new_taba_number IS 'מספר תב"ע חדשה — טקסט חופשי (מספרים, אותיות וסימנים)';
