// src/app/api/admin/transactions/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — all transactions (paid + pending), newest first
// Optional query param: ?email=user@example.com
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let targetUserId = null;
    let targetUserEmail = null;

    if (email) {
      // 1. Search official Auth accounts for this email (Manual Step 1 mirror)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      const user = authData.users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      
      if (user) {
        targetUserId = user.id;
        targetUserEmail = user.email;
      } else {
        // Fallback: Check user_profiles table
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id, email')
          .eq('email', email.trim())
          .single();
        
        if (profile) {
          targetUserId = profile.id;
          targetUserEmail = profile.email;
        }
      }

      if (!targetUserId) return NextResponse.json([]); // Return empty if user not found
    }

    // 2. Fetch Transactions (Manual Step 2 mirror)
    let query = supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    } else {
      // Limit to 50 recent if no specific user search
      query = query.limit(50);
    }

    const { data: transactions, error: txError } = await query;
    if (txError) throw txError;

    // 3. Enrich display data
    // Fetch all profiles for the current batch of transactions
    const uniqueUserIds = [...new Set(transactions.map(tx => tx.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, email')
      .in('id', uniqueUserIds);

    // Fetch all auth users for emails (to avoid "Unknown")
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

// PATCH — verify payment (Manual Step 3 mirror)
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
        verified_at: now // Match webhook behavior
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
