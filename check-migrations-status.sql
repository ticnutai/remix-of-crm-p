-- Check which migrations have been applied
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;

-- Count total migrations
SELECT COUNT(*) as total_migrations 
FROM supabase_migrations.schema_migrations;

-- Check if email_metadata table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_metadata'
) as email_metadata_exists;

-- Check if advanced email tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_templates'
) as email_templates_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_queue'
) as email_queue_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_tracking'
) as email_tracking_exists;

-- Check quotes and contracts tables
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'quotes'
) as quotes_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'contracts'
) as contracts_exists;
