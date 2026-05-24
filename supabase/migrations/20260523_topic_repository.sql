-- CREATE TOPIC REPOSITORY TABLE
CREATE TABLE IF NOT EXISTS topic_repository (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  faculty TEXT,
  department TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE topic_repository ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public topics are viewable by everyone" 
ON topic_repository FOR SELECT 
USING (true);

-- Admin full access
CREATE POLICY "Admins have full access to topics" 
ON topic_repository FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);
