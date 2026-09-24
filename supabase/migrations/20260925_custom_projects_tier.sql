-- ==============================================================================
-- MIGRATION: CUSTOM CHAPTER PROJECTS SUPPORT
-- Adds 'custom' tier support, chapter selection tracking, and chapter context storage
-- ==============================================================================

-- 1. UPDATE PAYMENT_TRANSACTIONS TIER CONSTRAINT
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_tier_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_tier_check 
  CHECK (tier IN ('standard', 'premium', 'free', 'unlock', 'custom'));

-- 2. UPDATE STANDARD_PROJECTS TIER CONSTRAINT
ALTER TABLE standard_projects DROP CONSTRAINT IF EXISTS standard_projects_tier_check;
ALTER TABLE standard_projects ADD CONSTRAINT standard_projects_tier_check 
  CHECK (tier IN ('standard', 'premium', 'custom'));

-- 3. UPDATE BASE PROJECTS TIER CONSTRAINT (SAFETY)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_tier_check;
ALTER TABLE projects ADD CONSTRAINT projects_tier_check 
  CHECK (tier IN ('free', 'unlocked', 'custom'));

-- 4. ADD CUSTOM CHAPTER COLUMNS TO STANDARD_PROJECTS
ALTER TABLE standard_projects 
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_chapters INTEGER[] DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS uploaded_chapters JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS existing_references TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_rate_per_chapter NUMERIC DEFAULT 1500;

-- 5. ADD CUSTOM CHAPTER COLUMNS TO PREMIUM_PROJECTS
ALTER TABLE premium_projects 
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_chapters INTEGER[] DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS uploaded_chapters JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS existing_references TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_rate_per_chapter NUMERIC DEFAULT 5000;
