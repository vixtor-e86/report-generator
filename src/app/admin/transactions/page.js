"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, standard, premium
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWithinDateRange = (dateString, range) => {
    if (range === 'all') return true;
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset hours to compare dates only
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (range === 'today') {
      return txDate.getTime() === today.getTime();
    }
    
    if (range === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return txDate >= weekAgo;
    }
    
    if (range === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return txDate >= monthAgo;
    }
    
    return true;
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.tier === filter;
    const matchesSearch = 
      tx.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user_profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.paystack_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = isWithinDateRange(tx.created_at, dateFilter);
    
    return matchesFilter && matchesSearch && matchesDate;
  });

  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">All Transactions</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">Complete history of successful payments</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          
          {/* Row 1: Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Tier Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setFilter('standard')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  filter === 'standard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setFilter('premium')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  filter === 'premium'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Premium
              </button>
            </div>

            {/* Date Filters */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              {['all', 'today', 'week', 'month'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateFilter(range)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition capitalize ${
                    dateFilter === range
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {range === 'all' ? 'Any Time' : range}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Search */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, username, or reference..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 text-sm"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total Revenue ({dateFilter === 'all' ? 'All Time' : dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)})
            </span>
            <span className="text-2xl font-bold text-slate-900">₦{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No transactions found</p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Try adjusting your search' : 'No transactions match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-slate-900">{tx.user_profiles?.username || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{tx.user_profiles?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">₦{tx.amount?.toLocaleString()}</span>
                      <p className="text-xs text-slate-500">{tx.currency}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        tx.tier === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {tx.tier?.charAt(0).toUpperCase() + tx.tier?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-slate-500 font-mono text-xs bg-slate-100 px-2 py-1 rounded">{tx.paystack_reference}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-slate-900">{new Date(tx.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}