import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    // 1. Fetch wallet transactions sorted by date
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txError) {
      console.error('Database fetch error:', txError);
      return NextResponse.json({ error: 'Failed to retrieve transactions' }, { status: 500 });
    }

    // 2. Fetch user profiles for details
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, full_name, department');

    if (profileError) {
      console.error('Database profile error:', profileError);
      return NextResponse.json({ error: 'Failed to retrieve user profiles' }, { status: 500 });
    }

    // 3. Fetch auth users to retrieve email addresses
    let authUsers = [];
    try {
      const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000
      });
      if (!authError && data && data.users) {
        authUsers = data.users;
      }
    } catch (authErr) {
      console.error('Auth user list failed in activities:', authErr);
    }

    const emailMap = {};
    authUsers.forEach(u => {
      emailMap[u.id] = u.email;
    });

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.id] = p;
    });

    // 4. Merge transactions with user details
    const activities = transactions.map(tx => {
      const profile = profileMap[tx.user_id];
      return {
        id: tx.id,
        userId: tx.user_id,
        username: profile?.username || profile?.full_name || 'User',
        fullName: profile?.full_name || profile?.username || 'User',
        email: emailMap[tx.user_id] || 'Unknown',
        department: profile?.department || 'N/A',
        amount: tx.amount,
        type: tx.type, // 'deposit' or 'purchase'
        status: tx.status, // 'completed', 'pending', 'failed'
        reference: tx.reference || 'N/A',
        description: tx.description || 'N/A',
        createdAt: tx.created_at
      };
    });

    return NextResponse.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Marketplace activities query error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
