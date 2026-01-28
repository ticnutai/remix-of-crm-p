-- Remove the old constraint that limits category values
ALTER TABLE contract_templates 
DROP CONSTRAINT IF EXISTS contract_templates_contract_type_check;