-- Client Folders System Migration
-- Creates tables for per-client folder system with stages and tasks

-- Client Folders table
CREATE TABLE IF NOT EXISTS client_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  folder_icon TEXT DEFAULT 'Folder',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Folder Stages table
CREATE TABLE IF NOT EXISTS client_folder_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES client_folders(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_icon TEXT DEFAULT 'FileText',
  sort_order INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  target_working_days INTEGER,
  timer_display_style INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Folder Tasks table
CREATE TABLE IF NOT EXISTS client_folder_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES client_folder_stages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  background_color TEXT,
  text_color TEXT,
  is_bold BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE,
  target_working_days INTEGER,
  timer_display_style INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_folders_client_id ON client_folders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_folders_sort_order ON client_folders(client_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_client_folder_stages_folder_id ON client_folder_stages(folder_id);
CREATE INDEX IF NOT EXISTS idx_client_folder_stages_sort_order ON client_folder_stages(folder_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_client_folder_tasks_stage_id ON client_folder_tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_client_folder_tasks_sort_order ON client_folder_tasks(stage_id, sort_order);

-- Enable RLS
ALTER TABLE client_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_folder_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_folder_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_folders
CREATE POLICY "Users can view client folders" ON client_folders
  FOR SELECT USING (true);

CREATE POLICY "Users can insert client folders" ON client_folders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update client folders" ON client_folders
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete client folders" ON client_folders
  FOR DELETE USING (true);

-- RLS Policies for client_folder_stages
CREATE POLICY "Users can view client folder stages" ON client_folder_stages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert client folder stages" ON client_folder_stages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update client folder stages" ON client_folder_stages
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete client folder stages" ON client_folder_stages
  FOR DELETE USING (true);

-- RLS Policies for client_folder_tasks
CREATE POLICY "Users can view client folder tasks" ON client_folder_tasks
  FOR SELECT USING (true);

CREATE POLICY "Users can insert client folder tasks" ON client_folder_tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update client folder tasks" ON client_folder_tasks
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete client folder tasks" ON client_folder_tasks
  FOR DELETE USING (true);

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_client_folders_updated_at ON client_folders;
CREATE TRIGGER update_client_folders_updated_at
  BEFORE UPDATE ON client_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_folder_stages_updated_at ON client_folder_stages;
CREATE TRIGGER update_client_folder_stages_updated_at
  BEFORE UPDATE ON client_folder_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_folder_tasks_updated_at ON client_folder_tasks;
CREATE TRIGGER update_client_folder_tasks_updated_at
  BEFORE UPDATE ON client_folder_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
