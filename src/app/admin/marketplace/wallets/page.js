"use client";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function WalletsAdmin() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/marketplace/wallets');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setWallets(data || []);
    } catch (error) {
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const filteredWallets = wallets.filter(w => 
    w.user_profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Marketplace Wallets</h1>
        <p className="text-slate-500 font-medium">Monitor user balances and spending activity</p>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
          />
        </div>
        <div className="bg-blue-600 p-6 rounded-[32px] shadow-xl text-white">
          <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Total Marketplace Liquidity</p>
          <p className="text-3xl font-black">
            ₦{wallets.reduce((acc, curr) => acc + (curr.balance || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Current Balance</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Deposits</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Spent</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div></td></tr>
              ) : filteredWallets.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold">No wallets found</td></tr>
              ) : filteredWallets.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-900 text-sm">{w.user_profiles?.username || 'User'}</div>
                    <div className="text-xs text-slate-500 font-bold">{w.user_profiles?.email}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="font-black text-slate-900 text-base">₦{w.balance?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-bold text-emerald-600">₦{w.total_deposited?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-bold text-red-500">₦{w.total_spent?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-xs font-bold text-slate-700">{new Date(w.updated_at).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase">{new Date(w.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
