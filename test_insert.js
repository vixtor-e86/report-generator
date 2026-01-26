const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  const userId = '5ccf1de0-02bb-43cb-86f4-e9bbf1403a67'; // Valid user from previous inspect
  // const projectId = 'c3f736e7-a3b8-4285-9a5c-b33b595c3127'; // Valid project from previous inspect
  // Use NULL project_id first to test 'tier'
  
  console.log('Testing insert with tier="free_unlock"...');
  
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({
      user_id: userId,
      project_id: null,
      amount: 2000,
      currency: 'NGN',
      tier: 'free_unlock',
      status: 'pending',
      paystack_reference: `TEST_${Date.now()}`,
      paystack_authorization_url: 'http://test.com',
      ip_address: '127.0.0.1',
      user_agent: 'TestScript'
    })
    .select()
    .single();

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
