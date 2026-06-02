import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { transactionId, projectId, userId } = await request.json();

    if (!transactionId || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use supabaseAdmin to bypass RLS and link the project
    // We also verify the user_id to ensure a user can only consume their own payments
    const { data: updated, error } = await supabaseAdmin
      .from('payment_transactions')
      .update({ 
        project_id: projectId,
        updated_at: new Date().toISOString() 
      })
      .eq('id', transactionId)
      .eq('user_id', userId) // Security: ensure user owns the transaction
      .is('project_id', null) // Security: ensure it hasn't been used yet
      .eq('status', 'paid')   // Security: only paid transactions can be consumed
      .select()
      .single();

    if (error) {
      console.error('Consume Transaction Error:', error);
      return NextResponse.json(
        { error: 'Failed to consume transaction or already used' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: updated
    });

  } catch (error) {
    console.error('Consume transaction exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
