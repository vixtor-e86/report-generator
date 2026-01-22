// src/app/api/admin/transactions/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  // Add authentication/authorization checks here if needed, similar to stats route

  try {
    // 1. Fetch Transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    // 2. Fetch User Profiles manually
    let enrichedTransactions = [];
    if (transactions && transactions.length > 0) {
      const userIds = [...new Set(transactions.map(tx => tx.user_id))];
      
      const { data: users, error: usersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, username, email')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users for transactions:', usersError);
        // Continue without user details rather than crashing
        enrichedTransactions = transactions.map(tx => ({
          ...tx,
          user_profiles: { username: 'Unknown', email: 'Unknown' }
        }));
      } else {
        enrichedTransactions = transactions.map(tx => ({
          ...tx,
          user_profiles: users.find(u => u.id === tx.user_id) || { username: 'Unknown', email: 'Unknown' }
        }));
      }
    }

    return NextResponse.json(enrichedTransactions);

  } catch (error) {
    console.error('Admin transactions error FULL DETAILS:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch transactions' }, { status: 500 });
  }
}
