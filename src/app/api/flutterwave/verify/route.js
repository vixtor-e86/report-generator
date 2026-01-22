// src/app/api/flutterwave/verify/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transaction_id');
  const txRef = searchParams.get('tx_ref');

  if (!transactionId && !txRef) {
    return NextResponse.json({ error: 'Missing transaction ID or reference' }, { status: 400 });
  }

  try {
    let flwData;
    
    // Verify using transaction ID (preferred)
    if (transactionId) {
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      flwData = await response.json();
    } else {
      // Fallback: Verify by tx_ref (requires different endpoint or query, but typically ID is safer)
      // For now, we'll error if no ID, because standard redirect provides it.
      // If we really need tx_ref verification, we'd search transactions first.
      return NextResponse.json({ error: 'Transaction ID required for verification' }, { status: 400 });
    }

    if (flwData.status !== 'success' || flwData.data.status !== 'successful') {
      return NextResponse.json({ verified: false, message: 'Payment verification failed' });
    }

    const { amount, tx_ref } = flwData.data;

    // Check if transaction exists in our DB
    const { data: existingTx, error: fetchError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('paystack_reference', tx_ref)
      .single();

    if (fetchError || !existingTx) {
      return NextResponse.json({ error: 'Transaction not found in system' }, { status: 404 });
    }

    // Verify amount
    if (amount < existingTx.amount) {
      return NextResponse.json({ verified: false, message: 'Amount mismatch' });
    }

    // Update transaction status
    const { data: updatedTx, error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        // Store the actual transaction ID in metadata or reused column if needed
        // For now, we just mark it paid.
        metadata: { ...existingTx.metadata, flutterwave_id: transactionId }
      })
      .eq('id', existingTx.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    return NextResponse.json({
      verified: true,
      transaction: updatedTx
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
