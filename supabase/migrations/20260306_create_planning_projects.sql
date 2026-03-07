-- =============================================
-- Planning & GIS Projects Table
-- =============================================

-- Create table
CREATE TABLE IF NOT EXISTS planning_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  project_number TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  address TEXT,
  city TEXT,
  block TEXT,
  parcel TEXT,
  plan_type TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  municipality TEXT,
  description TEXT,
  area_sqm NUMERIC,
  floors INTEGER,
  units INTEGER,
  submission_date DATE,
  approval_date DATE,
  gis_link TEXT,
  mavat_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment
COMMENT ON TABLE planning_projects IS 'Planning and GIS projects management';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_planning_projects_client_id ON planning_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_planning_projects_status ON planning_projects(status);
CREATE INDEX IF NOT EXISTS idx_planning_projects_city ON planning_projects(city);
CREATE INDEX IF NOT EXISTS idx_planning_projects_block_parcel ON planning_projects(block, parcel);

-- Enable RLS
ALTER TABLE planning_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies - allow all authenticated users
CREATE POLICY "planning_projects_select" ON planning_projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "planning_projects_insert" ON planning_projects
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "planning_projects_update" ON planning_projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "planning_projects_delete" ON planning_projects
  FOR DELETE TO authenticated USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_planning_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER planning_projects_updated_at
  BEFORE UPDATE ON planning_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_projects_updated_at();
