-- Add rate limiting tables and functions

-- Rate Limit Tracking Table
CREATE TABLE IF NOT EXISTS email_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  email_count integer DEFAULT 0,
  limit_type text NOT NULL, -- 'hourly', 'daily'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rate Limit Configuration Table
CREATE TABLE IF NOT EXISTS email_rate_limit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE, -- 'admin', 'manager', 'employee'
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
CREATE POLICY "Users can view their own rate limits" ON email_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" ON email_rate_limits
  FOR ALL USING (true);

CREATE POLICY "Anyone can view rate limit config" ON email_rate_limit_config
  FOR SELECT USING (true);

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

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_email_rate_limit(
  p_user_id uuid,
  p_user_role text DEFAULT 'employee'
)
RETURNS jsonb AS $$
DECLARE
  v_hourly_limit integer;
  v_daily_limit integer;
  v_hourly_count integer;
  v_daily_count integer;
  v_hourly_remaining integer;
  v_daily_remaining integer;
  v_hour_start timestamptz;
  v_day_start timestamptz;
BEGIN
  -- Get user's rate limits
  SELECT hourly_limit, daily_limit 
  INTO v_hourly_limit, v_daily_limit
  FROM email_rate_limit_config
  WHERE role = p_user_role;

  -- If no config found, use employee defaults
  IF v_hourly_limit IS NULL THEN
    v_hourly_limit := 100;
    v_daily_limit := 1000;
  END IF;

  -- Calculate period boundaries
  v_hour_start := date_trunc('hour', now());
  v_day_start := date_trunc('day', now());

  -- Get hourly count
  SELECT COALESCE(SUM(email_count), 0)::integer
  INTO v_hourly_count
  FROM email_rate_limits
  WHERE user_id = p_user_id
    AND limit_type = 'hourly'
    AND period_start >= v_hour_start;

  -- Get daily count
  SELECT COALESCE(SUM(email_count), 0)::integer
  INTO v_daily_count
  FROM email_rate_limits
  WHERE user_id = p_user_id
    AND limit_type = 'daily'
    AND period_start >= v_day_start;

  v_hourly_remaining := GREATEST(0, v_hourly_limit - v_hourly_count);
  v_daily_remaining := GREATEST(0, v_daily_limit - v_daily_count);

  RETURN jsonb_build_object(
    'allowed', (v_hourly_count < v_hourly_limit AND v_daily_count < v_daily_limit),
    'hourly_limit', v_hourly_limit,
    'hourly_used', v_hourly_count,
    'hourly_remaining', v_hourly_remaining,
    'daily_limit', v_daily_limit,
    'daily_used', v_daily_count,
    'daily_remaining', v_daily_remaining,
    'reset_hourly', v_hour_start + interval '1 hour',
    'reset_daily', v_day_start + interval '1 day'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment rate limit counter
CREATE OR REPLACE FUNCTION increment_email_rate_limit(
  p_user_id uuid,
  p_count integer DEFAULT 1
)
RETURNS void AS $$
DECLARE
  v_hour_start timestamptz;
  v_hour_end timestamptz;
  v_day_start timestamptz;
  v_day_end timestamptz;
BEGIN
  v_hour_start := date_trunc('hour', now());
  v_hour_end := v_hour_start + interval '1 hour';
  v_day_start := date_trunc('day', now());
  v_day_end := v_day_start + interval '1 day';

  -- Update or insert hourly counter
  INSERT INTO email_rate_limits (user_id, period_start, period_end, email_count, limit_type)
  VALUES (p_user_id, v_hour_start, v_hour_end, p_count, 'hourly')
  ON CONFLICT (user_id, period_start, limit_type)
  DO UPDATE SET 
    email_count = email_rate_limits.email_count + p_count,
    updated_at = now();

  -- Update or insert daily counter
  INSERT INTO email_rate_limits (user_id, period_start, period_end, email_count, limit_type)
  VALUES (p_user_id, v_day_start, v_day_end, p_count, 'daily')
  ON CONFLICT (user_id, period_start, limit_type)
  DO UPDATE SET 
    email_count = email_rate_limits.email_count + p_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint for rate limit periods
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_rate_limits_unique 
  ON email_rate_limits(user_id, period_start, limit_type);

-- Cleanup old rate limit records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM email_rate_limits
  WHERE period_end < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
