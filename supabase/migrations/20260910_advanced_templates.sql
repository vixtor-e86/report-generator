-- Add columns for advanced templates
ALTER TABLE templates
ADD COLUMN is_advanced BOOLEAN DEFAULT false,
ADD COLUMN school TEXT,
ADD COLUMN department TEXT,
ADD COLUMN ai_instruction TEXT;
