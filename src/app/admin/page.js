"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    projectsToday: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // First, verify the user is an admin from the client-side
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          // Optional: redirect or show error
          return; 
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          setLoading(false);
          // Optional: redirect or show error
          alert('You are not authorized to view this page.');
          return;
        }

        // Now, fetch the protected stats from our API route
        const response = await fetch('/api/admin/stats');
        const statsData = await response.json();

        if (response.ok) {
          setStats(statsData);
        } else {
          throw new Error(statsData.error || 'Failed to fetch stats');
        }

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with W3 WriteLab.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Users</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalUsers.toLocaleString()}</p>
          <div className="mt-2 text-xs text-green-600 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
            Active
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Revenue</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₦{stats.totalRevenue.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500">Lifetime earnings</div>
        </div>

        {/* Projects Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Projects Today</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.projectsToday.toLocaleString()}</p>
          <div className="mt-2 text-xs flex gap-2">
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">Free: {stats.projectsBreakdown?.free || 0}</span>
            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">Std: {stats.projectsBreakdown?.standard || 0}</span>
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">Prem: {stats.projectsBreakdown?.premium || 0}</span>
          </div>
        </div>

        {/* Quick Action */}
        <div className="bg-indigo-600 p-6 rounded-xl shadow-md text-white">
          <h3 className="text-indigo-100 text-sm font-medium mb-4">Quick Actions</h3>
          <Link
            href="/dashboard"
            className="block w-full bg-white text-indigo-700 py-2.5 px-4 rounded-lg font-bold hover:bg-indigo-50 transition text-center text-sm shadow-sm"
          >
            Go to User Dashboard
          </Link>
          <p className="text-xs text-indigo-200 mt-3 text-center">Switch to user view</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
          </div>
          <Link
            href="/admin/transactions"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          {stats.recentTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="font-medium">No transactions yet</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Tier</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{tx.user_profiles?.username || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{tx.user_profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">₦{tx.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        tx.tier === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {tx.tier?.charAt(0).toUpperCase() + tx.tier?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}