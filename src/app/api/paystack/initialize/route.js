// src/app/api/paystack/initialize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // ✅ Changed from supabase

export async function POST(request) {
  try {
    const { userId, email, tier, amount } = await request.json();

    // Validate inputs
    if (!userId || !email || !tier || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `W3WL_${tier.toUpperCase()}_${Date.now()}_${userId.slice(0, 8)}`;

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects amount in kobo (₦1 = 100 kobo)
        currency: 'NGN',
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/template-select?payment_ref=${reference}`,
        metadata: {
          userId,
          tier,
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: userId
            },
            {
              display_name: 'Tier',
              variable_name: 'tier',
              value: tier
            }
          ]
        }
      })
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return NextResponse.json(
        { error: paystackData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    // Create payment transaction record (initially unverified)
    const { data: transaction, error: dbError } = await supabaseAdmin // ✅ Changed
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount,
        currency: 'NGN',
        tier,
        status: 'pending',
        paystack_reference: reference,
        paystack_access_code: paystackData.data.access_code,
        paystack_authorization_url: paystackData.data.authorization_url,
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
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: reference
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}