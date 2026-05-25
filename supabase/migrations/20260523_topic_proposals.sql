-- CREATE TOPIC PROPOSALS TABLE
CREATE TABLE IF NOT EXISTS topic_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_title TEXT NOT NULL,
  topic_data JSONB NOT NULL,
  custom_instructions TEXT,
  proposal_content TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, generated
  modification_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE topic_proposals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own proposals
CREATE POLICY "Users can view their own proposals" 
ON topic_proposals FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own proposals
CREATE POLICY "Users can create their own proposals" 
ON topic_proposals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own proposals
CREATE POLICY "Users can update their own proposals" 
ON topic_proposals FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can see everything
CREATE POLICY "Admins have full access to proposals" 
ON topic_proposals FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);
