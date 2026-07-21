// src/app/api/squad/webhook/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-squad-encrypted-body') || request.headers.get('x-squad-signature');
    
    console.log('--- Squad Webhook Received ---');
    console.log('Signature Header:', signature);

    const squadKey = process.env.SQUAD_SECRET_KEY;
    if (!squadKey) {
      console.error('Squad Secret Key is not configured on the server.');
      return NextResponse.json({ error: 'Squad Secret Key not configured' }, { status: 500 });
    }

    // Verify signature
    if (!signature) {
      console.error('Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const calculatedHash = crypto
      .createHmac('sha512', squadKey)
      .update(rawBody)
      .digest('hex');

    if (calculatedHash.toLowerCase() !== signature.toLowerCase()) {
      console.error('Invalid signature. Calculated hash does not match signature header.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log('Payload Event:', payload?.Event || payload?.event);
    console.log('Payload TransactionRef:', payload?.TransactionRef || payload?.transactionRef);

    // We respond to successful charges
    const event = payload?.Event || payload?.event;
    const tx_ref = payload?.TransactionRef || payload?.transactionRef || payload?.data?.transaction_ref;
    
    if (event === 'charge_successful' && tx_ref) {
      const bodyData = payload?.Body || payload?.body || payload?.data || {};
      const status = bodyData?.transaction_status || bodyData?.status || 'Success';

      console.log('Processing Webhook Transaction:', tx_ref, 'Status:', status);

      // ✅ FLOW 1: Handle Wallet Funding Webhook (reference contains W3WL_FUND_)
      if (tx_ref && tx_ref.includes('W3WL_FUND_')) {
        console.log('Processing Wallet Deposit Webhook for ref:', tx_ref);

        // Find transaction record in wallet_transactions
        const { data: walletTx, error: walletFetchError } = await supabaseAdmin
          .from('wallet_transactions')
          .select('*')
          .eq('reference', tx_ref)
          .single();

        if (walletFetchError || !walletTx) {
          console.error('Wallet transaction lookup failed in webhook for ref:', tx_ref, walletFetchError);
        } else if (walletTx.status !== 'completed') {
          console.log('Updating wallet transaction status to completed via webhook...');

          // Update status to completed
          await supabaseAdmin
            .from('wallet_transactions')
            .update({ status: 'completed' })
            .eq('id', walletTx.id);

          // Update wallet balance
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
            console.log('Wallet balance updated successfully via webhook!');
          }
        } else {
          console.log('Wallet transaction already marked completed.');
        }

        // Best effort: Update general payment_transactions table if it exists
        try {
          await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              verified_at: new Date().toISOString(),
              verification_response: payload
            })
            .eq('paystack_reference', tx_ref);
        } catch (err) {
          // ignore
        }
      } else {
        // ✅ FLOW 2: Handle Blueprint Subscription / Project Unlock
        // 1. Find transaction in our database
        const { data: existingTx, error: fetchError } = await supabaseAdmin
          .from('payment_transactions')
          .select('*')
          .eq('paystack_reference', tx_ref)
          .single();

        if (fetchError) {
          console.error('Error fetching transaction in webhook:', fetchError);
        }

        if (existingTx && existingTx.status !== 'paid') {
          console.log('Updating transaction status to paid via webhook...');
          
          const { error: updateError } = await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              verified_at: new Date().toISOString(),
              verification_response: payload
            })
            .eq('id', existingTx.id);

          if (updateError) {
            console.error('Error updating transaction in webhook:', updateError);
          }

          // ✅ Handle Referral Commissions
          try {
            await supabaseAdmin.rpc('process_referral_purchase', {
              p_referred_id: existingTx.user_id,
              p_amount: existingTx.amount,
              p_transaction_id: existingTx.id
            });
          } catch (refError) {
            console.error('Referral processing error in webhook:', refError);
          }

          // ✅ Handle Project Unlock (if referencing standard checkouts)
          if (tx_ref && tx_ref.includes('W3WL_UNLOCK_')) {
            console.log('Handling Project Unlock in webhook for ref:', tx_ref);
            const parts = tx_ref.split('_');
            const projectId = parts.find((p, i) => parts[i-1] === 'UNLOCK');
            
            if (projectId) {
              console.log('Unlocking Project ID in webhook:', projectId);
              const { error: unlockError } = await supabaseAdmin
                .from('projects')
                .update({ 
                  is_unlocked: true,
                  tier: 'unlocked'
                })
                .eq('id', projectId);

              if (unlockError) {
                console.error('Error unlocking project in webhook:', unlockError);
              } else {
                console.log('Project successfully unlocked via webhook!');
                
                // Link transaction to project record
                await supabaseAdmin
                  .from('payment_transactions')
                  .update({ project_id: projectId })
                  .eq('id', existingTx.id);
              }
            }
          }

          // ✅ Handle Humanizer Refill in webhook (if reference contains W3WL_REFILL_)
          if (tx_ref && tx_ref.includes('W3WL_REFILL_')) {
            console.log('Handling Humanizer Refill in webhook for ref:', tx_ref);
            const parts = tx_ref.split('_');
            if (parts.length >= 5) {
              const refillProjectId = parts[2];
              const refillWords = Number(parts[3]);
              
              if (refillProjectId && !isNaN(refillWords)) {
                try {
                  const { data: currentProject } = await supabaseAdmin
                    .from('premium_projects')
                    .select('humanizer_words_used')
                    .eq('id', refillProjectId)
                    .single();

                  if (currentProject) {
                    const currentUsed = currentProject.humanizer_words_used || 0;
                    const newWordsUsed = Math.max(0, currentUsed - refillWords);

                    const { error: refillError } = await supabaseAdmin
                      .from('premium_projects')
                      .update({ humanizer_words_used: newWordsUsed })
                      .eq('id', refillProjectId);

                    if (refillError) {
                      console.error('Failed to deduct humanizer words in webhook:', refillError);
                    } else {
                      console.log(`Webhook refilled ${refillWords} words for project ${refillProjectId}. Old: ${currentUsed}, New: ${newWordsUsed}`);
                    }
                  }
                } catch (refillErr) {
                  console.error('Error executing humanizer refill in webhook:', refillErr);
                }
              }
            }
          }
        } else if (existingTx) {
          console.log('Transaction already marked as paid.');
        } else {
          console.error('No pending transaction found for reference in webhook:', tx_ref);
        }
      }
    }

    // Squad expects standard acknowledgment response format:
    return NextResponse.json({
      response_code: 200,
      transaction_reference: tx_ref || 'unknown',
      response_description: 'Success'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
