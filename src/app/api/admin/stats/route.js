// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase'; // Client for auth check

export async function GET(request) {
  try {
    console.log('[AdminStats] Starting fetch...');

    // 1. Total Users
    let usersCount = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      if (error) console.error('[AdminStats] User Error:', error);
      usersCount = count || 0;
    } catch (e) { console.error('[AdminStats] User Exception:', e); }

    // 2. Total Revenue
    let totalRevenue = 0;
    try {
      const { data: payments, error } = await supabaseAdmin
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'paid');
      if (error) console.error('[AdminStats] Rev Error:', error);
      totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    } catch (e) { console.error('[AdminStats] Rev Exception:', e); }

    // 3. Projects Today
    let breakdown = { free: 0, standard: 0, premium: 0 };
    let projectsToday = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Standard Projects
      const { data: stdToday, error: stdError } = await supabaseAdmin
        .from('standard_projects')
        .select('tier')
        .gte('created_at', today.toISOString());
      
      // Free Projects (Count)
      const { count: freeTodayCount, error: freeError } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const stdCount = stdToday?.filter(p => p.tier === 'standard').length || 0;
      const premCount = stdToday?.filter(p => p.tier === 'premium').length || 0;
      // Some standard projects might be marked 'free' in tier column, add them to free count
      const stdFreeCount = stdToday?.filter(p => p.tier === 'free').length || 0;
      
      const actualFreeCount = (freeTodayCount || 0) + stdFreeCount;

      breakdown = { free: actualFreeCount, standard: stdCount, premium: premCount };
      projectsToday = actualFreeCount + stdCount + premCount;

    } catch (e) { console.error('[AdminStats] Project Exception:', e); }

    // 4. Recent Transactions
    let transactionsWithUsers = [];
    try {
        const { data: recentTransactions, error: txError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(5);

        if (recentTransactions && recentTransactions.length > 0) {
            const userIds = [...new Set(recentTransactions.map(tx => tx.user_id))];
            const { data: users } = await supabaseAdmin
                .from('user_profiles')
                .select('id, username, email')
                .in('id', userIds);
            
            transactionsWithUsers = recentTransactions.map(tx => ({
                ...tx,
                user_profiles: users?.find(u => u.id === tx.user_id) || { username: 'Unknown', email: 'N/A' }
            }));
        }
    } catch (e) { console.error('[AdminStats] Tx Exception:', e); }

    console.log('[AdminStats] Success. Returning data.');
    return NextResponse.json({
      totalUsers: usersCount,
      totalRevenue,
      projectsToday,
      projectsBreakdown: breakdown,
      recentTransactions: transactionsWithUsers
    });

  } catch (error) {
    console.error('Admin stats error FULL DETAILS:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
