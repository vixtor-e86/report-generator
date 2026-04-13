// src/app/api/flutterwave/webhook/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const signature = request.headers.get('verif-hash');
    
    console.log('--- Flutterwave Webhook Received ---');
    console.log('Signature:', signature);

    // Verify signature (FLW_SECRET_HASH should be Adewale2005@)
    if (process.env.FLW_SECRET_HASH && signature !== process.env.FLW_SECRET_HASH) {
      console.error('Invalid signature. Expected:', process.env.FLW_SECRET_HASH, 'Got:', signature);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = await request.json();
    console.log('Payload Event:', payload?.event || payload?.["event.type"]);
    console.log('Payload Status:', payload?.status || payload?.data?.status);

    // Flutterwave V3 uses event: "charge.completed"
    if (payload.event === 'charge.completed' || payload.status === 'successful') {
      const data = payload.data || payload;
      const { tx_ref, amount, status: paymentStatus } = data;

      console.log('Processing Transaction:', tx_ref, 'Amount:', amount, 'Status:', paymentStatus);

      if (paymentStatus === 'successful' || payload.status === 'successful') {
        // Find transaction using tx_ref (stored in paystack_reference column)
        const { data: existingTx, error: fetchError } = await supabaseAdmin
          .from('payment_transactions')
          .select('*')
          .eq('paystack_reference', tx_ref)
          .single();

        if (fetchError) {
          console.error('Error fetching transaction:', fetchError);
        }

        if (existingTx && existingTx.status !== 'paid') {
          console.log('Updating transaction status to paid...');
          
          const { error: updateError } = await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              verified_at: new Date().toISOString(),
              verification_response: data
            })
            .eq('id', existingTx.id);

          if (updateError) {
            console.error('Error updating transaction:', updateError);
          }

          // ✅ Handle Project Unlock
          if (tx_ref && tx_ref.includes('W3WL_UNLOCK_')) {
            console.log('Handling Project Unlock for ref:', tx_ref);
            // Extract Project ID safely
            // Format is W3WL_UNLOCK_ID_TIMESTAMP
            const parts = tx_ref.split('_');
            const projectId = parts.find((p, i) => parts[i-1] === 'UNLOCK');
            
            if (projectId) {
              console.log('Unlocking Standard Project ID:', projectId);
              // Use standard_projects table as seen in codebase
              const { error: unlockError } = await supabaseAdmin
                .from('standard_projects')
                .update({ 
                  is_unlocked: true,
                  tier: 'standard'
                })
                .eq('id', projectId);

              if (unlockError) {
                console.error('Error unlocking project:', unlockError);
              } else {
                console.log('Project successfully unlocked!');
              }
            } else {
              console.error('Could not extract Project ID from reference');
            }
          }
        } else if (existingTx) {
          console.log('Transaction already marked as paid.');
        } else {
          console.error('No pending transaction found for reference:', tx_ref);
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
