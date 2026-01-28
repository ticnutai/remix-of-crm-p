-- Create table for storing connected Google Calendar accounts
CREATE TABLE public.google_calendar_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  calendar_id TEXT DEFAULT 'primary',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_direction TEXT NOT NULL DEFAULT 'both' CHECK (sync_direction IN ('to_google', 'from_google', 'both')),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.google_calendar_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own Google accounts" 
ON public.google_calendar_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google accounts" 
ON public.google_calendar_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google accounts" 
ON public.google_calendar_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google accounts" 
ON public.google_calendar_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_google_calendar_accounts_updated_at
BEFORE UPDATE ON public.google_calendar_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for tracking synced events (to avoid duplicates)
CREATE TABLE public.google_calendar_synced_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.google_calendar_accounts(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_google', 'from_google')),
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (account_id, google_event_id)
);

-- Enable RLS for synced events
ALTER TABLE public.google_calendar_synced_events ENABLE ROW LEVEL SECURITY;

-- Create policies for synced events (through account ownership)
CREATE POLICY "Users can view their synced events" 
ON public.google_calendar_synced_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.google_calendar_accounts 
    WHERE id = google_calendar_synced_events.account_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create synced events" 
ON public.google_calendar_synced_events 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.google_calendar_accounts 
    WHERE id = google_calendar_synced_events.account_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update synced events" 
ON public.google_calendar_synced_events 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.google_calendar_accounts 
    WHERE id = google_calendar_synced_events.account_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete synced events" 
ON public.google_calendar_synced_events 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.google_calendar_accounts 
    WHERE id = google_calendar_synced_events.account_id 
    AND user_id = auth.uid()
  )
);