// src/app/api/squad/initialize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, email, tier, amount, projectId, currency = 'NGN', customDetails } = await request.json();
    const selectedCurrency = currency === 'USD' ? 'USD' : 'NGN';

    // Validate inputs
    if (!userId || !email || !tier || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const squadKey = process.env.SQUAD_SECRET_KEY;
    if (!squadKey) {
      return NextResponse.json(
        { error: 'Squad Secret Key is not configured on the server. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Determine Squad environment URL
    const isSandbox = squadKey.startsWith('sandbox_sk_') || process.env.NEXT_PUBLIC_SQUAD_ENV === 'sandbox';
    const baseUrl = isSandbox ? 'https://sandbox-api-d.squadco.com' : 'https://api-d.squadco.com';

    // Generate unique reference (transaction_ref)
    let transaction_ref;
    let finalTier = tier;
    if (projectId) {
      transaction_ref = `W3WL_UNLOCK_${projectId}_${Date.now()}`;
      finalTier = 'unlock'; // Special tier for project unlocks
    } else if (tier === 'custom' && customDetails) {
      const wsCode = customDetails.workspaceType === 'premium' ? 'PREMIUM' : 'STANDARD';
      const chCode = (customDetails.selectedChapters || [4, 5]).join('-');
      transaction_ref = `W3WL_CUSTOM_${wsCode}_${chCode}_${Date.now()}_${userId.slice(0, 8)}`;
      finalTier = 'custom';
    } else {
      transaction_ref = `W3WL_${tier.toUpperCase()}_${Date.now()}_${userId.slice(0, 8)}`;
    }

    // Squad expects amount in the lowest subunit (Kobo for NGN * 100, Cents for USD * 100)
    const amountInSubunits = Math.round(Number(amount) * 100);

    // Set callback URL to the template-select page where verification is handled
    const callback_url = projectId 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/template-select?return_to=${projectId}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/template-select`;

    // Initialize Squad payment
    const response = await fetch(`${baseUrl}/transaction/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squadKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        email: email,
        currency: selectedCurrency,
        initiate_type: 'inline',
        transaction_ref,
        callback_url,
        customer_name: email.split('@')[0], // Fallback name
        metadata: {
          userId,
          tier: finalTier,
          projectId: projectId || null,
          currency: selectedCurrency,
          customDetails: customDetails || null
        }
      })
    });

    const squadData = await response.json();

    if (squadData.status !== 200 || !squadData.success) {
      console.error('Squad initialization failed:', squadData);
      return NextResponse.json(
        { error: squadData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    const checkoutUrl = squadData.data.checkout_url;

    // Create payment transaction record (initially pending)
    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        project_id: null,
        amount,
        currency: selectedCurrency,
        tier: finalTier,
        status: 'pending',
        paystack_reference: transaction_ref,
        paystack_authorization_url: checkoutUrl,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '1.1.1.1',
        user_agent: request.headers.get('user-agent') || 'Squad Integration Agent'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Detailed Database Error:', dbError);
      return NextResponse.json(
        { error: `Failed to create transaction record: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authorization_url: checkoutUrl,
      reference: transaction_ref
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
