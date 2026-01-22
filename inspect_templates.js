
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspectTable(tableName) {
  console.log(`\n--- Inspecting Table: ${tableName} ---`);
  
  const { data, error } = await supabase.from(tableName).select('*').limit(1);

  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]).join(', '));
    console.log('Sample Row:', JSON.stringify(data[0], null, 2));
  } else {
    console.log(`Table ${tableName} is empty or no read access.`);
  }
}

async function run() {
  await inspectTable('templates');
}

run();
