// src/app/api/admin/marketplace/wallets/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // 1. Fetch all wallets
    const { data: wallets, error: walletError } = await supabaseAdmin
      .from('marketplace_wallets')
      .select('*')
      .order('balance', { ascending: false });

    if (walletError) throw walletError;

    // 2. Fetch all user profiles for enrichment
    const userIds = wallets.map(w => w.user_id);
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, email')
      .in('id', userIds);

    // 3. Fetch transaction aggregates (Total Deposits vs Total Spent)
    const { data: aggregates, error: aggError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('user_id, amount, type, status')
      .eq('status', 'completed');

    if (aggError) console.error('Aggregates Error:', aggError);

    const enriched = wallets.map(wallet => {
      const userProfile = profiles?.find(p => p.id === wallet.user_id);
      const userTxs = aggregates?.filter(a => a.user_id === wallet.user_id) || [];
      
      const totalDeposited = userTxs
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalSpent = userTxs
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...wallet,
        user_profiles: userProfile || { username: 'Unknown', email: 'N/A' },
        total_deposited: totalDeposited,
        total_spent: totalSpent
      };
    });

    return NextResponse.json(enriched);

  } catch (error) {
    console.error('Wallets Admin Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
