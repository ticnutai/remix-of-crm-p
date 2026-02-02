-- הוספת שדות חדשים לטבלת תבניות הצעות מחיר
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS stages jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS payment_schedule jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS validity_days integer DEFAULT 30;

-- הגדרות עיצוב
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS design_settings jsonb DEFAULT '{
  "logo_url": null,
  "company_name": "",
  "company_subtitle": "",
  "primary_color": "#d8ac27",
  "secondary_color": "#1a365d",
  "header_style": "gradient"
}'::jsonb;

-- מידע נוסף
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS important_notes text[] DEFAULT '{}';
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS show_vat boolean DEFAULT true;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 17;