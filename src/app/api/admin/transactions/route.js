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

    let filterUserId = null;

    if (email) {
      // 1. Search in Auth users (Most reliable)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      const user = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (user) {
        filterUserId = user.id;
      } else {
        // 2. Fallback to user_profiles if email is stored there
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', email)
          .single();
        
        if (profile) filterUserId = profile.id;
      }

      if (!filterUserId) return NextResponse.json([]); // Not found
      baseQuery = baseQuery.eq('user_id', filterUserId);
    }

    const { data: transactions, error: txError } = await baseQuery;
    if (txError) throw txError;
    if (!transactions || transactions.length === 0) return NextResponse.json([]);

    // Enrich with both Profile (username) and Auth (email)
    const userIds = [...new Set(transactions.map(tx => tx.user_id))];
    
    // Fetch Profiles
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, email')
      .in('id', userIds);

    // Fetch Auth Users for Emails (Service Role required)
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

    const enriched = transactions.map(tx => {
      const profile = profiles?.find(p => p.id === tx.user_id);
      const authUser = authUsers?.users.find(u => u.id === tx.user_id);
      
      return {
        ...tx,
        user_profiles: {
          username: profile?.username || 'Student',
          email: authUser?.email || profile?.email || 'Unknown'
        }
      };
    });

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
