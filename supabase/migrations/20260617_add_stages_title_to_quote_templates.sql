-- Add stages_title column to quote_templates
-- Allows storing an editable main heading above all stages (default: "שלבי העבודה")
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS stages_title text;
