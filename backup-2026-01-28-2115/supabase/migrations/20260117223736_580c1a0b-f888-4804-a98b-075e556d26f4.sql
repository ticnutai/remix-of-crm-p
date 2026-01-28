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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if email is unsubscribed
CREATE OR REPLACE FUNCTION is_email_unsubscribed(p_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_unsubscribes WHERE email = p_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cleanup old rate limit records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM email_rate_limits
  WHERE period_end < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;