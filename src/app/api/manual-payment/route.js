import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { userId, tier, amount, projectId } = await request.json();

    if (!userId || !tier || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique reference for manual payments
    const timestamp = Date.now();
    let reference;
    if (projectId) {
      reference = `W3WL_MANUAL_UNLOCK_${projectId}_${timestamp}`;
    } else {
      reference = `W3WL_MANUAL_${tier.toUpperCase()}_${userId.slice(0, 8)}_${timestamp}`;
    }

    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        project_id: null, // We keep this null as per existing project patterns to avoid FK constraints
        amount,
        currency: 'NGN',
        tier: projectId ? 'unlock' : tier,
        status: 'pending',
        paystack_reference: reference, // We use this column as the general reference
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .select()
      .single();

    if (dbError) {
      console.error('Manual Transaction DB Error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference
    });

  } catch (error) {
    console.error('Manual payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
