-- Email Signatures Table
CREATE TABLE IF NOT EXISTS email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  is_default boolean DEFAULT false,
  is_company_wide boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unsubscribe Management
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text,
  unsubscribed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Scheduled Emails Enhancement (add timezone support)
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS send_after timestamptz;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  status text DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'cancelled'
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'unsubscribed'
  variables jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  email_log_id uuid REFERENCES email_logs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_signatures_user_id ON email_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_email_signatures_default ON email_signatures(is_default);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);

-- RLS
ALTER TABLE email_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Policies for email_signatures
CREATE POLICY "Users can view their own signatures" ON email_signatures
  FOR SELECT USING (auth.uid() = user_id OR is_company_wide = true);

CREATE POLICY "Users can create their own signatures" ON email_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures" ON email_signatures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures" ON email_signatures
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for email_unsubscribes
CREATE POLICY "Anyone can insert unsubscribes" ON email_unsubscribes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view unsubscribes" ON email_unsubscribes
  FOR SELECT USING (true);

-- Policies for email_campaigns
CREATE POLICY "Users can view their own campaigns" ON email_campaigns
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create campaigns" ON email_campaigns
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own campaigns" ON email_campaigns
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own campaigns" ON email_campaigns
  FOR DELETE USING (auth.uid() = created_by);

-- Policies for email_campaign_recipients
CREATE POLICY "Users can view recipients of their campaigns" ON email_campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_campaigns 
      WHERE email_campaigns.id = email_campaign_recipients.campaign_id 
      AND email_campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage recipients of their campaigns" ON email_campaign_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM email_campaigns 
      WHERE email_campaigns.id = email_campaign_recipients.campaign_id 
      AND email_campaigns.created_by = auth.uid()
    )
  );

-- Function to check if email is unsubscribed
CREATE OR REPLACE FUNCTION is_email_unsubscribed(p_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_unsubscribes WHERE email = p_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on email_signatures
CREATE TRIGGER update_email_signatures_updated_at
  BEFORE UPDATE ON email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on email_campaigns
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default company signature
INSERT INTO email_signatures (user_id, name, html_content, text_content, is_company_wide, is_default)
VALUES (
  NULL,
  'ArchFlow Signature',
  '<div style="font-family: Arial, sans-serif; color: #333; margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea;">
    <p style="margin: 0;"><strong>ArchFlow Team</strong></p>
    <p style="margin: 5px 0; font-size: 14px;">Advanced Client Management System</p>
    <p style="margin: 5px 0; font-size: 14px;">
      <a href="mailto:support@archflow.co" style="color: #667eea; text-decoration: none;">support@archflow.co</a>
    </p>
  </div>',
  '---
ArchFlow Team
Advanced Client Management System
support@archflow.co',
  true,
  true
);
