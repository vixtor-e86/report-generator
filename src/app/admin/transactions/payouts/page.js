"use client";
import { useState, useEffect } from 'react';

const Icons = {
  Bank: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>,
  User: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payouts');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to load payouts');
      
      if (Array.isArray(data)) {
        setPayouts(data);
      } else {
        setPayouts([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, []);

  const handleMarkPaid = async (id) => {
    if (!confirm('Confirm you have sent the money to this user?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId: id, status: 'paid' })
      });
      if (res.ok) {
        setPayouts(prev => Array.isArray(prev) ? prev.map(p => p.id === id ? { ...p, status: 'paid', paid_at: new Date().toISOString() } : p) : []);
      }
    } catch (err) {
      alert('Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = Array.isArray(payouts) ? payouts.filter(p => filter === 'all' ? true : p.status === filter) : [];

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Affiliate Payouts</h1>
          <p className="text-slate-500 text-sm">Review and process referral withdrawal requests</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['pending', 'paid', 'all'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold">
          ⚠️ Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-400 font-bold">Loading requests...</div>
        ) : error ? (
          <div className="py-20 text-center bg-white border-2 border-red-100 rounded-3xl text-red-400 font-medium">Failed to fetch data. Please try again.</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">No {filter} payout requests found.</div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Icons.User />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{p.user_profiles?.username || 'User'}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.user_profiles?.email}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Requested: {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount to Pay</span>
                  <span className="text-2xl font-black text-emerald-600">₦{p.amount.toLocaleString()}</span>
                </div>

                <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Icons.Bank />
                    <span className="text-[10px] font-black uppercase tracking-widest">Bank Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Account Number</p>
                      <p className="text-sm font-black text-slate-900 select-all">{p.bank_details?.account_number}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Bank Name</p>
                      <p className="text-sm font-black text-slate-900">{p.bank_details?.bank_name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Account Holder</p>
                      <p className="text-sm font-black text-slate-900">{p.bank_details?.account_name}</p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {p.status === 'pending' ? (
                    <button 
                      disabled={updatingId === p.id}
                      onClick={() => handleMarkPaid(p.id)}
                      className="w-full md:w-auto px-8 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-slate-200"
                    >
                      {updatingId === p.id ? 'Processing...' : <><Icons.Check /> MARK AS PAID</>}
                    </button>
                  ) : (
                    <div className="text-center md:text-right">
                      <span className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase">
                        <Icons.Check /> PAID
                      </span>
                      <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">Processed: {new Date(p.paid_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
