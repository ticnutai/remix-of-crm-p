-- Add missing columns to clients table for contract templates
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS gush TEXT,
ADD COLUMN IF NOT EXISTS helka TEXT,
ADD COLUMN IF NOT EXISTS migrash TEXT,
ADD COLUMN IF NOT EXISTS taba TEXT;

COMMENT ON COLUMN clients.id_number IS 'תעודת זהות / ח.פ';
COMMENT ON COLUMN clients.gush IS 'גוש';
COMMENT ON COLUMN clients.helka IS 'חלקה';
COMMENT ON COLUMN clients.migrash IS 'מגרש';
COMMENT ON COLUMN clients.taba IS 'תב"ע (תכנית בניין עיר)';