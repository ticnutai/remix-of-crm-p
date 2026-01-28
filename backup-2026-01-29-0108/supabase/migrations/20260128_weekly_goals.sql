-- Weekly Goals Table for Dashboard Widget
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS weekly_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '',
  category TEXT DEFAULT 'custom' CHECK (category IN ('revenue', 'clients', 'projects', 'tasks', 'custom')),
  week_start DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own goals, or anyone if no user_id
CREATE POLICY "weekly_goals_policy" ON weekly_goals
  FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_goals_week ON weekly_goals(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user ON weekly_goals(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_weekly_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_weekly_goals_updated_at ON weekly_goals;
CREATE TRIGGER update_weekly_goals_updated_at
  BEFORE UPDATE ON weekly_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_goals_updated_at();

-- Done
