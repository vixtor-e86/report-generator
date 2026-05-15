-- 1. ADD BANK DETAILS TO MARKETPLACE_SELLERS
ALTER TABLE marketplace_sellers 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 2. CREATE MARKETPLACE PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS marketplace_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES marketplace_sellers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected')),
  
  -- Snapshot of bank details at time of request
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  
  admin_notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE marketplace_payouts ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
DO $$ BEGIN
    CREATE POLICY "Sellers can view own payouts" ON marketplace_payouts
      FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Sellers can create payout requests" ON marketplace_payouts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin can view and update all
DO $$ BEGIN
    CREATE POLICY "Admins full access to marketplace payouts" ON marketplace_payouts
      FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
