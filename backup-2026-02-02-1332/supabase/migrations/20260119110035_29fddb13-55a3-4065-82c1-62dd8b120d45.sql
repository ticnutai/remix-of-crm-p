-- Rename existing columns to match the code expectations (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='contract_templates' AND column_name='template_content') THEN
    ALTER TABLE contract_templates RENAME COLUMN template_content TO html_content;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='contract_templates' AND column_name='contract_type') THEN
    ALTER TABLE contract_templates RENAME COLUMN contract_type TO category;
  END IF;
END $$;

-- Add missing columns that the useContractTemplates hook expects
ALTER TABLE contract_templates
  ADD COLUMN IF NOT EXISTS css_styles TEXT,
  ADD COLUMN IF NOT EXISTS header_html TEXT,
  ADD COLUMN IF NOT EXISTS footer_html TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1e40af',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#64748b',
  ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_terms_and_conditions TEXT,
  ADD COLUMN IF NOT EXISTS default_payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS default_special_clauses TEXT,
  ADD COLUMN IF NOT EXISTS default_payment_schedule JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;