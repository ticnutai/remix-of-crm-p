-- Google Accounts - unified table for all Google service permissions
CREATE TABLE public.google_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE public.google_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Google accounts"
  ON public.google_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google accounts"
  ON public.google_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google accounts"
  ON public.google_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google accounts"
  ON public.google_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Google Drive Files - track synced files
CREATE TABLE public.google_drive_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_account_id UUID REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  web_view_link TEXT,
  thumbnail_link TEXT,
  parent_folder_id TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  is_synced BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_drive_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own drive files"
  ON public.google_drive_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drive files"
  ON public.google_drive_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drive files"
  ON public.google_drive_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drive files"
  ON public.google_drive_files FOR DELETE
  USING (auth.uid() = user_id);

-- Email Messages - store imported emails
CREATE TABLE public.email_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_account_id UUID REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  from_email TEXT,
  from_name TEXT,
  to_emails TEXT[],
  cc_emails TEXT[],
  body_preview TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  labels TEXT[],
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_message_id)
);

-- Enable RLS
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own emails"
  ON public.email_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emails"
  ON public.email_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails"
  ON public.email_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails"
  ON public.email_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Google Contacts Sync - track imported contacts
CREATE TABLE public.google_contacts_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_account_id UUID REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  google_contact_id TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, google_contact_id)
);

-- Enable RLS
ALTER TABLE public.google_contacts_sync ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own contact syncs"
  ON public.google_contacts_sync FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact syncs"
  ON public.google_contacts_sync FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact syncs"
  ON public.google_contacts_sync FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact syncs"
  ON public.google_contacts_sync FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamps triggers
CREATE TRIGGER update_google_accounts_updated_at
  BEFORE UPDATE ON public.google_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_drive_files_updated_at
  BEFORE UPDATE ON public.google_drive_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON public.email_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();