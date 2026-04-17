// src/app/api/admin/marketplace/stats/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const [
      { count: walletCount },
      { data: balanceData },
      { count: pendingCount },
      { data: spentData }
    ] = await Promise.all([
      supabaseAdmin.from('marketplace_wallets').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('marketplace_wallets').select('balance'),
      supabaseAdmin.from('wallet_transactions').select('*', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'pending'),
      supabaseAdmin.from('wallet_transactions').select('amount').eq('type', 'purchase').eq('status', 'completed')
    ]);

    const totalLiquidity = balanceData?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0;
    const totalSpent = spentData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

    return NextResponse.json({
      totalWallets: walletCount || 0,
      totalLiquidity,
      pendingFunding: pendingCount || 0,
      totalSpent
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
