// src/app/api/marketplace/wallet/fund/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, email, amount } = await request.json();

    // Validate inputs
    if (!userId || !email || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fixed amount validation (2k, 5k, 10k, 20k, 50k)
    const allowedAmounts = [2000, 5000, 10000, 20000, 50000];
    if (!allowedAmounts.includes(Number(amount))) {
      return NextResponse.json(
        { error: 'Invalid funding amount' },
        { status: 400 }
      );
    }

    const squadKey = process.env.SQUAD_SECRET_KEY;
    if (!squadKey) {
      return NextResponse.json(
        { error: 'Squad Secret Key is not configured' },
        { status: 500 }
      );
    }

    // Determine Squad environment URL
    const isSandbox = squadKey.startsWith('sandbox_sk_') || process.env.NEXT_PUBLIC_SQUAD_ENV === 'sandbox';
    const baseUrl = isSandbox ? 'https://sandbox-api-d.squadco.com' : 'https://api-d.squadco.com';

    // Generate unique reference (transaction_ref)
    const transaction_ref = `W3WL_FUND_${userId.slice(0, 8)}_${Date.now()}`;

    // Squad expects amount in Kobo (Naira * 100)
    const amountInKobo = Math.round(Number(amount) * 100);

    // Set callback URL to return to the main dashboard
    const callback_url = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?transaction_ref=${transaction_ref}`;

    // Initialize Squad payment
    const response = await fetch(`${baseUrl}/transaction/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squadKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInKobo,
        email: email,
        currency: 'NGN',
        initiate_type: 'inline',
        transaction_ref,
        callback_url,
        customer_name: email.split('@')[0],
        metadata: {
          userId,
          type: 'wallet_funding'
        }
      })
    });

    const squadData = await response.json();

    if (squadData.status !== 200 || !squadData.success) {
      console.error('Squad Wallet funding initialization failed:', squadData);
      return NextResponse.json(
        { error: squadData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    const checkoutUrl = squadData.data.checkout_url;

    // 1. Create wallet transaction record (pending)
    const { error: walletDbError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'deposit',
        status: 'pending',
        reference: transaction_ref,
        description: `Wallet funding: ₦${amount.toLocaleString()}`
      });

    if (walletDbError) {
      console.error('Wallet DB Error:', walletDbError);
      return NextResponse.json({ error: 'Failed to create wallet transaction record' }, { status: 500 });
    }

    // 2. Create payment transaction record (pending) for general transaction records/webhooks
    const { error: paymentDbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        project_id: null,
        amount,
        currency: 'NGN',
        tier: 'wallet_funding',
        status: 'pending',
        paystack_reference: transaction_ref,
        paystack_authorization_url: checkoutUrl,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '1.1.1.1',
        user_agent: request.headers.get('user-agent') || 'Squad Integration Agent'
      });

    if (paymentDbError) {
      console.error('Payment DB Error for wallet funding:', paymentDbError);
      // We don't fail the request since wallet_transaction record is successfully created
    }

    return NextResponse.json({
      success: true,
      authorization_url: checkoutUrl,
      reference: transaction_ref
    });

  } catch (error) {
    console.error('Wallet funding error:', error);
    return NextResponse.json({ error: 'Internal server error during wallet funding' }, { status: 500 });
  }
}
