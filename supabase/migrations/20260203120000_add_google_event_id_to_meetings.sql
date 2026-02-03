-- Add google_event_id column to meetings table for two-way Google Calendar sync
-- This allows tracking which meetings were imported from Google Calendar

-- Add google_event_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meetings' 
        AND column_name = 'google_event_id'
    ) THEN
        ALTER TABLE public.meetings ADD COLUMN google_event_id TEXT;
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meetings_google_event_id ON public.meetings(google_event_id) WHERE google_event_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.meetings.google_event_id IS 'Google Calendar event ID for two-way sync';
