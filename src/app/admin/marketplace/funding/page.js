"use client";
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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
  ),
  Wallet: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
};

export default function WalletFundingAdmin() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, transaction: null });
  const [verifying, setVerifying] = useState(false);

  const fetchFundingRequests = useCallback(async (query = '') => {
    setLoading(true);
    try {
      let url = '/api/admin/marketplace/funding';
      if (query) url += `?query=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch');
      setTransactions(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Could not load funding requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFundingRequests();
  }, [fetchFundingRequests]);

  const handleVerify = async () => {
    if (!confirmModal.transaction) return;
    setVerifying(true);
    try {
      const response = await fetch('/api/admin/marketplace/funding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: confirmModal.transaction.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      toast.success('Payment verified and wallet funded!');
      setTransactions(prev => 
        prev.map(tx => tx.id === confirmModal.transaction.id ? { ...tx, status: 'completed' } : tx)
      );
      setConfirmModal({ open: false, transaction: null });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wallet Funding</h1>
        <p className="text-slate-500 font-medium">Verify and approve manual wallet deposits</p>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex gap-3">
          <input
            type="text"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFundingRequests(emailInput)}
            placeholder="Search by Email or Reference (W3WL_FUND_...)"
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
          />
          <button 
            onClick={() => fetchFundingRequests(emailInput)}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg"
          >
            Search
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No funding requests found</td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-900 text-sm">{tx.user_profiles?.username || 'User'}</div>
                    <div className="text-xs text-slate-500 font-bold">{tx.user_profiles?.email}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-blue-600 text-base">₦{tx.amount?.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-mono bg-zinc-100 px-2 py-1 rounded-md text-zinc-600 font-bold uppercase">{tx.reference}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-700">{new Date(tx.created_at).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-5">
                    {tx.status === 'completed' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">Funded</span>
                    ) : tx.status === 'failed' ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase">Failed</span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase animate-pulse">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {tx.status === 'pending' && (
                      <button 
                        onClick={() => setConfirmModal({ open: true, transaction: tx })}
                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-md active:scale-95"
                        title="Verify & Fund Wallet"
                      >
                        <Icons.Check className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !verifying && setConfirmModal({ open: false, transaction: null })} />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[30px] flex items-center justify-center mx-auto mb-6">
              <Icons.Wallet className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Confirm Funding?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">Confirming will manually add <b>₦{confirmModal.transaction.amount.toLocaleString()}</b> to the user's wallet balance.</p>
            <div className="flex gap-4">
              <button disabled={verifying} onClick={() => setConfirmModal({ open: false, transaction: null })} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
              <button disabled={verifying} onClick={handleVerify} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition flex items-center justify-center gap-2">
                {verifying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify & Fund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
