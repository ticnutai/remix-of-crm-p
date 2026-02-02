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
  variables jsonb DEFAULT '[]'::jsonb, -- Array of variable names like ["userName", "title", "message"]
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text DEFAULT 'general' -- 'reminder', 'notification', 'marketing', 'general'
);

-- Email Logs Table - tracks all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  -- Email details
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  html_content text,
  
  -- Tracking
  resend_id text, -- ID from Resend API
  status text DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  first_clicked_at timestamptz,
  bounced_at timestamptz,
  failed_at timestamptz,
  
  -- Engagement metrics
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  
  -- Error handling
  error_message text,
  retry_count integer DEFAULT 0,
  
  -- Relations
  reminder_id uuid REFERENCES reminders(id) ON DELETE SET NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
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
  
  -- Email details
  to_email text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Status
  status text DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'cancelled'
  processed_at timestamptz,
  
  -- Priority and retry
  priority integer DEFAULT 0, -- Higher number = higher priority
  max_retries integer DEFAULT 3,
  retry_count integer DEFAULT 0,
  
  -- Relations
  reminder_id uuid REFERENCES reminders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
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
CREATE POLICY "Users can view all templates" ON email_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can create templates" ON email_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON email_templates
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON email_templates
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for email_logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update email logs" ON email_logs
  FOR UPDATE USING (true);

-- RLS Policies for email_clicks
CREATE POLICY "Users can view clicks for their emails" ON email_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_logs 
      WHERE email_logs.id = email_clicks.email_log_id 
      AND email_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert email clicks" ON email_clicks
  FOR INSERT WITH CHECK (true);

-- RLS Policies for email_queue
CREATE POLICY "Users can view their own queued emails" ON email_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create queued emails" ON email_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queued emails" ON email_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queued emails" ON email_queue
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default email templates
INSERT INTO email_templates (name, description, subject, html_content, text_content, variables, is_default, category)
VALUES 
(
  'Basic Reminder',
  'Default template for reminders',
  '⏰ Reminder: {{title}}',
  '<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Reminder</h1>
    </div>
    <div style="padding: 30px;">
      {{#if userName}}
      <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hello {{userName}},</p>
      {{/if}}
      <h2 style="color: #333; font-size: 24px; margin-bottom: 15px;">{{title}}</h2>
      {{#if message}}
      <p style="color: #666; font-size: 16px; line-height: 1.6;">{{message}}</p>
      {{/if}}
      {{#if actionUrl}}
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Open System
        </a>
      </div>
      {{/if}}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 14px; text-align: center;">
          This is an automatic reminder from ArchFlow
        </p>
      </div>
    </div>
  </div>
</body>
</html>',
  'Hello {{userName}},

Reminder: {{title}}

{{message}}

This is an automatic reminder from ArchFlow',
  '["userName", "title", "message", "actionUrl"]'::jsonb,
  true,
  'reminder'
),
(
  'Urgent Reminder',
  'Template for high priority reminders',
  '🔴 Urgent: {{title}}',
  '<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 3px solid #ef4444;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🔴 Urgent Reminder</h1>
    </div>
    <div style="padding: 30px;">
      {{#if userName}}
      <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hello {{userName}},</p>
      {{/if}}
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <h2 style="color: #991b1b; font-size: 24px; margin: 0 0 10px 0;">{{title}}</h2>
        {{#if message}}
        <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6; margin: 0;">{{message}}</p>
        {{/if}}
      </div>
      {{#if actionUrl}}
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">
          Handle Now
        </a>
      </div>
      {{/if}}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 14px; text-align: center;">
          This is an urgent reminder from ArchFlow
        </p>
      </div>
    </div>
  </div>
</body>
</html>',
  'Hello {{userName}},

🔴 Urgent Reminder 🔴

{{title}}

{{message}}

This is an urgent reminder from ArchFlow',
  '["userName", "title", "message", "actionUrl"]'::jsonb,
  true,
  'reminder'
),
(
  'Meeting Invitation',
  'Template for meeting and event invitations',
  '📅 Meeting Invitation: {{title}}',
  '<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">📅 Meeting Invitation</h1>
    </div>
    <div style="padding: 30px;">
      {{#if userName}}
      <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hello {{userName}},</p>
      {{/if}}
      <h2 style="color: #333; font-size: 24px; margin-bottom: 15px;">{{title}}</h2>
      {{#if message}}
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">{{message}}</p>
      {{/if}}
      {{#if meetingDate}}
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #065f46; font-size: 16px; margin: 5px 0;"><strong>Date:</strong> {{meetingDate}}</p>
        {{#if meetingTime}}
        <p style="color: #065f46; font-size: 16px; margin: 5px 0;"><strong>Time:</strong> {{meetingTime}}</p>
        {{/if}}
        {{#if location}}
        <p style="color: #065f46; font-size: 16px; margin: 5px 0;"><strong>Location:</strong> {{location}}</p>
        {{/if}}
      </div>
      {{/if}}
      {{#if actionUrl}}
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{actionUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Confirm Attendance
        </a>
      </div>
      {{/if}}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 14px; text-align: center;">
          This is an automatic invitation from ArchFlow
        </p>
      </div>
    </div>
  </div>
</body>
</html>',
  'Hello {{userName}},

Meeting Invitation: {{title}}

{{message}}

Date: {{meetingDate}}
Time: {{meetingTime}}
Location: {{location}}

This is an automatic invitation from ArchFlow',
  '["userName", "title", "message", "meetingDate", "meetingTime", "location", "actionUrl"]'::jsonb,
  true,
  'notification'
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
