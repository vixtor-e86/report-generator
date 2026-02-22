"use client";
import { useState, useEffect, useCallback } from 'react';

const Icons = {
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Copy: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  )
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailInput, setEmailInput] = useState('');
  const [activeEmail, setActiveEmail] = useState('');
  const [searchError, setSearchError] = useState('');

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
      setSearchError('Enter a valid full email');
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

  const handleCopy = (text, msg = 'Copied!') => {
    navigator.clipboard.writeText(text);
    alert(msg);
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

  return (
    <div className="max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8 px-4 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Payment Transactions</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Mirroring manual verification: Search Email → Find ID → Mark Paid</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 mx-4 sm:mx-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setSearchError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search full email..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSearch} className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition">Search</button>
            {activeEmail && <button onClick={handleClearSearch} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition">Clear</button>}
          </div>
        </div>
        {searchError && <p className="mt-2 text-xs text-red-600 font-bold">{searchError}</p>}
      </div>

      {/* Stats & Filters */}
      <div className="flex flex-wrap gap-2 mb-6 px-4 sm:px-0">
        {['all', 'pending', 'paid'].map(key => (
          <button 
            key={key} 
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${statusFilter === key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Responsive Table Wrapper */}
      <div className="bg-white border-y sm:border border-slate-200 sm:rounded-xl overflow-hidden shadow-sm mx-0 sm:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount & Plan</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reference</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right sticky right-0 bg-slate-50 shadow-l shadow-slate-50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center text-slate-400 text-sm font-medium">No transactions found for this search.</td></tr>
              ) : filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition group">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{tx.user_profiles?.username}</span>
                          <button onClick={() => handleCopy(tx.user_id, 'User ID Copied')} className="text-slate-300 hover:text-indigo-600 transition p-1" title="Copy User ID"><Icons.Copy className="w-3.5 h-3.5" /></button>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{tx.user_profiles?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-900 text-sm">₦{tx.amount?.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">{tx.tier}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded select-all">
                      {tx.paystack_reference || tx.flutterwave_reference || tx.reference}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {tx.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-700">PAID</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-100 text-amber-700 animate-pulse">PENDING</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-slate-50 transition shadow-l shadow-white">
                    {tx.status !== 'paid' ? (
                      <button 
                        onClick={() => setConfirmModal({ open: true, transaction: tx })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-black shadow-sm active:scale-95 transition inline-flex items-center gap-1.5"
                      >
                        <Icons.Check className="w-3.5 h-3.5" /> MARK PAID
                      </button>
                    ) : (
                      <span className="text-slate-300 italic text-[11px] font-bold">VERIFIED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !marking && setConfirmModal({ open: false, transaction: null })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Verify Payment?</h3>
            <p className="text-sm text-slate-500 mb-6">Confirming this will mark the transaction as <b>Paid</b> and grant full project access to <b>{confirmModal.transaction.user_profiles.email}</b>.</p>
            <div className="flex gap-3">
              <button disabled={marking} onClick={() => setConfirmModal({ open: false, transaction: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Cancel</button>
              <button disabled={marking} onClick={handleMarkAsPaid} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg transition flex items-center justify-center gap-2">
                {marking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
