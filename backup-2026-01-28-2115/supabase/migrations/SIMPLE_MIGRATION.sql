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
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
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

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config JSONB DEFAULT '{}'::JSONB,
    actions JSONB DEFAULT '[]'::JSONB,
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
    actions_executed JSONB DEFAULT '[]'::JSONB,
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
    config JSONB DEFAULT '{}'::JSONB,
    filters JSONB DEFAULT '{}'::JSONB,
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

CREATE TABLE IF NOT EXISTS client_portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    token TEXT NOT NULL,
    permissions JSONB DEFAULT '{}'::JSONB,
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
