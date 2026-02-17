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

-- Index for faster history queries
CREATE INDEX idx_premium_chapter_history_chapter_id ON premium_chapter_history(chapter_id);
