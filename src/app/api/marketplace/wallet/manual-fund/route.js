// src/app/api/marketplace/wallet/manual-fund/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, amount } = await request.json();

    // Validate inputs
    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fixed amount validation (5k, 10k, 20k, 50k)
    const allowedAmounts = [5000, 10000, 20000, 50000];
    if (!allowedAmounts.includes(Number(amount))) {
      return NextResponse.json(
        { error: 'Invalid funding amount' },
        { status: 400 }
      );
    }

    // Generate unique reference for manual funding
    const tx_ref = `W3WL_FUND_MANUAL_${userId.slice(0, 8)}_${Date.now()}`;

    // Create wallet transaction record (pending)
    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'deposit',
        status: 'pending',
        reference: tx_ref,
        description: `Manual Wallet Funding: ₦${amount.toLocaleString()}`
      })
      .select()
      .single();

    if (dbError) {
      console.error('Wallet Manual DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference: tx_ref
    });

  } catch (error) {
    console.error('Wallet manual funding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
