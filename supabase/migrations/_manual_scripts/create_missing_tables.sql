-- יצירת טבלאות חסרות למערכת CRM

-- טבלת לוגי זמן
CREATE TABLE IF NOT EXISTS time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_name TEXT,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת אנשי קשר של לקוחות
CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת מקורות לקוחות
CREATE TABLE IF NOT EXISTS client_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת תפקידים (Roles)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת הרשאות (Permissions)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת לוג פעילות (Activity Logs)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_client_id ON time_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_email ON client_contacts(email);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- הוספת הרשאות בסיסיות
INSERT INTO permissions (name, display_name, description, module, action) VALUES
  ('clients.view', 'צפייה בלקוחות', 'הרשאה לצפייה ברשימת לקוחות', 'clients', 'view'),
  ('clients.create', 'יצירת לקוחות', 'הרשאה ליצירת לקוח חדש', 'clients', 'create'),
  ('clients.edit', 'עריכת לקוחות', 'הרשאה לעריכת פרטי לקוח', 'clients', 'edit'),
  ('clients.delete', 'מחיקת לקוחות', 'הרשאה למחיקת לקוחות', 'clients', 'delete'),
  ('employees.view', 'צפייה בעובדים', 'הרשאה לצפייה ברשימת עובדים', 'employees', 'view'),
  ('employees.create', 'יצירת עובדים', 'הרשאה להוספת עובד חדש', 'employees', 'create'),
  ('employees.edit', 'עריכת עובדים', 'הרשאה לעריכת פרטי עובד', 'employees', 'edit'),
  ('employees.delete', 'מחיקת עובדים', 'הרשאה למחיקת עובדים', 'employees', 'delete'),
  ('tasks.view', 'צפייה במשימות', 'הרשאה לצפייה במשימות', 'tasks', 'view'),
  ('tasks.create', 'יצירת משימות', 'הרשאה ליצירת משימה חדשה', 'tasks', 'create'),
  ('tasks.edit', 'עריכת משימות', 'הרשאה לעריכת משימות', 'tasks', 'edit'),
  ('tasks.delete', 'מחיקת משימות', 'הרשאה למחיקת משימות', 'tasks', 'delete'),
  ('settings.view', 'צפייה בהגדרות', 'הרשאה לצפייה בהגדרות מערכת', 'settings', 'view'),
  ('settings.edit', 'עריכת הגדרות', 'הרשאה לשינוי הגדרות מערכת', 'settings', 'edit')
ON CONFLICT (name) DO NOTHING;

-- יצירת תפקידים בסיסיים
INSERT INTO roles (name, display_name, description, is_system, permissions) VALUES
  ('admin', 'מנהל מערכת', 'גישה מלאה לכל הפונקציות', true, 
   '["clients.view", "clients.create", "clients.edit", "clients.delete", 
     "employees.view", "employees.create", "employees.edit", "employees.delete",
     "tasks.view", "tasks.create", "tasks.edit", "tasks.delete",
     "settings.view", "settings.edit"]'::jsonb),
  ('manager', 'מנהל', 'גישה לניהול לקוחות ועובדים', true,
   '["clients.view", "clients.create", "clients.edit",
     "employees.view", "employees.create", "employees.edit",
     "tasks.view", "tasks.create", "tasks.edit"]'::jsonb),
  ('user', 'משתמש רגיל', 'גישה בסיסית למערכת', true,
   '["clients.view", "tasks.view", "tasks.create", "tasks.edit"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- הוספת מקורות לקוח דוגמה
INSERT INTO client_sources (name, description, color) VALUES
  ('המלצה', 'לקוח שהגיע דרך המלצה', '#10b981'),
  ('גוגל', 'לקוח שמצא אותנו בגוגל', '#3b82f6'),
  ('פייסבוק', 'לקוח מפרסום בפייסבוק', '#1877f2'),
  ('אתר', 'לקוח שפנה דרך האתר', '#8b5cf6'),
  ('אחר', 'מקור אחר', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- הוספת טריגר לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_logs_updated_at BEFORE UPDATE ON time_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_contacts_updated_at BEFORE UPDATE ON client_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_sources_updated_at BEFORE UPDATE ON client_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- הפעלת Row Level Security (RLS)
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- פוליסיות RLS בסיסיות (התאם לפי הצורך)
-- משתמשים יכולים לראות רק את הרשומות שלהם או שיש להם הרשאה
CREATE POLICY "Users can view their own time logs"
  ON time_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time logs"
  ON time_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time logs"
  ON time_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- אנשי קשר - כל משתמש מחובר יכול לראות
CREATE POLICY "Authenticated users can view client contacts"
  ON client_contacts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage client contacts"
  ON client_contacts FOR ALL
  USING (auth.role() = 'authenticated');

-- מקורות לקוח - כולם יכולים לראות
CREATE POLICY "Everyone can view client sources"
  ON client_sources FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage client sources"
  ON client_sources FOR ALL
  USING (auth.role() = 'authenticated');

-- תפקידים והרשאות - משתמשים מחוברים
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- לוג פעילות - כולם יכולים לראות את שלהם
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- הודעת סיום
DO $$
BEGIN
  RAISE NOTICE 'הטבלאות נוצרו בהצלחה! ✅';
  RAISE NOTICE 'נוצרו 6 טבלאות חדשות:';
  RAISE NOTICE '  - time_logs (לוגי זמן)';
  RAISE NOTICE '  - client_contacts (אנשי קשר)';
  RAISE NOTICE '  - client_sources (מקורות לקוחות)';
  RAISE NOTICE '  - roles (תפקידים)';
  RAISE NOTICE '  - permissions (הרשאות)';
  RAISE NOTICE '  - activity_logs (לוג פעילות)';
END $$;
