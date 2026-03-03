// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
      // Fetch amount from all successful transactions
      // We don't use head: true here because we need the sum of amounts
      // But we must handle pagination if there are > 1000 transactions
      let allPayments = [];
      let from = 0;
      let to = 999;
      let hasMore = true;

      while (hasMore) {
        const { data: payments, error } = await supabaseAdmin
          .from('payment_transactions')
          .select('amount')
          .eq('status', 'paid')
          .range(from, to);
        
        if (error) {
          console.error('[AdminStats] Rev Error:', error);
          break;
        }

        if (payments && payments.length > 0) {
          allPayments = [...allPayments, ...payments];
          if (payments.length < 1000) {
            hasMore = false;
          } else {
            from += 1000;
            to += 1000;
          }
        } else {
          hasMore = false;
        }
      }
      
      totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    } catch (e) { console.error('[AdminStats] Rev Exception:', e); }

    // 3. Projects Today & Breakdown
    let breakdown = { free: 0, standard: 0, premium: 0 };
    let projectsToday = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      // Standard Projects Today
      const { count: stdTodayCount } = await supabaseAdmin
        .from('standard_projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);
      
      // Premium Projects Today
      const { count: premTodayCount } = await supabaseAdmin
        .from('premium_projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);
      
      // Free Projects Today
      const { count: freeTodayCount } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);

      breakdown = { 
        free: freeTodayCount || 0, 
        standard: stdTodayCount || 0, 
        premium: premTodayCount || 0 
      };
      projectsToday = (freeTodayCount || 0) + (stdTodayCount || 0) + (premTodayCount || 0);

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

    return NextResponse.json({
      totalUsers: usersCount,
      totalRevenue,
      projectsToday,
      projectsBreakdown: breakdown,
      recentTransactions: transactionsWithUsers
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
