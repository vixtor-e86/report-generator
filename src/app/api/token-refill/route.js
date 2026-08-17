import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, email, projectId, tokensAmount, tier = 'standard' } = await request.json();

    if (!userId || !email || !projectId || !tokensAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tokens = Number(tokensAmount);
    // Price: 1,000 NGN per 10,000 tokens
    if (tokens < 10000 || tokens > 500000 || tokens % 10000 !== 0) {
      return NextResponse.json({ error: 'Invalid token amount. Choose in increments of 10,000 tokens.' }, { status: 400 });
    }

    const priceNaira = (tokens / 10000) * 1000;
    const amountInKobo = Math.round(priceNaira * 100);

    const squadKey = process.env.SQUAD_SECRET_KEY;
    if (!squadKey) {
      return NextResponse.json({ error: 'Squad Secret Key is not configured on the server.' }, { status: 500 });
    }

    const isSandbox = squadKey.startsWith('sandbox_sk_') || process.env.NEXT_PUBLIC_SQUAD_ENV === 'sandbox';
    const baseUrl = isSandbox ? 'https://sandbox-api-d.squadco.com' : 'https://api-d.squadco.com';

    // Unique transaction reference
    const transaction_ref = `W3WL_TOKEN_REFILL_${tier}_${projectId}_${tokens}_${Date.now()}`;

    const callback_url = tier === 'premium'
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/premium/workspace?id=${projectId}&verified_token_refill=${transaction_ref}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/standard/${projectId}?verified_token_refill=${transaction_ref}`;

    // Initiate Squad payment
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
          tier: `${tier}_token_refill`,
          projectId,
          tokensAmount: tokens,
          priceNaira
        }
      })
    });

    const squadData = await response.json();

    if (squadData.status !== 200 || !squadData.success) {
      console.error('Squad token refill initialization failed:', squadData);
      return NextResponse.json({ error: squadData.message || 'Payment initialization failed' }, { status: 400 });
    }

    const checkoutUrl = squadData.data.checkout_url;

    // Create payment transaction record (pending)
    const { error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        project_id: projectId,
        amount: priceNaira,
        currency: 'NGN',
        tier: 'unlock', // Use 'unlock' to satisfy DB check constraint
        status: 'pending',
        paystack_reference: transaction_ref,
        paystack_authorization_url: checkoutUrl,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '1.1.1.1',
        user_agent: request.headers.get('user-agent') || 'Squad Token Refill Agent'
      });

    if (dbError) {
      console.error('Failed to create pending token refill transaction in DB:', dbError);
      return NextResponse.json({ error: 'Database transaction creation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      authorization_url: checkoutUrl,
      reference: transaction_ref
    });

  } catch (error) {
    console.error('Token refill initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
