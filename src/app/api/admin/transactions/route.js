// src/app/api/admin/transactions/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Helper: fetch transactions and enrich with user profile data
async function fetchAndEnrich(query) {
  const { data: transactions, error: txError } = await query;
  if (txError) throw txError;
  if (!transactions || transactions.length === 0) return [];

  const userIds = [...new Set(transactions.map(tx => tx.user_id))];
  const { data: users, error: usersError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, username, email')
    .in('id', userIds);

  if (usersError) {
    console.error('Error fetching users for transactions:', usersError);
    return transactions.map(tx => ({ ...tx, user_profiles: { username: 'Unknown', email: 'Unknown' } }));
  }

  return transactions.map(tx => ({
    ...tx,
    user_profiles: users.find(u => u.id === tx.user_id) || { username: 'Unknown', email: 'Unknown' }
  }));
}

// GET — all transactions (paid + pending), newest first
// Optional query param: ?email=user@example.com to filter by exact user email
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let baseQuery = supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (email) {
      // Look up user_id for this exact email first
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        // No user found — return empty array (not an error)
        return NextResponse.json([]);
      }

      baseQuery = baseQuery.eq('user_id', profile.id);
    }

    const enriched = await fetchAndEnrich(baseQuery);
    return NextResponse.json(enriched);

  } catch (error) {
    console.error('Admin transactions GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch transactions' }, { status: 500 });
  }
}

// PATCH — mark a pending transaction as paid
// Body: { transactionId: string }
export async function PATCH(request) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }

    // Verify the transaction exists and is pending
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('payment_transactions')
      .select('id, status, user_id, amount, tier')
      .eq('id', transactionId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (existing.status === 'paid') {
      return NextResponse.json({ error: 'Transaction is already marked as paid' }, { status: 409 });
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'paid',
        paid_at: now,
        updated_at: now
      })
      .eq('id', transactionId)
      .select('id, status, paid_at, updated_at')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, transaction: updated });

  } catch (error) {
    console.error('Admin transactions PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update transaction' }, { status: 500 });
  }
}
