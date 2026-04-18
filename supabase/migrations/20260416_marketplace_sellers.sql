-- 1. CREATE SELLER APPLICATIONS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS marketplace_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email_updates TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  
  -- School Logic (Corrected table name to 'universities')
  institution_id UUID REFERENCES public.universities(id), 
  custom_institution TEXT, -- Used if they tick "Not found"
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  
  -- Assets & Identity (Stored in Cloudflare R2)
  passport_url TEXT NOT NULL, 
  
  -- Status Logic
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE MARKETPLACE PROJECTS TABLE (The items for sale)
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES marketplace_sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  price INTEGER NOT NULL, -- Stored in Naira
  
  -- Cloudflare R2 Storage Links
  file_url TEXT NOT NULL, -- The main ZIP/PDF archive
  preview_images TEXT[], -- Array of gallery image URLs
  
  -- Metadata
  sales_count INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'hidden', 'rejected')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE marketplace_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
-- Sellers can view their own application
DO $$ BEGIN
    CREATE POLICY "Users can view own seller profile" ON marketplace_sellers
      FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anyone can view active marketplace items
DO $$ BEGIN
    CREATE POLICY "Public can view active items" ON marketplace_items
      FOR SELECT USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sellers can manage their own items
DO $$ BEGIN
    CREATE POLICY "Sellers can manage own items" ON marketplace_items
      FOR ALL USING (
        seller_id IN (SELECT id FROM marketplace_sellers WHERE user_id = auth.uid())
      );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin has full access
DO $$ BEGIN
    CREATE POLICY "Admins full access" ON marketplace_sellers FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins full access items" ON marketplace_items FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
