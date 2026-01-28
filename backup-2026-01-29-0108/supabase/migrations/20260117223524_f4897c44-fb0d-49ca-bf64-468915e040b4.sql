-- Advanced Email System Migration
-- This migration adds support for email templates, tracking, and analytics

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  variables jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text DEFAULT 'general'
);

-- Email Logs Table - tracks all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  html_content text,
  resend_id text,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  first_clicked_at timestamptz,
  bounced_at timestamptz,
  failed_at timestamptz,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  error_message text,
  retry_count integer DEFAULT 0,
  reminder_id uuid REFERENCES reminders(id) ON DELETE SET NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Email Click Tracking Table
CREATE TABLE IF NOT EXISTS email_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  email_log_id uuid REFERENCES email_logs(id) ON DELETE CASCADE,
  url text NOT NULL,
  clicked_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  location text
);

-- Email Schedule Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  scheduled_at timestamptz NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  processed_at timestamptz,
  priority integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  retry_count integer DEFAULT 0,
  reminder_id uuid REFERENCES reminders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_reminder_id ON email_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_default ON email_templates(is_default);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
DROP POLICY IF EXISTS "Users can view all templates" ON email_templates;
CREATE POLICY "Users can view all templates" ON email_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create templates" ON email_templates;
CREATE POLICY "Users can create templates" ON email_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own templates" ON email_templates;
CREATE POLICY "Users can update their own templates" ON email_templates
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own templates" ON email_templates;
CREATE POLICY "Users can delete their own templates" ON email_templates
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for email_logs
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert email logs" ON email_logs;
CREATE POLICY "System can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update email logs" ON email_logs;
CREATE POLICY "System can update email logs" ON email_logs
  FOR UPDATE USING (true);

-- RLS Policies for email_clicks
DROP POLICY IF EXISTS "Users can view clicks for their emails" ON email_clicks;
CREATE POLICY "Users can view clicks for their emails" ON email_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_logs 
      WHERE email_logs.id = email_clicks.email_log_id 
      AND email_logs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert email clicks" ON email_clicks;
CREATE POLICY "System can insert email clicks" ON email_clicks
  FOR INSERT WITH CHECK (true);

-- RLS Policies for email_queue
DROP POLICY IF EXISTS "Users can view their own queued emails" ON email_queue;
CREATE POLICY "Users can view their own queued emails" ON email_queue
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create queued emails" ON email_queue;
CREATE POLICY "Users can create queued emails" ON email_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own queued emails" ON email_queue;
CREATE POLICY "Users can update their own queued emails" ON email_queue
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own queued emails" ON email_queue;
CREATE POLICY "Users can delete their own queued emails" ON email_queue
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for email_templates
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();