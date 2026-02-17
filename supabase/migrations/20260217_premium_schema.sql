-- Create table for Premium Chapters
CREATE TABLE IF NOT EXISTS premium_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES premium_projects(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'generating', 'draft', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, chapter_number)
);

-- Create table for Premium Chapter History (Versioning)
CREATE TABLE IF NOT EXISTS premium_chapter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES premium_chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  prompt_used TEXT,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely handle the index
CREATE INDEX IF NOT EXISTS idx_premium_chapter_history_chapter_id ON premium_chapter_history(chapter_id);

-- Enable RLS
ALTER TABLE premium_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_chapter_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent "already exists" errors during re-runs
DROP POLICY IF EXISTS "Users can view their own chapters" ON premium_chapters;
DROP POLICY IF EXISTS "Users can view their own history" ON premium_chapter_history;

-- Policies for premium_chapters
CREATE POLICY "Users can view their own chapters" ON premium_chapters
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM premium_projects WHERE id = project_id));

-- Policies for premium_chapter_history
CREATE POLICY "Users can view their own history" ON premium_chapter_history
  FOR SELECT USING (
    chapter_id IN (
      SELECT id FROM premium_chapters WHERE project_id IN (
        SELECT id FROM premium_projects WHERE user_id = auth.uid()
      )
    )
  );
