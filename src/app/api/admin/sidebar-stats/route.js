import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // We use head: true to only get the count, which is extremely fast
    
    // 1. Pending Manual Payments
    const { count: pendingPayments } = await supabaseAdmin
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 2. Pending Referral Payouts (They use 'processing' as default)
    const { count: pendingReferrals } = await supabaseAdmin
      .from('referral_payouts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    // 3. Pending Seller Applications
    const { count: pendingSellers } = await supabaseAdmin
      .from('marketplace_sellers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 4. Pending Marketplace Payouts
    const { count: pendingMarketPayouts } = await supabaseAdmin
      .from('marketplace_payouts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 5. Pending Marketplace Items (Blueprints)
    const { count: pendingItems } = await supabaseAdmin
      .from('marketplace_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json({
      payments: pendingPayments || 0,
      referrals: pendingReferrals || 0,
      sellers: pendingSellers || 0,
      marketPayouts: pendingMarketPayouts || 0,
      blueprints: pendingItems || 0
    });

  } catch (error) {
    console.error('Sidebar Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
