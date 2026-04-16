-- 1. CREATE MARKETPLACE WALLETS TABLE
CREATE TABLE IF NOT EXISTS marketplace_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0, -- Stored in Naira (e.g. 5000)
  currency TEXT DEFAULT 'NGN',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'purchase', 'payout', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference TEXT UNIQUE, -- Flutterwave reference or internal ID
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FUNCTION: AUTO-CREATE WALLET FOR NEW USERS
CREATE OR REPLACE FUNCTION handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.marketplace_wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: TRIGGER WALLET CREATION ON USER PROFILE INSERT
-- Assuming users are added to user_profiles table during onboarding
DROP TRIGGER IF EXISTS trigger_handle_new_user_wallet ON public.user_profiles;
CREATE TRIGGER trigger_handle_new_user_wallet
AFTER INSERT ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION handle_new_user_wallet();

-- 5. FUNCTION: MANUALLY SEED WALLETS FOR EXISTING USERS
-- Run this once to ensure everyone has a wallet
INSERT INTO public.marketplace_wallets (user_id)
SELECT id FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- 6. RLS POLICIES
ALTER TABLE marketplace_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallets: Users can only see their own wallet
CREATE POLICY "Users can view own wallet" ON marketplace_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users can only see their own transactions
CREATE POLICY "Users can view own wallet transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can see everything
CREATE POLICY "Admins can view all wallets" ON marketplace_wallets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all transactions" ON wallet_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );
