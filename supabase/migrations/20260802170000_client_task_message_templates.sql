-- Multiple reusable templates for messages initiated from client-stage tasks.
-- Keep the legacy message_template/default_channel columns populated for
-- backwards compatibility with older deployments and edge functions.

ALTER TABLE public.client_task_message_settings
  ADD COLUMN IF NOT EXISTS message_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_template_id TEXT;

UPDATE public.client_task_message_settings
SET
  message_templates = jsonb_build_array(
    jsonb_build_object(
      'id', 'default',
      'name', 'תבנית מרכזית',
      'message_template', message_template,
      'default_channel', default_channel
    )
  ),
  default_template_id = 'default'
WHERE scope = 'default'
  AND jsonb_array_length(message_templates) = 0;

UPDATE public.client_task_message_settings
SET default_template_id = COALESCE(
  default_template_id,
  message_templates->0->>'id'
)
WHERE scope = 'default';

COMMENT ON COLUMN public.client_task_message_settings.message_templates IS
  'Reusable company-wide task-message templates stored as an ordered JSON array';
COMMENT ON COLUMN public.client_task_message_settings.default_template_id IS
  'Template selected automatically when a task-message dialog opens';
