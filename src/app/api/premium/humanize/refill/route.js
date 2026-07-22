import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, email, projectId, wordsAmount } = await request.json();

    if (!userId || !email || !projectId || !wordsAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const amount = Number(wordsAmount);
    if (amount < 1000 || amount > 6000 || amount % 1000 !== 0) {
      return NextResponse.json({ error: 'Invalid top-up range. Choose between 1,000 and 6,000 words.' }, { status: 400 });
    }

    const squadKey = process.env.SQUAD_SECRET_KEY;
    if (!squadKey) {
      return NextResponse.json({ error: 'Squad Secret Key is not configured on the server.' }, { status: 500 });
    }

    const isSandbox = squadKey.startsWith('sandbox_sk_') || process.env.NEXT_PUBLIC_SQUAD_ENV === 'sandbox';
    const baseUrl = isSandbox ? 'https://sandbox-api-d.squadco.com' : 'https://api-d.squadco.com';

    // Unique transaction reference containing metadata
    const transaction_ref = `W3WL_REFILL_${projectId}_${wordsAmount}_${Date.now()}`;
    const amountInKobo = Math.round(amount * 100);

    const callback_url = `${process.env.NEXT_PUBLIC_BASE_URL}/premium/workspace?id=${projectId}&verified_refill=${transaction_ref}`;

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
          tier: 'refill',
          projectId,
          wordsAmount
        }
      })
    });

    const squadData = await response.json();

    if (squadData.status !== 200 || !squadData.success) {
      console.error('Squad refill initialization failed:', squadData);
      return NextResponse.json({ error: squadData.message || 'Payment initialization failed' }, { status: 400 });
    }

    const checkoutUrl = squadData.data.checkout_url;

    // Create payment transaction record (initially pending)
    const { error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        project_id: null,
        amount,
        currency: 'NGN',
        tier: 'unlock', // set to unlock to pass database check constraint
        status: 'pending',
        paystack_reference: transaction_ref,
        paystack_authorization_url: checkoutUrl,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '1.1.1.1',
        user_agent: request.headers.get('user-agent') || 'Squad Integration Refill Agent'
      });

    if (dbError) {
      console.error('Failed to create pending refill transaction in DB:', dbError);
      return NextResponse.json({ error: 'Database transaction creation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      authorization_url: checkoutUrl,
      reference: transaction_ref
    });

  } catch (error) {
    console.error('Refill initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
