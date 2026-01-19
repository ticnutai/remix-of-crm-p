-- =============================================================================
-- EXPORT SCRIPT FOR OLD SUPABASE PROJECT (cxzrjgkjikglkrjcmmhe)
-- Run this in the SQL Editor of the OLD project to export data
-- =============================================================================

-- Step 1: Export all tables data as INSERT statements
-- Copy the output and run it in the NEW project after schema is set up

-- Export clients
SELECT 'INSERT INTO clients (id, name, email, phone, address, id_number, company_name, contact_person, status, source, notes, tags, custom_data, gush, helka, migrash, last_contacted_at, created_at, updated_at, created_by) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(address), 'NULL') || ', ' ||
  COALESCE(quote_literal(id_number), 'NULL') || ', ' ||
  COALESCE(quote_literal(company_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(contact_person), 'NULL') || ', ' ||
  COALESCE(quote_literal(status), 'NULL') || ', ' ||
  COALESCE(quote_literal(source), 'NULL') || ', ' ||
  COALESCE(quote_literal(notes), 'NULL') || ', ' ||
  COALESCE('ARRAY[' || array_to_string(tags, ',') || ']', 'NULL') || ', ' ||
  COALESCE(quote_literal(custom_data::text), 'NULL') || '::jsonb, ' ||
  COALESCE(quote_literal(gush), 'NULL') || ', ' ||
  COALESCE(quote_literal(helka), 'NULL') || ', ' ||
  COALESCE(quote_literal(migrash), 'NULL') || ', ' ||
  COALESCE(quote_literal(last_contacted_at::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || ', ' ||
  quote_literal(created_by) ||
') ON CONFLICT (id) DO NOTHING;'
FROM clients;
