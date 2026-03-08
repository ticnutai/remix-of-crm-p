-- ============================================
-- Migration: Quote Cloud Save and Versions System
-- Date: 2026-02-08
-- ============================================

-- 1. Add missing columns to quote_templates table
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS text_boxes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS upgrades jsonb DEFAULT '[]'::jsonb;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS project_details jsonb DEFAULT '{}'::jsonb;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0;
ALTER TABLE quote_templates ADD COLUMN IF NOT EXISTS pricing_tiers jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN quote_templates.text_boxes IS 'Custom text boxes with styling';
COMMENT ON COLUMN quote_templates.upgrades IS 'תוספות ושדרוגים אופציונליים';
COMMENT ON COLUMN quote_templates.project_details IS 'פרטי פרויקט - גוש חלקה מגרש כתובת';
COMMENT ON COLUMN quote_templates.base_price IS 'מחיר בסיס להצעה';
COMMENT ON COLUMN quote_templates.pricing_tiers IS 'רמות תמחור - בסיסי/מתקדם/פרימיום';

-- 2. טבלת גרסאות הצעות מחיר
CREATE TABLE IF NOT EXISTS quote_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES quote_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  label text NOT NULL DEFAULT 'גרסה',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(template_id, version_number)
);

-- הערות
COMMENT ON TABLE quote_template_versions IS 'גרסאות שמורות של הצעות מחיר';
COMMENT ON COLUMN quote_template_versions.snapshot IS 'תמונת מצב מלאה: stages, paymentSteps, textBoxes, designSettings, basePrice, upgrades';

-- 3. אינדקסים
CREATE INDEX IF NOT EXISTS idx_quote_versions_template ON quote_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_quote_versions_created ON quote_template_versions(created_at DESC);

-- 4. RLS
ALTER TABLE quote_template_versions ENABLE ROW LEVEL SECURITY;

-- מדיניות קריאה - כל המשתמשים המאומתים
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_template_versions' AND policyname = 'quote_versions_select') THEN
    CREATE POLICY quote_versions_select ON quote_template_versions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- מדיניות הוספה
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_template_versions' AND policyname = 'quote_versions_insert') THEN
    CREATE POLICY quote_versions_insert ON quote_template_versions FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- מדיניות עדכון
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_template_versions' AND policyname = 'quote_versions_update') THEN
    CREATE POLICY quote_versions_update ON quote_template_versions FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- מדיניות מחיקה
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_template_versions' AND policyname = 'quote_versions_delete') THEN
    CREATE POLICY quote_versions_delete ON quote_template_versions FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 5. פונקציה לספירת גרסה הבאה
CREATE OR REPLACE FUNCTION get_next_version_number(p_template_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM quote_template_versions
  WHERE template_id = p_template_id;
$$;
