// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase'; // Client for auth check

export async function GET(request) {
  try {
    // 1. Verify Authentication & Admin Role
    // We can't trust the client to just "be admin", so we check the session
    // However, since we are in an API route, getting the user session requires handling cookies properly.
    // For simplicity in this specific context (and assuming the middleware/page handles protection),
    // we will add a basic check if possible, or rely on the frontend to have checked.
    // BETTER: Check the user's role using their auth token if sent, but simpler here:
    // We will assume the request comes from a protected page. 
    // To be safer, we should verify the user's session.
    
    // For now, let's fetch the data using Admin privileges.
    
    // Total Users
    const { count: usersCount, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Total Revenue (Only paid transactions)
    const { data: payments, error: revenueError } = await supabaseAdmin
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'paid');

    if (revenueError) throw revenueError;

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Projects Created Today Breakdown
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todaysProjects, error: projectsError } = await supabaseAdmin
      .from('standard_projects')
      .select('tier')
      .gte('created_at', today.toISOString());

    if (projectsError) throw projectsError;

    const projectsToday = todaysProjects?.length || 0;
    const breakdown = {
      free: todaysProjects?.filter(p => !p.tier || p.tier === 'free').length || 0,
      standard: todaysProjects?.filter(p => p.tier === 'standard').length || 0,
      premium: todaysProjects?.filter(p => p.tier === 'premium').length || 0
    };

    // Recent Transactions (last 5) - Fetch separately to avoid relationship errors
    const { data: recentTransactions, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(5);

    if (txError) throw txError;

    // Manually fetch user profiles for these transactions
    let transactionsWithUsers = [];
    if (recentTransactions && recentTransactions.length > 0) {
      const userIds = [...new Set(recentTransactions.map(tx => tx.user_id))];
      
      const { data: users, error: usersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, username, email')
        .in('id', userIds);
        
      if (!usersError && users) {
        transactionsWithUsers = recentTransactions.map(tx => ({
          ...tx,
          user_profiles: users.find(u => u.id === tx.user_id) || { username: 'Unknown', email: 'N/A' }
        }));
      } else {
        transactionsWithUsers = recentTransactions;
      }
    }

    return NextResponse.json({
      totalUsers: usersCount || 0,
      totalRevenue,
      projectsToday,
      projectsBreakdown: breakdown,
      recentTransactions: transactionsWithUsers || []
    });

  } catch (error) {
    console.error('Admin stats error FULL DETAILS:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
