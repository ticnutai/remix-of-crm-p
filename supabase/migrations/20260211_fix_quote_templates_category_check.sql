-- Fix: update quote_templates category CHECK constraint to match Hebrew categories used in frontend
-- The original constraint only allowed English values: construction, consulting, design, development, marketing, other
-- But the frontend and importers use Hebrew values: היתר_בניה, תכנון_פנים, שיפוץ, פיקוח, ייעוץ, אחר

ALTER TABLE quote_templates DROP CONSTRAINT IF EXISTS quote_templates_category_check;

ALTER TABLE quote_templates ADD CONSTRAINT quote_templates_category_check 
  CHECK (category IN (
    'construction', 'consulting', 'design', 'development', 'marketing', 'other',
    'היתר_בניה', 'תכנון_פנים', 'שיפוץ', 'פיקוח', 'ייעוץ', 'אחר'
  ));
