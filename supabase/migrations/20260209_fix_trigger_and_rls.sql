-- Fix the trigger function to handle null user_id gracefully
-- The original function crashes when NEW.user_id is null (e.g., no auth session)

CREATE OR REPLACE FUNCTION create_client_email_folder()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create email folder if user_id is available
    IF NEW.user_id IS NOT NULL THEN
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the update trigger
CREATE OR REPLACE FUNCTION update_client_email_rule()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        IF NEW.user_id IS NOT NULL THEN
            -- Update existing rule
            UPDATE email_auto_rules
            SET rule_value = LOWER(TRIM(NEW.email)),
                is_active = (NEW.email IS NOT NULL AND NEW.email != '')
            WHERE client_id = NEW.id AND user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS properly on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on clients (clean slate)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'clients' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.clients', pol.policyname);
    END LOOP;
END $$;

-- Create simple permissive policies for ALL roles
CREATE POLICY "allow_select_all" ON public.clients 
    FOR SELECT USING (true);

CREATE POLICY "allow_insert_all" ON public.clients 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_update_all" ON public.clients 
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "allow_delete_all" ON public.clients 
    FOR DELETE USING (true);
