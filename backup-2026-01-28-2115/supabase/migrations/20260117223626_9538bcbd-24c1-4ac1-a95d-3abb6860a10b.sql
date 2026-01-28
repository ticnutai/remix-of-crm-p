-- Add email template support to reminders table
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS email_template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS email_variables jsonb DEFAULT '{}'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_reminders_email_template_id ON reminders(email_template_id);