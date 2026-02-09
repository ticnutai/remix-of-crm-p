-- ============================================================================
-- ARCHFLOW V2 MIGRATION - CLEAN VERSION
-- ============================================================================

-- PART 1: TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    client_id UUID,
    project_id UUID,
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    position INTEGER DEFAULT 0,
    labels TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT DEFAULT 'chart',
    data_source TEXT,
    chart_type TEXT DEFAULT 'bar',
    config JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    html_content TEXT,
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
    html_content TEXT,
    css_styles TEXT,
    primary_color TEXT DEFAULT '#162C58',
    secondary_color TEXT DEFAULT '#D4A843',
    default_validity_days INTEGER DEFAULT 30,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
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
    token TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT,
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
    contract_number TEXT,
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

-- PART 2: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_client ON call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);

-- PART 3: RLS
-- ============================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- PART 4: POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tasks_policy" ON tasks;
CREATE POLICY "tasks_policy" ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "calendar_policy" ON calendar_events;
CREATE POLICY "calendar_policy" ON calendar_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "documents_policy" ON documents;
CREATE POLICY "documents_policy" ON documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "calls_policy" ON call_logs;
CREATE POLICY "calls_policy" ON call_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "reminders_policy" ON reminders;
CREATE POLICY "reminders_policy" ON reminders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workflows_policy" ON workflows;
CREATE POLICY "workflows_policy" ON workflows FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workflow_logs_policy" ON workflow_logs;
CREATE POLICY "workflow_logs_policy" ON workflow_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "reports_policy" ON custom_reports;
CREATE POLICY "reports_policy" ON custom_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "signatures_policy" ON signatures;
CREATE POLICY "signatures_policy" ON signatures FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contract_tpl_policy" ON contract_templates;
CREATE POLICY "contract_tpl_policy" ON contract_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "quote_tpl_policy" ON quote_templates;
CREATE POLICY "quote_tpl_policy" ON quote_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "prefs_policy" ON user_preferences;
CREATE POLICY "prefs_policy" ON user_preferences FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tokens_policy" ON client_portal_tokens;
CREATE POLICY "tokens_policy" ON client_portal_tokens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "quotes_policy" ON quotes;
CREATE POLICY "quotes_policy" ON quotes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contracts_policy" ON contracts;
CREATE POLICY "contracts_policy" ON contracts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payments_policy" ON payments;
CREATE POLICY "payments_policy" ON payments FOR ALL USING (true) WITH CHECK (true);

-- PART 5: FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quote_number IS NULL THEN
        NEW.quote_number = 'Q-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_number IS NULL THEN
        NEW.contract_number = 'C-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PART 6: TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_calendar_updated ON calendar_events;
CREATE TRIGGER trg_calendar_updated BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_reminders_updated ON reminders;
CREATE TRIGGER trg_reminders_updated BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_workflows_updated ON workflows;
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated ON custom_reports;
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_quotes_updated ON quotes;
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_contracts_updated ON contracts;
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_quote_number ON quotes;
CREATE TRIGGER trg_quote_number BEFORE INSERT ON quotes FOR EACH ROW EXECUTE FUNCTION generate_quote_number();

DROP TRIGGER IF EXISTS trg_contract_number ON contracts;
CREATE TRIGGER trg_contract_number BEFORE INSERT ON contracts FOR EACH ROW EXECUTE FUNCTION generate_contract_number();

-- PART 7: STORAGE
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- DONE
SELECT 'MIGRATION COMPLETED SUCCESSFULLY' AS result;
