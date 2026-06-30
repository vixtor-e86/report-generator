import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { amount, description, metadata, userId } = await request.json();

    if (!userId || amount === undefined || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch current wallet balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('marketplace_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      console.error('Error fetching wallet balance:', walletError);
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }

    const newBalance = wallet.balance - amount;

    // 2. Update balance
    const { error: updateError } = await supabaseAdmin
      .from('marketplace_wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // 3. Record transaction
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'purchase',
        status: 'completed',
        description,
        metadata
      });

    if (txError) {
      console.error('Failed to log transaction:', txError);
    }

    return NextResponse.json({ success: true, newBalance });

  } catch (error) {
    console.error('Deduct wallet funds error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
