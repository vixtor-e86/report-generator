"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MarketplaceOverview() {
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalLiquidity: 0,
    pendingFunding: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/marketplace/stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { name: 'Total Wallets', value: stats.totalWallets, detail: 'Registered users', color: 'bg-zinc-900', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Current Liquidity', value: `₦${stats.totalLiquidity.toLocaleString()}`, detail: 'Sum of all balances', color: 'bg-blue-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Pending Deposits', value: stats.pendingFunding, detail: 'Awaiting verification', color: 'bg-amber-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Platform Revenue', value: `₦${stats.totalSpent.toLocaleString()}`, detail: 'Total user spending', color: 'bg-emerald-600', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace Hub</h1>
        <p className="text-slate-500 font-medium">Global financial overview of your academic ecosystem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110`} />
            <div className={`w-12 h-12 ${card.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={card.icon} /></svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.name}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href="/admin/marketplace/projects" className="block p-8 bg-white border border-slate-200 rounded-[40px] hover:border-blue-600 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Approve Blueprints</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Verify and authorize technical project listings</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>

        <Link href="/admin/marketplace/ebooks" className="block p-8 bg-white border border-slate-200 rounded-[40px] hover:border-indigo-600 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Approve Ebooks</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Review digital book previews and metadata</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>

        <Link href="/admin/marketplace/wallets" className="block p-8 bg-white border border-slate-200 rounded-[40px] hover:border-zinc-900 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manage Wallets</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">View balances, spending, and user activity</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-zinc-50 transition-colors">
              <svg className="w-6 h-6 text-slate-400 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>

        <Link href="/admin/marketplace/funding" className="block p-8 bg-white border border-slate-200 rounded-[40px] hover:border-amber-500 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Funding Requests</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Approve deposits and manual verifications</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-amber-50 transition-colors">
              <svg className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
