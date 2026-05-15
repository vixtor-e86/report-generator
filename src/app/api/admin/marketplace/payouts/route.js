// src/app/api/admin/marketplace/payouts/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data: payouts, error } = await supabaseAdmin
      .from('marketplace_payouts')
      .select('*, marketplace_sellers(first_name, last_name, phone_number)')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch emails from Auth
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
    
    const enriched = payouts.map(p => ({
        ...p,
        email: authUsers.find(u => u.id === p.user_id)?.email || 'N/A'
    }));

    return NextResponse.json(enriched);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { payoutId, status, adminNotes } = await request.json();

    if (!payoutId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: payout, error: fetchError } = await supabaseAdmin
        .from('marketplace_payouts')
        .select('*')
        .eq('id', payoutId)
        .single();
    
    if (fetchError) throw fetchError;

    // If rejected, refund the seller
    if (status === 'rejected') {
        const { data: wallet } = await supabaseAdmin
            .from('marketplace_seller_wallets')
            .select('balance')
            .eq('user_id', payout.user_id)
            .single();
        
        await supabaseAdmin
            .from('marketplace_seller_wallets')
            .update({ balance: (wallet?.balance || 0) + payout.amount })
            .eq('user_id', payout.user_id);
    }

    const { error: updateError } = await supabaseAdmin
      .from('marketplace_payouts')
      .update({
        status,
        admin_notes: adminNotes,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId);

    if (updateError) throw updateError;

    // Notify seller
    await supabaseAdmin.from('marketplace_notifications').insert({
        user_id: payout.user_id,
        title: status === 'paid' ? 'Payout Disbursed' : 'Payout Rejected',
        message: status === 'paid' 
            ? `Your payout of ₦${payout.amount.toLocaleString()} has been processed and sent to your account.`
            : `Your payout request was rejected. Reason: ${adminNotes}`,
        type: status === 'paid' ? 'success' : 'error'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
