// src/app/api/squad/verify/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionRef = searchParams.get('transaction_ref') || searchParams.get('tx_ref');

  if (!transactionRef) {
    return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 });
  }

  try {
    const squadKey = process.env.SQUAD_SECRET_KEY;
    if (!squadKey) {
      return NextResponse.json({ error: 'Squad Secret Key is not configured' }, { status: 500 });
    }

    // Determine base URL
    const isSandbox = squadKey.startsWith('sandbox_sk_') || process.env.NEXT_PUBLIC_SQUAD_ENV === 'sandbox';
    const baseUrl = isSandbox ? 'https://sandbox-api-d.squadco.com' : 'https://api-d.squadco.com';

    // Verify transaction with Squad
    const response = await fetch(`${baseUrl}/transaction/verify/${transactionRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${squadKey}`,
        'Content-Type': 'application/json',
      },
    });

    const squadData = await response.json();

    if (squadData.status !== 200 || !squadData.success || !squadData.data) {
      return NextResponse.json({ verified: false, message: squadData.message || 'Payment verification failed' });
    }

    const { transaction_status, transaction_amount, transaction_ref } = squadData.data;

    // Check transaction status
    if (transaction_status.toLowerCase() !== 'success') {
      return NextResponse.json({ verified: false, message: `Transaction status is ${transaction_status}` });
    }

    // Find transaction record in our DB
    const { data: existingTx, error: fetchError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('paystack_reference', transaction_ref)
      .single();

    if (fetchError || !existingTx) {
      console.error('Transaction lookup failed for ref:', transaction_ref, fetchError);
      return NextResponse.json({ error: 'Transaction record not found in system.' }, { status: 404 });
    }

    // If transaction is already marked paid, avoid double-processing
    if (existingTx.status === 'paid') {
      return NextResponse.json({
        verified: true,
        transaction: existingTx,
        message: 'Transaction already processed'
      });
    }

    // Squad returns amount in Kobo, convert to Naira
    const paidAmountNaira = transaction_amount / 100;

    // Verify amount matches (with small buffer if any conversion rounding occurs)
    if (paidAmountNaira < existingTx.amount) {
      console.error(`Amount mismatch: Paid ${paidAmountNaira}, Expected ${existingTx.amount}`);
      return NextResponse.json({ verified: false, message: 'Payment amount mismatch' });
    }

    // Update transaction status in DB
    const { data: updatedTx, error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        verification_response: squadData.data
      })
      .eq('id', existingTx.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // ✅ Process Referral Logic
    try {
      await supabaseAdmin.rpc('process_referral_purchase', {
        p_referred_id: updatedTx.user_id,
        p_amount: updatedTx.amount,
        p_transaction_id: updatedTx.id
      });
    } catch (refError) {
      console.error('Referral processing error:', refError);
    }

    // ✅ Process Wallet Funding if reference contains W3WL_FUND_
    if (transaction_ref && transaction_ref.includes('W3WL_FUND_')) {
      console.log('Processing Wallet Deposit in Verify Route for ref:', transaction_ref);
      
      const { data: walletTx, error: wTxError } = await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'completed' })
        .eq('reference', transaction_ref)
        .select()
        .single();

      if (wTxError) {
        console.error('Error updating wallet tx:', wTxError);
      }

      if (walletTx) {
        const { data: wallet } = await supabaseAdmin
          .from('marketplace_wallets')
          .select('balance')
          .eq('user_id', walletTx.user_id)
          .single();

        if (wallet) {
          const newBalance = wallet.balance + walletTx.amount;
          await supabaseAdmin
            .from('marketplace_wallets')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', walletTx.user_id);
          console.log('Wallet balance updated successfully in Verify Route!');
        }
      }
    }

    // ✅ Process Project Unlock if reference starts with W3WL_UNLOCK_
    let projectIdToUnlock = null;
    if (transaction_ref && transaction_ref.startsWith('W3WL_UNLOCK_')) {
      const parts = transaction_ref.split('_');
      // Format: W3WL_UNLOCK_<UUID>_<TIMESTAMP>
      if (parts.length >= 3) {
        projectIdToUnlock = parts[2];
      }
    }

    if (projectIdToUnlock) {
      const { error: unlockError } = await supabaseAdmin
        .from('projects')
        .update({ 
          is_unlocked: true,
          tier: 'unlocked' 
        })
        .eq('id', projectIdToUnlock);

      if (unlockError) {
        console.error('Failed to unlock project:', unlockError);
      } else {
        console.log(`Project ${projectIdToUnlock} unlocked successfully in Verify Route.`);
        
        // Link transaction to this project ID
        await supabaseAdmin
          .from('payment_transactions')
          .update({ project_id: projectIdToUnlock })
          .eq('id', updatedTx.id);
      }
    }

    return NextResponse.json({
      verified: true,
      transaction: updatedTx
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
  }
}
