
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugProject(id) {
  console.log(`\n--- DEBUGGING PROJECT ID: ${id} ---`);

  // 1. Attempt Standard Project Lookup
  console.log("Checking 'standard_projects'...");
  let { data: stdProject, error: stdError } = await supabase
    .from('standard_projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (stdError) console.log('Standard Error:', stdError.message);
  
  if (stdProject) {
    console.log('✅ Found in standard_projects');
    return;
  } else {
    console.log('❌ Not found in standard_projects');
  }

  // 2. Attempt Free Project Lookup
  console.log("Checking 'projects'...");
  let { data: freeProject, error: freeError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (freeError) console.log('Free Error:', freeError.message);

  if (freeProject) {
    console.log('✅ Found in projects');
    return;
  } else {
    console.log('❌ Not found in projects');
  }

  console.log('⚠️ CONCLUSION: Project ID exists in neither table.');
}

debugProject('176cd875-e17b-468b-a25a-c71b99114a9a');
