// src/app/api/marketplace/seller/request-payout/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, amount } = await request.json();

    if (!userId || !amount || amount < 5000) {
      return NextResponse.json({ error: 'Minimum payout amount is ₦5,000' }, { status: 400 });
    }

    // 1. Fetch current bank details and seller wallet
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from('marketplace_sellers')
      .select('id, bank_name, account_number, account_name')
      .eq('user_id', userId)
      .single();

    if (sellerError || !seller.bank_name) {
      return NextResponse.json({ error: 'Please set up your payment account details first.' }, { status: 400 });
    }

    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('marketplace_seller_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 2. Create payout request with SNAPSHOT of bank details
    const { error: payoutError } = await supabaseAdmin
      .from('marketplace_payouts')
      .insert({
        user_id: userId,
        seller_id: seller.id,
        amount,
        bank_name: seller.bank_name,
        account_number: seller.account_number,
        account_name: seller.account_name,
        status: 'pending'
      });

    if (payoutError) throw payoutError;

    // 3. Deduct from wallet
    const { error: deductError } = await supabaseAdmin
      .from('marketplace_seller_wallets')
      .update({ balance: wallet.balance - amount })
      .eq('user_id', userId);

    if (deductError) throw deductError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Payout Request Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
