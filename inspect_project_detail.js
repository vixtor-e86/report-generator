
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkProject(id) {
  console.log(`\n--- Checking Project ID: ${id} ---`);

  // Check Standard
  const { data: stdProject } = await supabase.from('standard_projects').select('*').eq('id', id).single();
  if (stdProject) {
    console.log(`✅ Found in 'standard_projects'`);
    console.log(`Title: ${stdProject.title}`);
    
    const { data: stdChapters } = await supabase.from('standard_chapters').select('id, chapter_number, title, content').eq('project_id', id);
    console.log(`Chapters found: ${stdChapters?.length || 0}`);
    if (stdChapters?.length > 0) {
      console.log('First Chapter Content Preview:', stdChapters[0].content ? stdChapters[0].content.substring(0, 50) + '...' : 'NULL CONTENT');
    }
    return;
  }

  // Check Free
  const { data: freeProject } = await supabase.from('projects').select('*').eq('id', id).single();
  if (freeProject) {
    console.log(`✅ Found in 'projects' (Free)`);
    console.log(`Title: ${freeProject.title}`);

    const { data: freeChapters } = await supabase.from('chapters').select('id, chapter_number, title, content').eq('project_id', id);
    console.log(`Chapters found: ${freeChapters?.length || 0}`);
    if (freeChapters?.length > 0) {
      console.log('First Chapter Content Preview:', freeChapters[0].content ? freeChapters[0].content.substring(0, 50) + '...' : 'NULL CONTENT');
    }
    return;
  }

  console.log('❌ Project not found in either table.');
}

// Test with the ID found in previous logs
checkProject('aa87ddbd-0528-4378-bbf5-a7d4304f8a45'); 
