import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 1. Fetch paid payment transactions (paginated to ensure all transactions are retrieved)
    const fetchTransactions = async () => {
      const allTx = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabaseAdmin
          .from('payment_transactions')
          .select('user_id, amount, tier, status, created_at')
          .eq('status', 'paid')
          .range(from, from + step - 1);

        if (error) {
          console.error('Failed to fetch transactions:', error);
          break;
        }
        if (!data || data.length === 0) break;
        allTx.push(...data);
        if (data.length < step) break;
        from += step;
      }
      return allTx;
    };

    // 2. Fetch all user profiles across ranges ordered by created_at descending
    const fetchProfiles = async () => {
      const { count } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const totalProfiles = count || 12000;
      const step = 1000;
      const ranges = [];
      for (let i = 0; i < Math.ceil(totalProfiles / step); i++) {
        ranges.push([i * step, (i + 1) * step - 1]);
      }

      const allProfiles = [];
      const chunkSize = 5;
      for (let i = 0; i < ranges.length; i += chunkSize) {
        const chunk = ranges.slice(i, i + chunkSize);
        const batchResults = await Promise.all(
          chunk.map(([start, end]) =>
            supabaseAdmin
              .from('user_profiles')
              .select('*')
              .order('created_at', { ascending: false })
              .range(start, end)
          )
        );
        for (const res of batchResults) {
          if (res.data) allProfiles.push(...res.data);
        }
      }
      return allProfiles;
    };

    // 3. Fetch ALL Auth Users reliably with retry on transient rate limits
    const fetchAuthUsers = async () => {
      const allUsers = [];
      let page = 1;
      const maxPages = 30; // Up to 30,000 users
      const chunkSize = 2;

      const fetchPageWithRetry = async (p) => {
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await supabaseAdmin.auth.admin.listUsers({ page: p, perPage: 1000 });
          if (!res.error && res.data?.users) return res;
        }
        return { data: { users: [] }, error: true };
      };

      while (page <= maxPages) {
        const pagesToFetch = [];
        for (let i = 0; i < chunkSize && (page + i) <= maxPages; i++) {
          pagesToFetch.push(page + i);
        }

        const chunkResults = await Promise.all(pagesToFetch.map(fetchPageWithRetry));
        let reachedEnd = false;

        for (const res of chunkResults) {
          const users = res.data?.users || [];
          allUsers.push(...users);
          if (!res.error && users.length < 1000) {
            reachedEnd = true;
          }
        }

        if (reachedEnd) break;
        page += chunkSize;
      }
      return allUsers;
    };

    // Run data fetching in parallel
    const [transactions, profiles, authUsers] = await Promise.all([
      fetchTransactions(),
      fetchProfiles(),
      fetchAuthUsers()
    ]);

    // 4. Map transactions by user_id
    const statsMap = new Map();
    transactions.forEach(tx => {
      const uid = tx.user_id;
      if (!uid) return;

      if (!statsMap.has(uid)) {
        statsMap.set(uid, {
          totalSpent: 0,
          purchaseCount: 0,
          premiumCount: 0,
          standardCount: 0,
          lastPurchaseDate: tx.created_at
        });
      }

      const stats = statsMap.get(uid);
      stats.totalSpent += tx.amount || 0;
      stats.purchaseCount += 1;
      if (tx.tier === 'premium') {
        stats.premiumCount += 1;
      } else {
        stats.standardCount += 1;
      }
      if (new Date(tx.created_at) > new Date(stats.lastPurchaseDate)) {
        stats.lastPurchaseDate = tx.created_at;
      }
    });

    // 5. Map profiles by id
    const profileMap = new Map();
    profiles.forEach(p => {
      profileMap.set(p.id, p);
    });

    // 6. Build customer list from all registered auth users & profiles
    const allCustomersList = [];
    const processedUserIds = new Set();

    authUsers.forEach(u => {
      const uid = u.id;
      processedUserIds.add(uid);
      const profile = profileMap.get(uid);
      const txStats = statsMap.get(uid);

      const email = u.email || profile?.email || 'Unknown';
      const username = profile?.username || profile?.full_name || u.user_metadata?.username || u.user_metadata?.full_name || (email.includes('@') ? email.split('@')[0] : 'User');
      const fullName = profile?.full_name || profile?.username || u.user_metadata?.full_name || u.user_metadata?.name || username;
      const department = profile?.department || profile?.custom_institution || 'N/A';
      const joinedAt = u.created_at || profile?.created_at || null;

      allCustomersList.push({
        id: uid,
        email,
        username,
        fullName,
        department,
        totalSpent: txStats?.totalSpent || 0,
        purchaseCount: txStats?.purchaseCount || 0,
        premiumCount: txStats?.premiumCount || 0,
        standardCount: txStats?.standardCount || 0,
        lastPurchaseDate: txStats?.lastPurchaseDate || null,
        joinedAt
      });
    });

    // Safety fallback: any profile ID that might not have been returned in authUsers
    profiles.forEach(p => {
      if (!processedUserIds.has(p.id)) {
        processedUserIds.add(p.id);
        const txStats = statsMap.get(p.id);
        allCustomersList.push({
          id: p.id,
          email: p.email || 'Unknown',
          username: p.username || p.full_name || 'User',
          fullName: p.full_name || p.username || 'User',
          department: p.department || p.custom_institution || 'N/A',
          totalSpent: txStats?.totalSpent || 0,
          purchaseCount: txStats?.purchaseCount || 0,
          premiumCount: txStats?.premiumCount || 0,
          standardCount: txStats?.standardCount || 0,
          lastPurchaseDate: txStats?.lastPurchaseDate || null,
          joinedAt: p.created_at || null
        });
      }
    });

    // 7. Sort: paying users first (by total spent, then purchase count), then non-paying users by registration date descending (most recent first!)
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
