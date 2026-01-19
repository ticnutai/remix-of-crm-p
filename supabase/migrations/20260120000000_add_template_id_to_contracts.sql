ALTER TABLE contracts 
ADD COLUMN template_id UUID NULL 
REFERENCES contract_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_contracts_template_id ON contracts(template_id);
