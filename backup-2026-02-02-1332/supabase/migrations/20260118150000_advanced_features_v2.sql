-- ============================================================================
-- ADVANCED FEATURES V2 - Tasks, Calendar, Documents, Workflows
-- Created: 2026-01-18
-- ============================================================================

-- ############################################################################
-- SECTION 1: TASKS (Kanban Board)
-- ############################################################################

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Relationships
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dates
  due_date date,
  start_date date,
  completed_at timestamptz,
  
  -- Additional
  estimated_hours numeric,
  actual_hours numeric,
  tags text[],
  order_index integer DEFAULT 0,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage tasks" ON tasks FOR ALL USING (true);

-- ############################################################################
-- SECTION 2: CALENDAR EVENTS
-- ############################################################################

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'reminder', 'task', 'holiday', 'other')),
  
  -- Time
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  all_day boolean DEFAULT false,
  timezone text DEFAULT 'Asia/Jerusalem',
  
  -- Recurrence
  is_recurring boolean DEFAULT false,
  recurrence_rule text, -- RRULE format
  recurrence_end date,
  
  -- Relationships
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Participants
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  attendees uuid[],
  
  -- Notifications
  reminder_minutes integer DEFAULT 30,
  reminder_sent boolean DEFAULT false,
  
  -- Additional
  location text,
  meeting_url text,
  color text DEFAULT '#667eea',
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client ON calendar_events(client_id);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage calendar events" ON calendar_events FOR ALL USING (true);

-- ############################################################################
-- SECTION 3: DOCUMENTS
-- ############################################################################

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  mime_type text,
  
  -- Relationships
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Organization
  folder text DEFAULT 'general',
  tags text[],
  
  -- Versioning
  version integer DEFAULT 1,
  parent_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Metadata
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage documents" ON documents FOR ALL USING (true);

-- ############################################################################
-- SECTION 4: CALL LOGS (Phone History)
-- ############################################################################

CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  contact_name text,
  phone_number text NOT NULL,
  
  call_type text DEFAULT 'outgoing' CHECK (call_type IN ('incoming', 'outgoing', 'missed')),
  call_status text DEFAULT 'completed' CHECK (call_status IN ('completed', 'no_answer', 'busy', 'voicemail', 'cancelled')),
  
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  
  notes text,
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_client ON call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started ON call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_follow_up ON call_logs(follow_up_date) WHERE follow_up_required = true;

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage call logs" ON call_logs FOR ALL USING (true);

-- ############################################################################
-- SECTION 5: REMINDERS
-- ############################################################################

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  reminder_type text DEFAULT 'general' CHECK (reminder_type IN ('general', 'payment', 'deadline', 'follow_up', 'meeting', 'contract', 'birthday')),
  
  -- When to remind
  remind_at timestamptz NOT NULL,
  repeat_type text CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  repeat_until date,
  
  -- Channels
  send_email boolean DEFAULT true,
  send_sms boolean DEFAULT false,
  send_push boolean DEFAULT true,
  
  -- Status
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  
  -- Relationships
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at) WHERE is_sent = false;
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their reminders" ON reminders FOR ALL USING (true);

-- ############################################################################
-- SECTION 6: WORKFLOWS (Automation)
-- ############################################################################

CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  
  -- Trigger
  trigger_type text NOT NULL CHECK (trigger_type IN ('quote_approved', 'quote_sent', 'contract_signed', 'invoice_paid', 'invoice_overdue', 'task_completed', 'client_created', 'project_started', 'manual')),
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  
  -- Actions (array of action objects)
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Action types: create_task, send_email, send_sms, create_invoice, create_contract, update_status, notify_user
  
  -- Execution
  last_run_at timestamptz,
  run_count integer DEFAULT 0,
  
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage workflows" ON workflows FOR ALL USING (true);

-- Workflow execution log
CREATE TABLE IF NOT EXISTS workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  triggered_by text,
  trigger_data jsonb,
  actions_executed jsonb,
  status text DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
  error_message text,
  executed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow ON workflow_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_executed ON workflow_logs(executed_at DESC);

ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view workflow logs" ON workflow_logs FOR ALL USING (true);

-- ############################################################################
-- SECTION 7: CUSTOM REPORTS
-- ############################################################################

CREATE TABLE IF NOT EXISTS custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  report_type text NOT NULL CHECK (report_type IN ('revenue', 'clients', 'projects', 'tasks', 'time', 'invoices', 'custom')),
  
  -- Configuration
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- includes: date_range, filters, grouping, columns, chart_type
  
  -- Scheduling
  is_scheduled boolean DEFAULT false,
  schedule_cron text,
  send_to_emails text[],
  last_sent_at timestamptz,
  
  -- Access
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_type ON custom_reports(report_type);

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage reports" ON custom_reports FOR ALL USING (true);

-- ############################################################################
-- SECTION 8: DIGITAL SIGNATURES
-- ############################################################################

CREATE TABLE IF NOT EXISTS signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What is being signed
  document_type text NOT NULL CHECK (document_type IN ('quote', 'contract', 'invoice', 'document')),
  document_id uuid NOT NULL,
  
  -- Signer info
  signer_name text NOT NULL,
  signer_email text,
  signer_phone text,
  signer_role text, -- 'client', 'company', 'witness'
  
  -- Signature data
  signature_data text NOT NULL, -- Base64 encoded signature image
  signature_type text DEFAULT 'drawn' CHECK (signature_type IN ('drawn', 'typed', 'uploaded')),
  
  -- Verification
  ip_address text,
  user_agent text,
  signed_at timestamptz DEFAULT now(),
  
  -- Document state at signing
  document_hash text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signatures_document ON signatures(document_type, document_id);

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage signatures" ON signatures FOR ALL USING (true);

-- ############################################################################
-- SECTION 9: USER PREFERENCES (for Dark Mode, Shortcuts, etc.)
-- ############################################################################

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Theme
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  accent_color text DEFAULT '#667eea',
  
  -- Language & Locale
  language text DEFAULT 'he',
  date_format text DEFAULT 'DD/MM/YYYY',
  time_format text DEFAULT '24h',
  first_day_of_week integer DEFAULT 0, -- 0 = Sunday
  
  -- Notifications
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  notification_sound boolean DEFAULT true,
  
  -- Dashboard
  default_dashboard_view text DEFAULT 'overview',
  dashboard_widgets jsonb DEFAULT '[]'::jsonb,
  
  -- Shortcuts
  custom_shortcuts jsonb DEFAULT '{}'::jsonb,
  
  -- Other
  sidebar_collapsed boolean DEFAULT false,
  items_per_page integer DEFAULT 25,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON user_preferences 
  FOR ALL USING (auth.uid() = user_id);

-- ############################################################################
-- SECTION 10: CLIENT PORTAL TOKENS
-- ############################################################################

CREATE TABLE IF NOT EXISTS client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  
  -- Access
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  
  -- Permissions
  can_view_quotes boolean DEFAULT true,
  can_view_contracts boolean DEFAULT true,
  can_view_invoices boolean DEFAULT true,
  can_view_projects boolean DEFAULT true,
  can_sign_documents boolean DEFAULT true,
  can_upload_files boolean DEFAULT false,
  
  -- Tracking
  last_accessed_at timestamptz,
  access_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_client ON client_portal_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON client_portal_tokens(token);

ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage portal tokens" ON client_portal_tokens FOR ALL USING (true);

-- ############################################################################
-- DONE!
-- ############################################################################

SELECT 'SUCCESS! All advanced features tables created.' as result;
