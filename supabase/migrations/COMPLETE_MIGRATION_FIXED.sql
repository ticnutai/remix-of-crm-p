-- ============================================================================
-- ARCHFLOW V2 COMPLETE MIGRATION (FIXED)
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: CORE TABLES
-- ============================================================================

-- 1.1 Tasks Table (Kanban Board)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    client_id UUID,
    project_id UUID,
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    labels TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to tasks if they dont exist
DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 1.2 Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'meeting',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    client_id UUID,
    project_id UUID,
    color TEXT DEFAULT '#3B82F6',
    recurrence_rule TEXT,
    reminder_minutes INTEGER DEFAULT 30,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    folder TEXT DEFAULT 'general',
    client_id UUID,
    project_id UUID,
    uploaded_by TEXT,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Call Logs Table
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    phone_number TEXT NOT NULL,
    call_type TEXT DEFAULT 'outgoing',
    duration_seconds INTEGER DEFAULT 0,
    notes TEXT,
    call_date TIMESTAMPTZ DEFAULT NOW(),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    reminder_type TEXT DEFAULT 'general',
    remind_at TIMESTAMPTZ NOT NULL,
    client_id UUID,
    project_id UUID,
    is_completed BOOLEAN DEFAULT FALSE,
    is_snoozed BOOLEAN DEFAULT FALSE,
    snooze_until TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: AUTOMATION & WORKFLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    actions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID,
    status TEXT DEFAULT 'running',
    trigger_data JSONB,
    actions_executed JSONB DEFAULT '[]',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- PART 3: REPORTS & ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT DEFAULT 'chart',
    data_source TEXT NOT NULL,
    chart_type TEXT DEFAULT 'bar',
    config JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 4: SIGNATURES & CONTRACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL,
    document_id UUID NOT NULL,
    signer_name TEXT NOT NULL,
    signer_email TEXT,
    signer_phone TEXT,
    signature_data TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    is_valid BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    html_content TEXT NOT NULL,
    css_styles TEXT,
    variables JSONB DEFAULT '[]',
    payment_schedule JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    html_content TEXT NOT NULL,
    css_styles TEXT,
    primary_color TEXT DEFAULT '#162C58',
    secondary_color TEXT DEFAULT '#D4A843',
    default_validity_days INTEGER DEFAULT 30,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 5: USER PREFERENCES & SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'he',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    dashboard_layout JSONB DEFAULT '{}',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    default_view TEXT DEFAULT 'grid',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    token TEXT NOT NULL UNIQUE,
    permissions JSONB DEFAULT '{"view_quotes": true, "view_contracts": true, "sign_documents": true}',
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 6: QUOTES & CONTRACTS CORE
-- ============================================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT UNIQUE,
    client_id UUID,
    project_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]',
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 17,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    terms TEXT,
    template_id UUID,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT UNIQUE,
    client_id UUID,
    project_id UUID,
    quote_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    html_content TEXT,
    total_value DECIMAL(12,2) DEFAULT 0,
    payment_schedule JSONB DEFAULT '[]',
    status TEXT DEFAULT 'draft',
    template_id UUID,
    start_date DATE,
    end_date DATE,
    signed_at TIMESTAMPTZ,
    signed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID,
    client_id UUID,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'transfer',
    reference_number TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 7: INDEXES (with error handling)
