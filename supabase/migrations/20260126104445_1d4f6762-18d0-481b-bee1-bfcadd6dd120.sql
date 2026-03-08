-- הוספת עמודות חדשות לניהול מורחב של מיגרציות
ALTER TABLE public.migration_logs ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;
ALTER TABLE public.migration_logs ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'execute';
ALTER TABLE public.migration_logs ADD COLUMN IF NOT EXISTS rollback_sql TEXT;
ALTER TABLE public.migration_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE public.migration_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- יצירת אינדקסים לחיפוש מהיר
CREATE INDEX IF NOT EXISTS idx_migration_logs_status ON public.migration_logs(status);
CREATE INDEX IF NOT EXISTS idx_migration_logs_name ON public.migration_logs(name);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON public.migration_logs(executed_at DESC);