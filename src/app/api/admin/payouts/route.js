// src/app/api/admin/payouts/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    // 1. Fetch Payouts with Profile details (excluding email)
    const { data: payouts, error } = await supabaseAdmin
      .from('referral_payouts')
      .select('*, user_profiles(username)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Fetch all Auth users to get emails
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (authError) throw authError;

    // 3. Merge email into the payout data
    const mergedPayouts = payouts.map(payout => {
      const authUser = authUsers.find(u => u.id === payout.user_id);
      return {
        ...payout,
        user_profiles: {
          ...payout.user_profiles,
          email: authUser?.email || 'N/A'
        }
      };
    });

    return NextResponse.json(mergedPayouts);
  } catch (error) {
    console.error('Payouts GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { payoutId, status } = await request.json();
    
    if (!payoutId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const updateData = { 
      status, 
      paid_at: status === 'paid' ? new Date().toISOString() : null 
    };

    const { data, error } = await supabaseAdmin
      .from('referral_payouts')
      .update(updateData)
      .eq('id', payoutId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, payout: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
