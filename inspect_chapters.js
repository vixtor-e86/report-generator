
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspect() {
  // List all tables to find chapter related ones
  // Since I can't list tables easily via API without SQL, I'll guess common names
  const tables = ['standard_projects', 'standard_chapters', 'projects', 'chapters', 'standard_generation_history'];
  
  for (const table of tables) {
    console.log(`\n--- Checking table: ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.log(`Error or table not found: ${error.message}`);
    } else if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
      console.log('Sample:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Table exists but is empty.');
    }
  }
}

inspect();
