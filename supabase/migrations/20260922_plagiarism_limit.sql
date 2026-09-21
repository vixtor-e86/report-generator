-- Migration to add plagiarism limit columns to premium_projects
ALTER TABLE premium_projects ADD COLUMN IF NOT EXISTS plagiarism_words_used INTEGER DEFAULT 0;
ALTER TABLE premium_projects ADD COLUMN IF NOT EXISTS plagiarism_words_limit INTEGER DEFAULT 10000;