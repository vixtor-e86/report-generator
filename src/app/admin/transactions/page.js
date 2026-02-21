"use client";
import { useState, useEffect, useCallback } from 'react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | paid
  const [emailInput, setEmailInput] = useState('');
  const [activeEmail, setActiveEmail] = useState(''); // email currently being filtered
  const [searchError, setSearchError] = useState('');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, transaction: null });
  const [marking, setMarking] = useState(false);

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const fetchTransactions = useCallback(async (email = '') => {
    setLoading(true);
    try {
      const url = email
        ? `/api/admin/transactions?email=${encodeURIComponent(email)}`
        : '/api/admin/transactions';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch transactions');
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = () => {
    const trimmed = emailInput.trim();
    if (!isValidEmail(trimmed)) {
      setSearchError('Please enter a complete email address (e.g. user@example.com)');
      return;
    }
    setSearchError('');
    setActiveEmail(trimmed);
    fetchTransactions(trimmed);
  };

  const handleClearSearch = () => {
    setEmailInput('');
    setActiveEmail('');
    setSearchError('');
    fetchTransactions();
  };

  const handleMarkAsPaid = async () => {
    if (!confirmModal.transaction) return;
    setMarking(true);
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: confirmModal.transaction.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed');

      // Update in-place so the table reflects the change immediately
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === confirmModal.transaction.id
            ? { ...tx, status: 'paid', paid_at: data.transaction.paid_at }
            : tx
        )
      );
      setConfirmModal({ open: false, transaction: null });
    } catch (error) {
      alert(error.message);
    } finally {
      setMarking(false);
    }
  };

  const filtered = transactions.filter(tx => {
    if (statusFilter === 'pending') return tx.status !== 'paid';
    if (statusFilter === 'paid') return tx.status === 'paid';
    return true;
  });

  const pendingCount = transactions.filter(tx => tx.status !== 'paid').length;
  const paidCount = transactions.filter(tx => tx.status === 'paid').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Payment Transactions</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2">
          View all payments and manually verify pending transactions
        </p>
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 space-y-5">

        {/* Email Search */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Search by User Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setSearchError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter full email address to search..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!emailInput.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Search
            </button>
            {activeEmail && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition"
              >
                Clear
              </button>
            )}
          </div>
          {searchError && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">{searchError}</p>
          )}
          {activeEmail && (
            <p className="mt-1.5 text-xs text-indigo-600 font-medium">
              Showing results for: <span className="font-bold">{activeEmail}</span>
            </p>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {[
            { key: 'all',     label: `All (${transactions.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'paid',    label: `Paid (${paidCount})` },
          ].map(({ key, label }) => {
            const isActive = statusFilter === key;
            const activeClass =
              key === 'pending' ? 'bg-amber-500 text-white shadow-sm' :
              key === 'paid'    ? 'bg-emerald-600 text-white shadow-sm' :
                                  'bg-slate-900 text-white shadow-sm';
            const inactiveClass =
              key === 'pending' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
              key === 'paid'    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                                  'bg-slate-100 text-slate-600 hover:bg-slate-200';
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition ${isActive ? activeClass : inactiveClass}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <svg className="w-14 h-14 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-slate-700">No transactions found</p>
            <p className="text-sm mt-1 text-slate-400">
              {activeEmail ? `No transactions for "${activeEmail}"` : 'No transactions match the current filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-xs">User</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-xs">Amount</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-xs">Tier</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-xs">Reference</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-500 uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((tx) => {
                  const isPending = tx.status !== 'paid';
                  return (
                    <tr key={tx.id} className={`transition ${isPending ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{tx.user_profiles?.username || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{tx.user_profiles?.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">₦{tx.amount?.toLocaleString()}</span>
                        {tx.currency && <p className="text-xs text-slate-400">{tx.currency}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          tx.tier === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {tx.tier ? tx.tier.charAt(0).toUpperCase() + tx.tier.slice(1) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-500 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                          {tx.paystack_reference || tx.flutterwave_reference || tx.reference || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-slate-900">{new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block"></span>
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPending ? (
                          <button
                            onClick={() => setConfirmModal({ open: true, transaction: tx })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && confirmModal.transaction && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => !marking && setConfirmModal({ open: false, transaction: null })}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">

            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center mb-1">Confirm Payment Verification</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Are you sure you want to mark this transaction as <span className="font-semibold text-emerald-700">Paid</span>? This will grant the user access to their plan.
            </p>

            {/* Transaction Summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6 space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">User</span>
                <span className="font-semibold text-slate-900 text-right">{confirmModal.transaction.user_profiles?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-slate-900">₦{confirmModal.transaction.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tier</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  confirmModal.transaction.tier === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {confirmModal.transaction.tier ? confirmModal.transaction.tier.charAt(0).toUpperCase() + confirmModal.transaction.tier.slice(1) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Reference</span>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {confirmModal.transaction.paystack_reference || confirmModal.transaction.flutterwave_reference || confirmModal.transaction.reference || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-700">{new Date(confirmModal.transaction.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, transaction: null })}
                disabled={marking}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={marking}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {marking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Yes, Mark as Paid
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
