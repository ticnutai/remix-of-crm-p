-- Add html_content column to quote_templates table for storing original HTML templates
ALTER TABLE quote_templates 
ADD COLUMN IF NOT EXISTS html_content TEXT;

-- Add comment for documentation
COMMENT ON COLUMN quote_templates.html_content IS 'Original HTML content for visual editing';
