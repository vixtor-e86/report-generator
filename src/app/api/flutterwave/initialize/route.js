// src/app/api/flutterwave/initialize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, email, tier, amount, projectId } = await request.json();

    // Validate inputs
    if (!userId || !email || !tier || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique reference (tx_ref)
    // If unlocking a project, embed the projectId in the reference
    let tx_ref;
    if (projectId) {
      tx_ref = `W3WL_UNLOCK_${projectId}_${Date.now()}`;
    } else {
      tx_ref = `W3WL_${tier.toUpperCase()}_${Date.now()}_${userId.slice(0, 8)}`;
    }

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
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/template-select`, // Note: For project unlock, we might want to redirect back to the project page?
        customer: {
          email: email,
          name: email.split('@')[0], // Fallback name
        },
        meta: {
          userId,
          tier,
          projectId // Add projectId to meta
        },
        customizations: {
          title: "W3 WriteLab Payment",
          description: `Payment for ${tier} tier`,
          logo: `${process.env.NEXT_PUBLIC_BASE_URL}/favicon.ico`,
        },
      })
    });

    const flwData = await response.json();

    if (flwData.status !== 'success') {
      console.error('Flutterwave initialization failed:', flwData);
      return NextResponse.json(
        { error: flwData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    // Create payment transaction record (initially unverified)
    // We map Flutterwave fields to existing Paystack columns to avoid DB schema changes
    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        project_id: null, // Avoid FK constraint (standard_projects), we store projectId in tx_ref
        amount,
        currency: 'NGN',
        tier,
        status: 'pending',
        paystack_reference: tx_ref, // Storing tx_ref here
        paystack_authorization_url: flwData.data.link, // Storing payment link here
        // paystack_access_code: null, // Flutterwave doesn't use access code in this flow
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authorization_url: flwData.data.link,
      reference: tx_ref
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
