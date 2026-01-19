-- Verification query: Check how many time_entries have old client_ids
SELECT 
  COUNT(*) as total_entries_needing_fix,
  COUNT(DISTINCT te.client_id) as distinct_old_client_ids
FROM time_entries te
JOIN clients c ON c.original_id = te.client_id::text
WHERE te.client_id IS NOT NULL
  AND c.original_id IS NOT NULL;

-- Show sample of entries that will be updated
SELECT 
  te.id as time_entry_id,
  te.client_id::text as old_client_id,
  c.id as new_client_id,
  c.name as client_name,
  te.description as entry_description
FROM time_entries te
JOIN clients c ON c.original_id = te.client_id::text
WHERE te.client_id IS NOT NULL
  AND c.original_id IS NOT NULL
LIMIT 10;
