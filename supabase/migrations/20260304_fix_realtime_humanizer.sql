-- Enable access to new humanizer columns for authenticated users
-- Since the columns were added via ALTER TABLE, existing SELECT policies 
-- using '*' should pick them up, but sometimes explicit column permissions 
-- or cache issues in Supabase Realtime occur.

-- This ensures that the user can always see their own project's new columns
DO $$ 
BEGIN
  -- We don't need to create a new policy if 'Enable read access for all users' or similar exists,
  -- but we can explicitly grant usage if needed. 
  -- Most likely, the issue is that the Realtime Publication doesn't include the new columns.
  
  -- Add the new columns to the realtime publication if it exists
  ALTER PUBLICATION supabase_realtime ADD TABLE premium_projects;
EXCEPTION
  WHEN others THEN 
    -- If already in publication or publication doesn't exist, just continue
    NULL;
END $$;
