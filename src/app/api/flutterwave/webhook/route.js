// src/app/api/flutterwave/webhook/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const signature = request.headers.get('verif-hash');
    
    // Verify signature (if FLW_SECRET_HASH is set)
    if (process.env.FLW_SECRET_HASH && signature !== process.env.FLW_SECRET_HASH) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = await request.json();

    if (payload.status === 'successful' && payload.event === 'charge.completed') {
      const { tx_ref, amount } = payload.data;

      // Find transaction
      const { data: existingTx } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('paystack_reference', tx_ref)
        .single();

      if (existingTx && existingTx.status !== 'paid') {
        // Verify amount matches
        if (amount >= existingTx.amount) {
          const { data: updatedTx } = await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              verified_at: new Date().toISOString(),
              verification_response: payload.data
            })
            .eq('id', existingTx.id)
            .select()
            .single();

          // ✅ NEW: Unlock project if applicable
          if (tx_ref && tx_ref.startsWith('W3WL_UNLOCK_')) {
            const parts = tx_ref.split('_');
            const projectIdToUnlock = parts[2];
            
            if (projectIdToUnlock) {
              await supabaseAdmin
                .from('projects')
                .update({ 
                  is_unlocked: true,
                  tier: 'standard' // Change tier to standard upon payment
                })
                .eq('id', projectIdToUnlock);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
