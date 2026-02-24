
-- Add metadata column to client_messages for attachments
ALTER TABLE public.client_messages ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

-- Create client_meeting_requests table for portal meeting requests
CREATE TABLE IF NOT EXISTS public.client_meeting_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  preferred_date timestamp with time zone,
  preferred_time_slot text,
  meeting_type text DEFAULT 'in_person',
  status text DEFAULT 'pending',
  staff_response text,
  calendar_event_id uuid REFERENCES public.calendar_events(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.client_meeting_requests ENABLE ROW LEVEL SECURITY;

-- Clients can view their own meeting requests
CREATE POLICY "Clients can view own meeting requests"
  ON public.client_meeting_requests FOR SELECT
  USING (
    client_id = public.get_client_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'super_manager')
  );

-- Clients can create meeting requests
CREATE POLICY "Clients can create meeting requests"
  ON public.client_meeting_requests FOR INSERT
  WITH CHECK (
    client_id = public.get_client_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Staff can update meeting requests
CREATE POLICY "Staff can update meeting requests"
  ON public.client_meeting_requests FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'super_manager')
    OR client_id = public.get_client_id(auth.uid())
  );

-- Create client_notifications table
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- Clients can view their own notifications
CREATE POLICY "Clients can view own notifications"
  ON public.client_notifications FOR SELECT
  USING (
    client_id = public.get_client_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Clients can update (mark as read) their own notifications
CREATE POLICY "Clients can update own notifications"
  ON public.client_notifications FOR UPDATE
  USING (client_id = public.get_client_id(auth.uid()));

-- Staff can create notifications for clients
CREATE POLICY "Staff can create notifications"
  ON public.client_notifications FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'super_manager')
    OR public.has_role(auth.uid(), 'employee')
  );

-- Also ensure calendar_events RLS allows client access
CREATE POLICY "Clients can view their calendar events"
  ON public.calendar_events FOR SELECT
  USING (
    client_id = public.get_client_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'super_manager')
    OR public.has_role(auth.uid(), 'employee')
  );
