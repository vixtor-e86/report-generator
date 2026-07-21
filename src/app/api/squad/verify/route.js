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

    // Squad returns amount in Kobo, convert to Naira
    const paidAmountNaira = transaction_amount / 100;

    // ✅ FLOW 1: Handle Wallet Funding (reference contains W3WL_FUND_)
    if (transaction_ref && transaction_ref.includes('W3WL_FUND_')) {
      console.log('Processing Wallet Deposit Verification for ref:', transaction_ref);

      // Find transaction record in wallet_transactions
      const { data: walletTx, error: walletFetchError } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('reference', transaction_ref)
        .single();

      if (walletFetchError || !walletTx) {
        console.error('Wallet transaction lookup failed for ref:', transaction_ref, walletFetchError);
        return NextResponse.json({ error: 'Wallet transaction record not found.' }, { status: 404 });
      }

      // If already completed, avoid double-processing
      if (walletTx.status === 'completed') {
        return NextResponse.json({
          verified: true,
          transaction: {
            id: walletTx.id,
            user_id: walletTx.user_id,
            amount: walletTx.amount,
            tier: 'wallet_funding',
            status: 'paid',
            paystack_reference: transaction_ref
          },
          message: 'Wallet deposit already processed'
        });
      }

      // Verify amount matches
      if (paidAmountNaira < walletTx.amount) {
        console.error(`Amount mismatch: Paid ${paidAmountNaira}, Expected ${walletTx.amount}`);
        return NextResponse.json({ verified: false, message: 'Payment amount mismatch' });
      }

      // Update wallet transaction status to completed
      const { data: updatedWalletTx, error: walletUpdateError } = await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'completed' })
        .eq('id', walletTx.id)
        .select()
        .single();

      if (walletUpdateError) {
        console.error('Error updating wallet tx status:', walletUpdateError);
        return NextResponse.json({ error: 'Failed to update wallet transaction' }, { status: 500 });
      }

      // Update user wallet balance
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

      // Best effort: Update general payment_transactions table if it exists
      try {
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            verified_at: new Date().toISOString(),
            verification_response: squadData.data
          })
          .eq('paystack_reference', transaction_ref);
      } catch (err) {
        console.warn('Best-effort payment_transactions update skipped/failed:', err);
      }

      return NextResponse.json({
        verified: true,
        transaction: {
          id: walletTx.id,
          user_id: walletTx.user_id,
          amount: walletTx.amount,
          tier: 'wallet_funding',
          status: 'paid',
          paystack_reference: transaction_ref
        }
      });
    }

    // ✅ FLOW 2: Handle Blueprint Subscription / Project Unlock
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

    // Process Referral Logic
    try {
      await supabaseAdmin.rpc('process_referral_purchase', {
        p_referred_id: updatedTx.user_id,
        p_amount: updatedTx.amount,
        p_transaction_id: updatedTx.id
      });
    } catch (refError) {
      console.error('Referral processing error:', refError);
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

    // ✅ Process Humanizer Refill if reference starts with W3WL_REFILL_
    if (transaction_ref && transaction_ref.startsWith('W3WL_REFILL_')) {
      const parts = transaction_ref.split('_');
      // Format: W3WL_REFILL_PROJECTID_WORDSAMOUNT_TIMESTAMP
      if (parts.length >= 5) {
        const refillProjectId = parts[2];
        const refillWords = Number(parts[3]);
        
        if (refillProjectId && !isNaN(refillWords)) {
          try {
            // 1. Fetch current words used
            const { data: currentProject } = await supabaseAdmin
              .from('premium_projects')
              .select('humanizer_words_used')
              .eq('id', refillProjectId)
              .single();

            if (currentProject) {
              const currentUsed = currentProject.humanizer_words_used || 0;
              // Deduct paid words (ensure it doesn't go below 0)
              const newWordsUsed = Math.max(0, currentUsed - refillWords);

              // 2. Update premium_projects
              const { error: refillError } = await supabaseAdmin
                .from('premium_projects')
                .update({ humanizer_words_used: newWordsUsed })
                .eq('id', refillProjectId);

              if (refillError) {
                console.error('Failed to deduct humanizer words used:', refillError);
              } else {
                console.log(`Refilled ${refillWords} words for project ${refillProjectId}. Old usage: ${currentUsed}, New: ${newWordsUsed}`);
              }
            }
          } catch (refillErr) {
            console.error('Error executing humanizer refill:', refillErr);
          }
        }
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
