import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // 1. Fetch paid payment transactions
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select('user_id, amount, tier, status, created_at')
      .eq('status', 'paid');

    if (txError) {
      console.error('Failed to fetch transactions:', txError);
      return NextResponse.json({ error: 'Failed to fetch transaction data' }, { status: 500 });
    }

    // 2. Fetch user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, username, full_name, department, created_at');

    if (profileError) {
      console.error('Failed to fetch user profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
    }

    // 3. Fetch auth users for email details (uses fast pagination, up to 1000)
    let authUsers = [];
    try {
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      if (!authError && users) {
        authUsers = users;
      }
    } catch (authErr) {
      console.error('Auth user list failed (check credentials):', authErr);
    }

    // 4. Map auth users and profiles in memory
    const emailMap = {};
    const authMetaMap = {};
    authUsers.forEach(u => {
      emailMap[u.id] = u.email;
      authMetaMap[u.id] = {
        lastSignIn: u.last_sign_in_at,
        created: u.created_at
      };
    });

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.id] = p;
    });

    // 5. Aggregate purchase stats per user
    const statsMap = {};

    transactions.forEach(tx => {
      const uid = tx.user_id;
      if (!uid) return;

      if (!statsMap[uid]) {
        const profile = profileMap[uid];
        statsMap[uid] = {
          id: uid,
          email: emailMap[uid] || 'Unknown',
          username: profile?.username || profile?.full_name || 'User',
          fullName: profile?.full_name || profile?.username || 'User',
          department: profile?.department || 'N/A',
          totalSpent: 0,
          purchaseCount: 0,
          premiumCount: 0,
          standardCount: 0,
          lastPurchaseDate: tx.created_at,
          joinedAt: profile?.created_at || authMetaMap[uid]?.created || tx.created_at
        };
      }

      statsMap[uid].totalSpent += tx.amount || 0;
      statsMap[uid].purchaseCount += 1;
      if (tx.tier === 'premium') {
        statsMap[uid].premiumCount += 1;
      } else {
        statsMap[uid].standardCount += 1;
      }
      if (new Date(tx.created_at) > new Date(statsMap[uid].lastPurchaseDate)) {
        statsMap[uid].lastPurchaseDate = tx.created_at;
      }
    });

    // 6. Include non-purchasing users to show full list if requested
    const allCustomersList = Object.values(statsMap);
    const payingUserIds = new Set(allCustomersList.map(c => c.id));

    profiles.forEach(p => {
      if (!payingUserIds.has(p.id)) {
        allCustomersList.push({
          id: p.id,
          email: emailMap[p.id] || 'Unknown',
          username: p.username || p.full_name || 'User',
          fullName: p.full_name || p.username || 'User',
          department: p.department || 'N/A',
          totalSpent: 0,
          purchaseCount: 0,
          premiumCount: 0,
          standardCount: 0,
          lastPurchaseDate: null,
          joinedAt: p.created_at || authMetaMap[p.id]?.created || null
        });
      }
    });

    // Sort by total spent, then purchase count, then join date
    allCustomersList.sort((a, b) => {
      if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
      if (b.purchaseCount !== a.purchaseCount) return b.purchaseCount - a.purchaseCount;
      return new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0);
    });

    return NextResponse.json({
      success: true,
      customers: allCustomersList
    });

  } catch (error) {
    console.error('Customer stats query error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