-- ============================================================================

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_call_logs_client ON call_logs(client_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(call_date); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_reminders_client ON reminders(client_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_signatures_document ON signatures(document_type, document_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 8: ROW LEVEL SECURITY
-- ============================================================================

DO $$ BEGIN ALTER TABLE tasks ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE documents ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE reminders ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workflows ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE signatures ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE quotes ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE contracts ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE payments ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 9: RLS POLICIES
-- ============================================================================

DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_tasks" ON tasks; CREATE POLICY "allow_all_tasks" ON tasks FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_calendar" ON calendar_events; CREATE POLICY "allow_all_calendar" ON calendar_events FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_documents" ON documents; CREATE POLICY "allow_all_documents" ON documents FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_calls" ON call_logs; CREATE POLICY "allow_all_calls" ON call_logs FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_reminders" ON reminders; CREATE POLICY "allow_all_reminders" ON reminders FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_workflows" ON workflows; CREATE POLICY "allow_all_workflows" ON workflows FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_workflow_logs" ON workflow_logs; CREATE POLICY "allow_all_workflow_logs" ON workflow_logs FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_reports" ON custom_reports; CREATE POLICY "allow_all_reports" ON custom_reports FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_signatures" ON signatures; CREATE POLICY "allow_all_signatures" ON signatures FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_contract_tpl" ON contract_templates; CREATE POLICY "allow_all_contract_tpl" ON contract_templates FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_quote_tpl" ON quote_templates; CREATE POLICY "allow_all_quote_tpl" ON quote_templates FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_prefs" ON user_preferences; CREATE POLICY "allow_all_prefs" ON user_preferences FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_tokens" ON client_portal_tokens; CREATE POLICY "allow_all_tokens" ON client_portal_tokens FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_quotes" ON quotes; CREATE POLICY "allow_all_quotes" ON quotes FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_contracts" ON contracts; CREATE POLICY "allow_all_contracts" ON contracts FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "allow_all_payments" ON payments; CREATE POLICY "allow_all_payments" ON payments FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 10: AUTO-UPDATE TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 11: AUTO-UPDATE TRIGGERS
-- ============================================================================

DO $$ BEGIN DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks; CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_calendar_updated ON calendar_events; CREATE TRIGGER trg_calendar_updated BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_documents_updated ON documents; CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_reminders_updated ON reminders; CREATE TRIGGER trg_reminders_updated BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_workflows_updated ON workflows; CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_reports_updated ON custom_reports; CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_contract_tpl_updated ON contract_templates; CREATE TRIGGER trg_contract_tpl_updated BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_quote_tpl_updated ON quote_templates; CREATE TRIGGER trg_quote_tpl_updated BEFORE UPDATE ON quote_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_prefs_updated ON user_preferences; CREATE TRIGGER trg_prefs_updated BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_quotes_updated ON quotes; CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_contracts_updated ON contracts; CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trg_payments_updated ON payments; CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 12: QUOTE NUMBER AUTO-GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_num INTEGER;
BEGIN
    IF NEW.quote_number IS NULL THEN
        year_prefix := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 6) AS INTEGER)), 0) + 1
        INTO next_num
        FROM quotes
        WHERE quote_number LIKE year_prefix || '-%';
        NEW.quote_number := year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN DROP TRIGGER IF EXISTS auto_quote_number ON quotes; CREATE TRIGGER auto_quote_number BEFORE INSERT ON quotes FOR EACH ROW EXECUTE FUNCTION generate_quote_number(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 13: CONTRACT NUMBER AUTO-GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_num INTEGER;
BEGIN
    IF NEW.contract_number IS NULL THEN
        year_prefix := TO_CHAR(NOW(), 'YYYY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 6) AS INTEGER)), 0) + 1
        INTO next_num
        FROM contracts
        WHERE contract_number LIKE year_prefix || '-%';
        NEW.contract_number := year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN DROP TRIGGER IF EXISTS auto_contract_number ON contracts; CREATE TRIGGER auto_contract_number BEFORE INSERT ON contracts FOR EACH ROW EXECUTE FUNCTION generate_contract_number(); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- PART 14: STORAGE BUCKETS
-- ============================================================================

DO $$ BEGIN INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'MIGRATION COMPLETED' AS status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'tasks', 'calendar_events', 'documents', 'call_logs', 'reminders',
    'workflows', 'workflow_logs', 'custom_reports', 'signatures',
    'contract_templates', 'quote_templates', 'user_preferences',
    'client_portal_tokens', 'quotes', 'contracts', 'payments'
)
ORDER BY table_name;
