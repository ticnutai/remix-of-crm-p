-- ============================================================================
-- ARCHFLOW V2 COMPLETE MIGRATION
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
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    position INTEGER DEFAULT 0,
    labels TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'reminder', 'task', 'other')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
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
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
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
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    call_type TEXT DEFAULT 'outgoing' CHECK (call_type IN ('incoming', 'outgoing', 'missed')),
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
    reminder_type TEXT DEFAULT 'general' CHECK (reminder_type IN ('general', 'payment', 'deadline', 'follow_up', 'meeting')),
    remind_at TIMESTAMPTZ NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_snoozed BOOLEAN DEFAULT FALSE,
    snooze_until TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: AUTOMATION & WORKFLOWS
-- ============================================================================

-- 2.1 Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('new_client', 'status_change', 'payment_received', 'deadline_approaching', 'manual', 'schedule')),
    trigger_config JSONB DEFAULT '{}',
    actions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Workflow Execution Logs
CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    trigger_data JSONB,
    actions_executed JSONB DEFAULT '[]',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- PART 3: REPORTS & ANALYTICS
-- ============================================================================

-- 3.1 Custom Reports Table
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT DEFAULT 'chart' CHECK (report_type IN ('chart', 'table', 'summary', 'dashboard')),
    data_source TEXT NOT NULL,
    chart_type TEXT DEFAULT 'bar' CHECK (chart_type IN ('bar', 'line', 'pie', 'area', 'scatter')),
    config JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 4: SIGNATURES & CONTRACTS
-- ============================================================================

-- 4.1 Digital Signatures Table
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'contract', 'document')),
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

-- 4.2 Contract Templates Table
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

-- 4.3 Quote Templates Table
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

-- 5.1 User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'he',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    dashboard_layout JSONB DEFAULT '{}',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    default_view TEXT DEFAULT 'grid',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 Client Portal Tokens Table
CREATE TABLE IF NOT EXISTS client_portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    permissions JSONB DEFAULT '{"view_quotes": true, "view_contracts": true, "sign_documents": true}',
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 6: QUOTES & CONTRACTS CORE (if not exists)
-- ============================================================================

-- 6.1 Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]',
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 17,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
    valid_until DATE,
    notes TEXT,
    terms TEXT,
    template_id UUID REFERENCES quote_templates(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    html_content TEXT,
    total_value DECIMAL(12,2) DEFAULT 0,
    payment_schedule JSONB DEFAULT '[]',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'active', 'completed', 'cancelled')),
    template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    signed_at TIMESTAMPTZ,
    signed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'transfer' CHECK (payment_method IN ('cash', 'check', 'transfer', 'credit_card', 'other')),
    reference_number TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 7: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

CREATE INDEX IF NOT EXISTS idx_call_logs_client ON call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(call_date);

CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_client ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);

CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow ON workflow_logs(workflow_id);

CREATE INDEX IF NOT EXISTS idx_signatures_document ON signatures(document_type, document_id);

CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(contract_number);

CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================================================
-- PART 8: ROW LEVEL SECURITY
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

-- ============================================================================
-- PART 9: RLS POLICIES (Allow all for authenticated users)
-- ============================================================================

DO $$ 
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'tasks', 'calendar_events', 'documents', 'call_logs', 'reminders',
        'workflows', 'workflow_logs', 'custom_reports', 'signatures',
        'contract_templates', 'quote_templates', 'user_preferences',
        'client_portal_tokens', 'quotes', 'contracts', 'payments'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON %I', tbl);
        EXECUTE format('
            CREATE POLICY "Allow all for authenticated" ON %I
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true)
        ', tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon read" ON %I', tbl);
        EXECUTE format('
            CREATE POLICY "Allow anon read" ON %I
            FOR SELECT
            TO anon
            USING (true)
        ', tbl);
    END LOOP;
END $$;

-- ============================================================================
-- PART 10: AUTO-UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'tasks', 'calendar_events', 'documents', 'reminders',
        'workflows', 'custom_reports', 'contract_templates', 
        'quote_templates', 'user_preferences', 'quotes', 
        'contracts', 'payments'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', tbl, tbl);
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()
        ', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- PART 11: QUOTE NUMBER AUTO-GENERATION
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

DROP TRIGGER IF EXISTS auto_quote_number ON quotes;
CREATE TRIGGER auto_quote_number
BEFORE INSERT ON quotes
FOR EACH ROW
EXECUTE FUNCTION generate_quote_number();

-- ============================================================================
-- PART 12: CONTRACT NUMBER AUTO-GENERATION
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

DROP TRIGGER IF EXISTS auto_contract_number ON contracts;
CREATE TRIGGER auto_contract_number
BEFORE INSERT ON contracts
FOR EACH ROW
EXECUTE FUNCTION generate_contract_number();

-- ============================================================================
-- PART 13: STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read documents" ON storage.objects;
    CREATE POLICY "Public read documents" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id IN ('documents', 'signatures', 'avatars'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Auth upload documents" ON storage.objects;
    CREATE POLICY "Auth upload documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('documents', 'signatures', 'avatars'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Auth delete documents" ON storage.objects;
    CREATE POLICY "Auth delete documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id IN ('documents', 'signatures', 'avatars'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$ 
DECLARE
    tbl TEXT;
    tbl_count INTEGER;
    tables TEXT[] := ARRAY[
        'tasks', 'calendar_events', 'documents', 'call_logs', 'reminders',
        'workflows', 'workflow_logs', 'custom_reports', 'signatures',
        'contract_templates', 'quote_templates', 'user_preferences',
        'client_portal_tokens', 'quotes', 'contracts', 'payments'
    ];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    FOREACH tbl IN ARRAY tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            RAISE NOTICE '[OK] Table: %', tbl;
        ELSE
            RAISE NOTICE '[MISSING] Table: %', tbl;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'All tables created with:';
    RAISE NOTICE '  - Indexes for fast queries';
    RAISE NOTICE '  - Row Level Security enabled';
    RAISE NOTICE '  - Auto-update timestamps';
    RAISE NOTICE '  - Quote/Contract number generators';
    RAISE NOTICE '  - Storage buckets ready';
    RAISE NOTICE '============================================';
END $$;
