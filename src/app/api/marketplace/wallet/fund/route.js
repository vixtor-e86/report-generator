// src/app/api/marketplace/wallet/fund/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  return NextResponse.json(
    { error: 'The payment server is currently under maintenance. Please try again later.' },
    { status: 503 }
  );
}

/*
export async function POST_DISABLED(request) {
  try {
    const { userId, email, amount } = await request.json();

    // Validate inputs
    if (!userId || !email || !amount) {
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

    // Generate unique reference
    const tx_ref = `W3WL_FUND_${userId.slice(0, 8)}_${Date.now()}`;

    // Initialize Flutterwave payment
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/dashboard?tab=wallet`,
        customer: {
          email: email,
          name: email.split('@')[0],
        },
        meta: {
          userId,
          type: 'wallet_funding'
        },
        customizations: {
          title: "W3 Marketplace Wallet",
          description: `Fund wallet with ₦${amount.toLocaleString()}`,
          logo: `${process.env.NEXT_PUBLIC_BASE_URL}/favicon.ico`,
        },
      })
    });

    const flwData = await response.json();

    if (flwData.status !== 'success') {
      return NextResponse.json(
        { error: flwData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    // Create wallet transaction record (pending)
    const { error: dbError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'deposit',
        status: 'pending',
        reference: tx_ref,
        description: `Wallet funding: ₦${amount.toLocaleString()}`
      });

    if (dbError) {
      console.error('Wallet DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      authorization_url: flwData.data.link,
      reference: tx_ref
    });

  } catch (error) {
    console.error('Wallet funding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
