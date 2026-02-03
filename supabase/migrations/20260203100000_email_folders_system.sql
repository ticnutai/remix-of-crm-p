-- Email Folders System
-- Allows users to create folders, classify emails, and auto-sort by client

-- Email Folders Table
CREATE TABLE IF NOT EXISTS email_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'folder',
    parent_folder_id UUID REFERENCES email_folders(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Folder Items (emails in folders)
CREATE TABLE IF NOT EXISTS email_folder_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES email_folders(id) ON DELETE CASCADE,
    email_id TEXT NOT NULL,
    email_subject TEXT,
    email_from TEXT,
    email_date TIMESTAMPTZ,
    email_snippet TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    notes TEXT,
    is_starred BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(folder_id, email_id)
);

-- Auto-classification Rules
CREATE TABLE IF NOT EXISTS email_auto_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    folder_id UUID NOT NULL REFERENCES email_folders(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('sender_email', 'sender_name', 'subject_contains', 'client_match')),
    rule_value TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_folders_user ON email_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_folders_client ON email_folders(client_id);
CREATE INDEX IF NOT EXISTS idx_email_folder_items_folder ON email_folder_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_email_folder_items_email ON email_folder_items(email_id);
CREATE INDEX IF NOT EXISTS idx_email_folder_items_client ON email_folder_items(client_id);
CREATE INDEX IF NOT EXISTS idx_email_auto_rules_user ON email_auto_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_email_auto_rules_folder ON email_auto_rules(folder_id);

-- RLS Policies
ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_folder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_auto_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage their own email folders" ON email_folders;
    DROP POLICY IF EXISTS "Users can manage their own email folder items" ON email_folder_items;
    DROP POLICY IF EXISTS "Users can manage their own email auto rules" ON email_auto_rules;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Users can manage their own email folders"
    ON email_folders FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own email folder items"
    ON email_folder_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own email auto rules"
    ON email_auto_rules FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to auto-create client folders
CREATE OR REPLACE FUNCTION create_client_email_folder()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a folder for the new client
    INSERT INTO email_folders (user_id, name, color, icon, client_id, is_system)
    VALUES (NEW.user_id, NEW.name, '#3B82F6', 'user', NEW.id, TRUE)
    ON CONFLICT DO NOTHING;
    
    -- Create auto-rule if client has email
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        INSERT INTO email_auto_rules (
            user_id, 
            name, 
            folder_id, 
            rule_type, 
            rule_value, 
            client_id
        )
        SELECT 
            NEW.user_id,
            'מיילים מ-' || NEW.name,
            f.id,
            'sender_email',
            LOWER(TRIM(NEW.email)),
            NEW.id
        FROM email_folders f
        WHERE f.client_id = NEW.id AND f.user_id = NEW.user_id
        LIMIT 1
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create client folders
DROP TRIGGER IF EXISTS trigger_create_client_email_folder ON clients;
CREATE TRIGGER trigger_create_client_email_folder
    AFTER INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION create_client_email_folder();

-- Function to update auto-rule when client email changes
CREATE OR REPLACE FUNCTION update_client_email_rule()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        -- Update existing rule
        UPDATE email_auto_rules
        SET rule_value = LOWER(TRIM(NEW.email)),
            updated_at = NOW()
        WHERE client_id = NEW.id AND rule_type = 'sender_email';
        
        -- If no email, deactivate rule
        IF NEW.email IS NULL OR NEW.email = '' THEN
            UPDATE email_auto_rules
            SET is_active = FALSE, updated_at = NOW()
            WHERE client_id = NEW.id;
        ELSE
            -- Reactivate if email added
            UPDATE email_auto_rules
            SET is_active = TRUE, updated_at = NOW()
            WHERE client_id = NEW.id;
        END IF;
    END IF;
    
    -- Update folder name if client name changes
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        UPDATE email_folders
        SET name = NEW.name, updated_at = NOW()
        WHERE client_id = NEW.id AND is_system = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for client updates
DROP TRIGGER IF EXISTS trigger_update_client_email_rule ON clients;
CREATE TRIGGER trigger_update_client_email_rule
    AFTER UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_client_email_rule();

-- Function to get folder stats
CREATE OR REPLACE FUNCTION get_email_folder_stats(p_user_id UUID)
RETURNS TABLE (
    folder_id UUID,
    folder_name TEXT,
    email_count BIGINT,
    unread_count BIGINT,
    starred_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as folder_id,
        f.name as folder_name,
        COUNT(i.id) as email_count,
        COUNT(CASE WHEN NOT i.is_starred THEN 1 END) as unread_count,
        COUNT(CASE WHEN i.is_starred THEN 1 END) as starred_count
    FROM email_folders f
    LEFT JOIN email_folder_items i ON f.id = i.folder_id
    WHERE f.user_id = p_user_id
    GROUP BY f.id, f.name
    ORDER BY f.sort_order, f.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
