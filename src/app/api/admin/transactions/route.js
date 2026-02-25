// src/app/api/admin/transactions/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — all transactions (paid + pending), newest first
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const reference = searchParams.get('reference');

    let baseQuery = supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    let targetUserId = null;

    if (email) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      const user = authData.users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      
      if (user) {
        targetUserId = user.id;
      } else {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id, email')
          .eq('email', email.trim())
          .single();
        if (profile) targetUserId = profile.id;
      }

      if (!targetUserId) return NextResponse.json([]);
      baseQuery = baseQuery.eq('user_id', targetUserId);
    } else if (reference) {
      // NOTE: Based on verify route, flw and paystack references are both 
      // checked against 'paystack_reference' or 'reference' columns.
      baseQuery = baseQuery.or(`paystack_reference.eq.${reference},reference.eq.${reference}`);
    } else {
      baseQuery = baseQuery.limit(50);
    }

    const { data: transactions, error: txError } = await baseQuery;
    if (txError) throw txError;

    if (!transactions || transactions.length === 0) return NextResponse.json([]);

    const uniqueUserIds = [...new Set(transactions.map(tx => tx.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, email')
      .in('id', uniqueUserIds);

    const { data: allAuthUsers } = await supabaseAdmin.auth.admin.listUsers();

    const enriched = transactions.map(tx => {
      const profile = profiles?.find(p => p.id === tx.user_id);
      const authUser = allAuthUsers?.users.find(u => u.id === tx.user_id);
      return {
        ...tx,
        user_profiles: {
          username: profile?.username || 'Student',
          email: authUser?.email || profile?.email || 'Unknown Email'
        }
      };
    });

    return NextResponse.json(enriched);

  } catch (error) {
    console.error('Admin Transactions Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — verify payment
export async function PATCH(request) {
  try {
    const { transactionId } = await request.json();
    const now = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'paid',
        paid_at: now,
        updated_at: now,
        verified_at: now
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, transaction: updated });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
