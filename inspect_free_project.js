
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspectFree() {
  console.log('--- Hunting for a Free Project ---');
  
  // 1. Find a Free Project
  const { data: freeProject } = await supabase
    .from('projects')
    .select('id, title')
    .limit(1)
    .single();

  if (!freeProject) {
    console.log('❌ No free projects found.');
    return;
  }

  console.log(`✅ Found Free Project: ${freeProject.id} (${freeProject.title})`);

  // 2. Check its content in `chapters`
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, title, content')
    .eq('project_id', freeProject.id);

  console.log(`Found ${chapters?.length || 0} chapters.`);
  
  if (chapters && chapters.length > 0) {
    chapters.forEach(c => {
      console.log(`\nChapter ${c.chapter_number}: ${c.title}`);
      console.log(`Content Length: ${c.content ? c.content.length : 0}`);
      console.log(`Preview: ${c.content ? c.content.substring(0, 50) : 'NULL'}`);
    });
  }
}

inspectFree();
