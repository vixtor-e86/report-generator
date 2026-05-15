"use client";
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Check, X, Eye, Landmark, User, Clock, 
  ArrowUpRight, AlertCircle, Search, Filter,
  ExternalLink, Hash, Wallet
} from 'lucide-react';
import { Badge } from '@/components/marketplace/ui/badge';
import { Button } from '@/components/marketplace/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function MarketplacePayoutsAdmin() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, payoutId: null, reason: '' });

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/marketplace/payouts?status=${filter}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPayouts(data || []);
    } catch (error) {
      toast.error('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleUpdateStatus = async (payoutId, status, adminNotes = '') => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/marketplace/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status, adminNotes })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Payout ${status} successfully`);
      setPayouts(prev => prev.filter(p => p.id !== payoutId));
      setSelectedPayout(null);
      setRejectModal({ open: false, payoutId: null, reason: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayouts = payouts.filter(p => 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.marketplace_sellers?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.marketplace_sellers?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Seller Payouts</h1>
          <p className="text-slate-500 font-medium">Process marketplace settlement requests</p>
        </div>
        
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-sm">
          {['pending', 'processing', 'paid', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === s ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or account name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div></div>
      ) : filteredPayouts.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center">
          <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase text-sm tracking-widest">No {filter} payouts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller / Account</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedPayout(payout)}>
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-900 text-sm uppercase tracking-tight">
                        {payout.marketplace_sellers?.first_name} {payout.marketplace_sellers?.last_name}
                    </div>
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest truncate">{payout.email}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="font-black text-slate-900 text-base">{formatCurrency(payout.amount)}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase mt-1">{new Date(payout.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-slate-700">{payout.bank_name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{payout.account_number} • {payout.account_name}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-zinc-900 hover:text-white transition shadow-sm">
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedPayout && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setSelectedPayout(null)} />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Payout Request</h2>
                        <div className="flex gap-2 mt-1">
                           <Badge className="bg-slate-100 text-slate-500 border-none px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">ID: {selectedPayout.id.slice(0,8)}</Badge>
                           <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">{selectedPayout.status}</Badge>
                        </div>
                    </div>
                </div>
                <button onClick={() => setSelectedPayout(null)} className="p-3 bg-white rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">
                    <X className="w-6 h-6" />
                </button>
             </div>

             <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Transfer Amount</p>
                        <p className="text-3xl font-black text-zinc-900">{formatCurrency(selectedPayout.amount)}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Request Date</p>
                        <p className="text-lg font-black text-zinc-900">{new Date(selectedPayout.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-blue-600" /> Settlement Account Details
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</span>
                            <span className="font-black text-slate-900 text-sm uppercase">{selectedPayout.bank_name}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-sm tracking-wider">{selectedPayout.account_number}</span>
                                <button onClick={() => { navigator.clipboard.writeText(selectedPayout.account_number); toast.success('Copied!'); }} className="text-blue-500 hover:text-blue-700"><Hash className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</span>
                            <span className="font-black text-slate-900 text-sm uppercase">{selectedPayout.account_name}</span>
                        </div>
                    </div>
                </div>
             </div>

             {selectedPayout.status === 'pending' && (
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <button 
                        onClick={() => setRejectModal({ open: true, payoutId: selectedPayout.id, reason: '' })}
                        className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                        Reject Payout
                    </button>
                    <button 
                        disabled={processing}
                        onClick={() => handleUpdateStatus(selectedPayout.id, 'paid')}
                        className="flex-[2] py-5 bg-zinc-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {processing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <Check className="w-4 h-4" />}
                        Mark as Disbursed
                    </button>
                </div>
             )}
          </div>
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setRejectModal({ open: false, payoutId: null, reason: '' })} />
            <div className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Rejection Reason</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Explain to the seller why this payout was rejected. Funds will be returned to their wallet.</p>
                
                <textarea 
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
                    placeholder="e.g. Invalid account details, suspicious activity..."
                    className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-red-500 font-black text-slate-900 text-sm leading-relaxed mb-6"
                />

                <div className="flex gap-4">
                    <button onClick={() => setRejectModal({ open: false, payoutId: null, reason: '' })} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Cancel</button>
                    <button 
                        disabled={!rejectModal.reason || processing}
                        onClick={() => handleUpdateStatus(rejectModal.payoutId, 'rejected', rejectModal.reason)}
                        className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 disabled:opacity-50"
                    >
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
