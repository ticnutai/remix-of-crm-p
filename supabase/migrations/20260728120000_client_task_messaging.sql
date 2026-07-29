-- Central task-message template and auditable delivery history.
-- Provider credentials remain in platform_settings and are only read server-side.

CREATE TABLE IF NOT EXISTS public.client_task_message_settings (
  scope TEXT PRIMARY KEY DEFAULT 'default' CHECK (scope = 'default'),
  office_name TEXT NOT NULL DEFAULT 'משרד האדריכלים',
  message_template TEXT NOT NULL DEFAULT E'שלום וברכה {client_name},\n{office_name} מבקש להשלים או לשלוח את הפריט הבא:\n{task_title}\nבמסגרת השלב: {stage_name}\nנשמח לעדכון לאחר הטיפול. תודה.',
  default_channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (default_channel IN ('whatsapp', 'sms')),
  preview_before_send BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.client_task_message_settings (scope)
VALUES ('default')
ON CONFLICT (scope) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.client_task_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.client_stage_tasks(id) ON DELETE SET NULL,
  stage_id TEXT,
  stage_name TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'failed')),
  provider TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_client_task_message_log_client_created
  ON public.client_task_message_log (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_task_message_log_task_created
  ON public.client_task_message_log (task_id, created_at DESC);

ALTER TABLE public.client_task_message_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_task_message_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated staff can read task message settings" ON public.client_task_message_settings;
CREATE POLICY "Authenticated staff can read task message settings"
  ON public.client_task_message_settings FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage task message settings" ON public.client_task_message_settings;
CREATE POLICY "Admins can manage task message settings"
  ON public.client_task_message_settings FOR ALL TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Staff can read task message history" ON public.client_task_message_log;
CREATE POLICY "Staff can read task message history"
  ON public.client_task_message_log FOR SELECT TO authenticated
  USING (
    public.is_admin_or_manager(auth.uid())
    OR public.has_role(auth.uid(), 'employee'::public.app_role)
  );

DROP POLICY IF EXISTS "Staff can create task message history" ON public.client_task_message_log;
CREATE POLICY "Staff can create task message history"
  ON public.client_task_message_log FOR INSERT TO authenticated
  WITH CHECK (
    sent_by = auth.uid()
    AND (
      public.is_admin_or_manager(auth.uid())
      OR public.has_role(auth.uid(), 'employee'::public.app_role)
    )
  );

GRANT SELECT ON public.client_task_message_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.client_task_message_settings TO authenticated;
GRANT SELECT, INSERT ON public.client_task_message_log TO authenticated;

COMMENT ON TABLE public.client_task_message_settings IS 'Company-wide template for messages sent from client stage tasks';
COMMENT ON TABLE public.client_task_message_log IS 'Audit history for WhatsApp and SMS actions initiated from client stage tasks';
