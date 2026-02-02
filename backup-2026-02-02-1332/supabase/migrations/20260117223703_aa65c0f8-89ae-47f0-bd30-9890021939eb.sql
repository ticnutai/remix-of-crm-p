-- Rate Limit Tracking Table
CREATE TABLE IF NOT EXISTS email_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  email_count integer DEFAULT 0,
  limit_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rate Limit Configuration Table
CREATE TABLE IF NOT EXISTS email_rate_limit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE,
  hourly_limit integer NOT NULL,
  daily_limit integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_rate_limits_user_id ON email_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_email_rate_limits_period ON email_rate_limits(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_email_rate_limits_type ON email_rate_limits(limit_type);

-- RLS
ALTER TABLE email_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own rate limits" ON email_rate_limits;
CREATE POLICY "Users can view their own rate limits" ON email_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage rate limits" ON email_rate_limits;
CREATE POLICY "System can manage rate limits" ON email_rate_limits
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can view rate limit config" ON email_rate_limit_config;
CREATE POLICY "Anyone can view rate limit config" ON email_rate_limit_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage rate limit config" ON email_rate_limit_config;
CREATE POLICY "Admins can manage rate limit config" ON email_rate_limit_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default rate limit configurations
INSERT INTO email_rate_limit_config (role, hourly_limit, daily_limit)
VALUES 
  ('admin', 500, 5000),
  ('manager', 200, 2000),
  ('employee', 100, 1000)
ON CONFLICT (role) DO NOTHING;

-- Add unique constraint for rate limit periods
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_rate_limits_unique 
  ON email_rate_limits(user_id, period_start, limit_type);

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

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  status text DEFAULT 'draft',
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
  status text DEFAULT 'pending',
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
DROP POLICY IF EXISTS "Users can view their own signatures" ON email_signatures;
CREATE POLICY "Users can view their own signatures" ON email_signatures
  FOR SELECT USING (auth.uid() = user_id OR is_company_wide = true);

DROP POLICY IF EXISTS "Users can create their own signatures" ON email_signatures;
CREATE POLICY "Users can create their own signatures" ON email_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own signatures" ON email_signatures;
CREATE POLICY "Users can update their own signatures" ON email_signatures
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own signatures" ON email_signatures;
CREATE POLICY "Users can delete their own signatures" ON email_signatures
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for email_unsubscribes
DROP POLICY IF EXISTS "Anyone can insert unsubscribes" ON email_unsubscribes;
CREATE POLICY "Anyone can insert unsubscribes" ON email_unsubscribes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view unsubscribes" ON email_unsubscribes;
CREATE POLICY "Anyone can view unsubscribes" ON email_unsubscribes
  FOR SELECT USING (true);

-- Policies for email_campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON email_campaigns;
CREATE POLICY "Users can view their own campaigns" ON email_campaigns
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create campaigns" ON email_campaigns;
CREATE POLICY "Users can create campaigns" ON email_campaigns
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own campaigns" ON email_campaigns;
CREATE POLICY "Users can update their own campaigns" ON email_campaigns
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON email_campaigns;
CREATE POLICY "Users can delete their own campaigns" ON email_campaigns
  FOR DELETE USING (auth.uid() = created_by);

-- Policies for email_campaign_recipients
DROP POLICY IF EXISTS "Users can view recipients of their campaigns" ON email_campaign_recipients;
CREATE POLICY "Users can view recipients of their campaigns" ON email_campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_campaigns 
      WHERE email_campaigns.id = email_campaign_recipients.campaign_id 
      AND email_campaigns.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage recipients of their campaigns" ON email_campaign_recipients;
CREATE POLICY "Users can manage recipients of their campaigns" ON email_campaign_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM email_campaigns 
      WHERE email_campaigns.id = email_campaign_recipients.campaign_id 
      AND email_campaigns.created_by = auth.uid()
    )
  );

-- Add timezone support to email_queue
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS send_after timestamptz;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id);

-- Trigger to update updated_at on email_signatures
DROP TRIGGER IF EXISTS update_email_signatures_updated_at ON email_signatures;
CREATE TRIGGER update_email_signatures_updated_at
  BEFORE UPDATE ON email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on email_campaigns
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();