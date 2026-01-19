-- =============================================================================
-- COMPLETE DATA EXPORT SCRIPT
-- Run this in SQL Editor of OLD project: cxzrjgkjikglkrjcmmhe
-- =============================================================================

-- This will generate INSERT statements for all main tables
-- Copy the OUTPUT and run it in the NEW project

-- =============================================================================
-- 1. PROFILES (users)
-- =============================================================================
SELECT 'INSERT INTO profiles (id, email, full_name, avatar_url, role, ui_preferences, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(full_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(role), '''user''') || ', ' ||
  COALESCE(quote_literal(ui_preferences::text) || '::jsonb', 'NULL') || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM profiles;

-- =============================================================================
-- 1.5. USER_ROLES
-- =============================================================================
SELECT 'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(user_id) || ', ' ||
  quote_literal(role::text) || '::app_role, ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM user_roles;

-- =============================================================================
-- 2. CLIENTS
-- =============================================================================
SELECT 'INSERT INTO clients (id, name, email, phone, address, id_number, company_name, contact_person, status, source, notes, created_by, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(address), 'NULL') || ', ' ||
  COALESCE(quote_literal(id_number), 'NULL') || ', ' ||
  COALESCE(quote_literal(company_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(contact_person), 'NULL') || ', ' ||
  COALESCE(quote_literal(status), '''active''') || ', ' ||
  COALESCE(quote_literal(source), 'NULL') || ', ' ||
  COALESCE(quote_literal(notes), 'NULL') || ', ' ||
  quote_literal(created_by) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM clients;

-- =============================================================================
-- 3. PROJECTS
-- =============================================================================
SELECT 'INSERT INTO projects (id, client_id, name, description, status, start_date, end_date, budget, created_by, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(client_id) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  COALESCE(quote_literal(status), '''active''') || ', ' ||
  COALESCE(quote_literal(start_date::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(end_date::text), 'NULL') || ', ' ||
  COALESCE(budget::text, 'NULL') || ', ' ||
  quote_literal(created_by) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM projects;

-- =============================================================================
-- 4. TASKS
-- =============================================================================
SELECT 'INSERT INTO tasks (id, title, description, status, priority, due_date, client_id, project_id, assigned_to, created_by, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(title) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  COALESCE(quote_literal(status), '''pending''') || ', ' ||
  COALESCE(quote_literal(priority), '''medium''') || ', ' ||
  COALESCE(quote_literal(due_date::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(client_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(project_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(assigned_to), 'NULL') || ', ' ||
  quote_literal(created_by) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM tasks;

-- =============================================================================
-- 5. TIME ENTRIES
-- =============================================================================
SELECT 'INSERT INTO time_entries (id, user_id, client_id, project_id, task_id, description, start_time, end_time, duration_minutes, billable, hourly_rate, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(user_id) || ', ' ||
  COALESCE(quote_literal(client_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(project_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(task_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(start_time::text) || ', ' ||
  COALESCE(quote_literal(end_time::text), 'NULL') || ', ' ||
  COALESCE(duration_minutes::text, 'NULL') || ', ' ||
  COALESCE(billable::text, 'true') || ', ' ||
  COALESCE(hourly_rate::text, 'NULL') || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM time_entries;

-- =============================================================================
-- 6. QUOTES
-- =============================================================================
SELECT 'INSERT INTO quotes (id, quote_number, client_id, project_id, title, description, items, subtotal, discount_type, discount_value, vat_rate, total, status, valid_until, notes, created_by, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(quote_number) || ', ' ||
  quote_literal(client_id) || ', ' ||
  COALESCE(quote_literal(project_id), 'NULL') || ', ' ||
  quote_literal(title) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(items::text) || '::jsonb, ' ||
  subtotal::text || ', ' ||
  COALESCE(quote_literal(discount_type), 'NULL') || ', ' ||
  COALESCE(discount_value::text, '0') || ', ' ||
  COALESCE(vat_rate::text, '17') || ', ' ||
  total::text || ', ' ||
  COALESCE(quote_literal(status), '''draft''') || ', ' ||
  COALESCE(quote_literal(valid_until::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(notes), 'NULL') || ', ' ||
  quote_literal(created_by) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM quotes;

-- =============================================================================
-- 7. CONTRACTS
-- =============================================================================
SELECT 'INSERT INTO contracts (id, contract_number, client_id, project_id, title, description, contract_type, contract_value, start_date, end_date, signed_date, status, created_by, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(contract_number) || ', ' ||
  quote_literal(client_id) || ', ' ||
  COALESCE(quote_literal(project_id), 'NULL') || ', ' ||
  quote_literal(title) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  COALESCE(quote_literal(contract_type), 'NULL') || ', ' ||
  contract_value::text || ', ' ||
  quote_literal(start_date::text) || ', ' ||
  COALESCE(quote_literal(end_date::text), 'NULL') || ', ' ||
  quote_literal(signed_date::text) || ', ' ||
  COALESCE(quote_literal(status), '''draft''') || ', ' ||
  quote_literal(created_by) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM contracts;

-- =============================================================================
-- 8. INVOICES
-- =============================================================================
SELECT 'INSERT INTO invoices (id, invoice_number, client_id, project_id, contract_id, quote_id, title, items, subtotal, vat_rate, total, status, issue_date, due_date, paid_date, created_by, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(invoice_number) || ', ' ||
  quote_literal(client_id) || ', ' ||
  COALESCE(quote_literal(project_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(contract_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(quote_id), 'NULL') || ', ' ||
  quote_literal(title) || ', ' ||
  quote_literal(items::text) || '::jsonb, ' ||
  subtotal::text || ', ' ||
  COALESCE(vat_rate::text, '17') || ', ' ||
  total::text || ', ' ||
  COALESCE(quote_literal(status), '''draft''') || ', ' ||
  quote_literal(issue_date::text) || ', ' ||
  COALESCE(quote_literal(due_date::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(paid_date::text), 'NULL') || ', ' ||
  quote_literal(created_by) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM invoices;

-- =============================================================================
-- 9. PAYMENTS
-- =============================================================================
SELECT 'INSERT INTO payments (id, invoice_id, client_id, amount, payment_date, payment_method, reference_number, notes, created_by, created_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  COALESCE(quote_literal(invoice_id), 'NULL') || ', ' ||
  quote_literal(client_id) || ', ' ||
  amount::text || ', ' ||
  quote_literal(payment_date::text) || ', ' ||
  COALESCE(quote_literal(payment_method), 'NULL') || ', ' ||
  COALESCE(quote_literal(reference_number), 'NULL') || ', ' ||
  COALESCE(quote_literal(notes), 'NULL') || ', ' ||
  quote_literal(created_by) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM payments;

-- =============================================================================
-- 10. REMINDERS
-- =============================================================================
SELECT 'INSERT INTO reminders (id, title, description, reminder_date, reminder_time, client_id, project_id, task_id, status, user_id, created_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(title) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(reminder_date::text) || ', ' ||
  COALESCE(quote_literal(reminder_time::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(client_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(project_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(task_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(status), '''pending''') || ', ' ||
  quote_literal(user_id) || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM reminders;

-- =============================================================================
-- 11. COMPANY SETTINGS
-- =============================================================================
SELECT 'INSERT INTO company_settings (id, user_id, company_name, company_logo, address, phone, email, website, tax_id, bank_name, bank_branch, bank_account, default_vat_rate, default_payment_terms, invoice_notes, quote_notes, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(user_id) || ', ' ||
  COALESCE(quote_literal(company_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(company_logo), 'NULL') || ', ' ||
  COALESCE(quote_literal(address), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(website), 'NULL') || ', ' ||
  COALESCE(quote_literal(tax_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(bank_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(bank_branch), 'NULL') || ', ' ||
  COALESCE(quote_literal(bank_account), 'NULL') || ', ' ||
  COALESCE(default_vat_rate::text, '17') || ', ' ||
  COALESCE(quote_literal(default_payment_terms), 'NULL') || ', ' ||
  COALESCE(quote_literal(invoice_notes), 'NULL') || ', ' ||
  COALESCE(quote_literal(quote_notes), 'NULL') || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NOW()') || ', ' ||
  COALESCE(quote_literal(updated_at::text), 'NOW()') ||
') ON CONFLICT (id) DO NOTHING;' AS sql_statement
FROM company_settings;
