
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkIds(ids) {
  const tables = ['standard_projects', 'projects', 'standard_chapters', 'chapters'];
  
  for (const id of ids) {
    console.log(`\n=== Hunting for ID: ${id} ===`);
    let found = false;
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').eq('id', id);
      
      if (data && data.length > 0) {
        console.log(`✅ FOUND in table: '${table}'`);
        found = true;
      }
    }
    
    if (!found) {
      console.log(`❌ NOT FOUND in any known table.`);
    }
  }
}

// Test with the IDs reported by the user
checkIds([
  '116ed696-d030-47cc-be37-0400fa31a2b5',
  '5117a7ed-bb5c-48c3-a621-33bfcbd3d31c'
]);

