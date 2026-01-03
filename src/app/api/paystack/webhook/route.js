// src/app/api/paystack/webhook/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // ✅ Changed
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle successful charge
    if (event.event === 'charge.success') {
      const { reference, status, amount, paid_at, customer, metadata } = event.data;

      // Update transaction in database
      const { data: transaction, error: updateError } = await supabaseAdmin // ✅ Changed
        .from('payment_transactions')
        .update({
          status: 'paid',
          verified_at: new Date().toISOString(),
          paid_at: paid_at,
          verification_response: event.data
        })
        .eq('paystack_reference', reference)
        .select()
        .single();

      if (updateError) {
        console.error('Webhook database update error:', updateError);
        // Still return 200 to Paystack so they don't retry
        return NextResponse.json({ received: true });
      }

      console.log('Payment verified via webhook:', reference);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}