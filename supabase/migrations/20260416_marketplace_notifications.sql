-- 1. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS marketplace_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE RLS
ALTER TABLE marketplace_notifications ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
CREATE POLICY "Users can view own notifications" ON marketplace_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark as read)" ON marketplace_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can create notifications
CREATE POLICY "Admins can manage notifications" ON marketplace_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. FUNCTION: AUTO-REFRESH UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
