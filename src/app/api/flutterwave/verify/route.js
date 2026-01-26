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
      console.error('Transaction lookup failed for ref:', tx_ref, fetchError);
      return NextResponse.json({ error: 'Transaction record not found. Please contact support.' }, { status: 404 });
    }

    // Verify amount
    if (amount < existingTx.amount) {
      console.error(`Amount mismatch: Paid ${amount}, Expected ${existingTx.amount}`);
      return NextResponse.json({ verified: false, message: 'Payment amount mismatch' });
    }

    // Update transaction status
    const { data: updatedTx, error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        verified_at: new Date().toISOString(), // Match Paystack schema
        verification_response: flwData.data // Store full response like Paystack
      })
      .eq('id', existingTx.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // ✅ NEW: Unlock project if applicable
    if (updatedTx.project_id) {
      const { error: unlockError } = await supabaseAdmin
        .from('projects')
        .update({ is_unlocked: true })
        .eq('id', updatedTx.project_id);

      if (unlockError) {
        console.error('Failed to unlock project:', unlockError);
        // We don't fail the request here because payment was successful, 
        // but we should probably alert/log it. 
        // The user might need to contact support if not unlocked.
      } else {
        console.log(`Project ${updatedTx.project_id} unlocked successfully.`);
      }
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
