
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugStats() {
  console.log('\n--- DEBUGGING DASHBOARD STATS ---');

  // 1. Total Users
  const { count: usersCount, error: usersError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Users: ${usersCount} (Error: ${usersError?.message})`);

  // 2. Total Revenue
  const { data: payments, error: revError } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('status', 'paid');
  
  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  console.log(`Revenue: ${totalRevenue} (Error: ${revError?.message})`);

  // 3. Projects Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  console.log(`Checking projects since: ${todayIso}`);

  const { data: stdToday, error: stdError } = await supabase
    .from('standard_projects')
    .select('id, tier')
    .gte('created_at', todayIso);
  
  console.log(`Std Projects Today: ${stdToday?.length} (Error: ${stdError?.message})`);

  const { data: freeToday, error: freeError } = await supabase
    .from('projects')
    .select('id')
    .gte('created_at', todayIso);

  console.log(`Free Projects Today: ${freeToday?.length} (Error: ${freeError?.message})`);
}

debugStats();
