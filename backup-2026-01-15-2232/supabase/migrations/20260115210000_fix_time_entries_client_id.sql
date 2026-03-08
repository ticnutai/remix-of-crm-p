-- Fix time_entries client_id to match new UUIDs from migration
-- This maps old client_id (stored in original_id) to new UUID in clients table

DO $$
DECLARE
  updated_count INTEGER := 0;
  old_id TEXT;
  new_id UUID;
  entry_cursor CURSOR FOR
    SELECT DISTINCT te.client_id::text as old_client_id, c.id as new_client_id
    FROM time_entries te
    JOIN clients c ON c.original_id = te.client_id::text
    WHERE te.client_id IS NOT NULL
    AND c.original_id IS NOT NULL;
BEGIN
  -- Loop through all time entries that need updating
  FOR record IN entry_cursor LOOP
    old_id := record.old_client_id;
    new_id := record.new_client_id;
    
    -- Update time_entries with the new UUID
    UPDATE time_entries
    SET client_id = new_id
    WHERE client_id::text = old_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Updated % time entries: % -> %', updated_count, old_id, new_id;
  END LOOP;
  
  RAISE NOTICE 'Client ID migration complete!';
END $$;

-- Add comment explaining the migration
COMMENT ON TABLE time_entries IS 'Time tracking entries. client_id was migrated from old string IDs to new UUIDs based on clients.original_id mapping';
