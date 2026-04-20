-- 1. CREATE SELLER WALLETS TABLE
CREATE TABLE IF NOT EXISTS marketplace_seller_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  seller_id UUID REFERENCES marketplace_sellers(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0, -- Stored in Naira (70% of sales)
  total_earned INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE RLS
ALTER TABLE marketplace_seller_wallets ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
CREATE POLICY "Sellers can view own earnings" ON marketplace_seller_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can view all
CREATE POLICY "Admins view all seller wallets" ON marketplace_seller_wallets
  FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. TRIGGER: AUTO-CREATE SELLER WALLET ON APPROVAL
CREATE OR REPLACE FUNCTION handle_approved_seller_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.marketplace_seller_wallets (user_id, seller_id)
    VALUES (NEW.user_id, NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_approved_seller_wallet ON public.marketplace_sellers;
CREATE TRIGGER trigger_handle_approved_seller_wallet
AFTER UPDATE OF status ON public.marketplace_sellers
FOR EACH ROW EXECUTE FUNCTION handle_approved_seller_wallet();
