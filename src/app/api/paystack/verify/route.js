// src/app/api/paystack/verify/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // ✅ Changed

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        }
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return NextResponse.json(
        { error: 'Payment verification failed', verified: false },
        { status: 400 }
      );
    }

    const paymentData = paystackData.data;

    // Check if payment was successful
    if (paymentData.status !== 'success') {
      return NextResponse.json({
        verified: false,
        status: paymentData.status,
        message: 'Payment not successful'
      });
    }

    // Update transaction record in database
    const { data: transaction, error: updateError } = await supabaseAdmin // ✅ Changed
      .from('payment_transactions')
      .update({
        status: 'paid',
        verified_at: new Date().toISOString(),
        paid_at: paymentData.paid_at,
        verification_response: paymentData
      })
      .eq('paystack_reference', reference)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transaction', verified: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verified: true,
      transaction,
      amount: paymentData.amount / 100, // Convert from kobo to naira
      currency: paymentData.currency
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', verified: false },
      { status: 500 }
    );
  }
}