-- Add linked_client_id and linked_contact_id to client_stage_tasks
-- Allows linking a task to a specific client or contact for reference

ALTER TABLE client_stage_tasks
  ADD COLUMN IF NOT EXISTS linked_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_contact_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL;
