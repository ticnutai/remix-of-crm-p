-- ============================================================================
-- ARCHFLOW V2 - COMPLETE MIGRATION
-- Run in Supabase SQL Editor
-- Safe to run multiple times - handles existing tables
-- ============================================================================

-- CALENDAR EVENTS
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

-- DOCUMENTS
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

-- CALL LOGS
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

-- WORKFLOWS
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

-- WORKFLOW LOGS
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

-- CUSTOM REPORTS
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

-- SIGNATURES
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

-- CLIENT PORTAL TOKENS
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

-- PAYMENTS
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
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);
CREATE INDEX IF NOT EXISTS idx_call_logs_client ON call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(call_date);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow ON workflow_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_signatures_document ON signatures(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "calendar_events_policy" ON calendar_events;
CREATE POLICY "calendar_events_policy" ON calendar_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "documents_policy" ON documents;
CREATE POLICY "documents_policy" ON documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "call_logs_policy" ON call_logs;
CREATE POLICY "call_logs_policy" ON call_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workflows_policy" ON workflows;
CREATE POLICY "workflows_policy" ON workflows FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workflow_logs_policy" ON workflow_logs;
CREATE POLICY "workflow_logs_policy" ON workflow_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "custom_reports_policy" ON custom_reports;
CREATE POLICY "custom_reports_policy" ON custom_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "signatures_policy" ON signatures;
CREATE POLICY "signatures_policy" ON signatures FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "client_portal_tokens_policy" ON client_portal_tokens;
CREATE POLICY "client_portal_tokens_policy" ON client_portal_tokens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payments_policy" ON payments;
CREATE POLICY "payments_policy" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- UPDATE TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_calendar_events_updated ON calendar_events;
CREATE TRIGGER trg_calendar_events_updated BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_workflows_updated ON workflows;
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_custom_reports_updated ON custom_reports;
CREATE TRIGGER trg_custom_reports_updated BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================

SELECT 'Migration completed successfully' AS status;
