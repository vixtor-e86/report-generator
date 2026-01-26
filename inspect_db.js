const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTable(tableName) {
  console.log(`\n--- Inspecting ${tableName} ---`);
  // Get one row to see columns (if any data exists)
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  
  if (error) {
    console.error(`Error inspecting ${tableName}:`, error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Sample row:', data[0]);
  } else {
    console.log('Table is empty, cannot infer columns from data. Attempting to insert dummy to fail and get schema? No, better to just list empty.');
    // Try to get structure via an empty insert error or just checking documentation? 
    // Since I can't run SQL directly easily here without an SQL tool or RPC, assuming empty means I might need to guess or try a dummy insert.
    // However, usually there is some data.
  }
}

async function run() {
  await inspectTable('projects');
  await inspectTable('payment_transactions');
}

run();
