"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Wrench, Wallet, 
  TrendingUp, Download, Eye, Star, ArrowUpRight,
  ChevronRight, Zap, FileText, Code2, Clock, 
  Settings, CreditCard, History
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/marketplace/ui/tabs';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

export default function MarketplaceDashboardPage() {
  const { user } = useUser();
  const { wallet } = useWallet();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const stats = [
    { label: 'Total Purchases', value: '12', icon: ShoppingBag, change: '+3 this month' },
    { label: 'Tools Used', value: '28', icon: Wrench, change: '+8 this month' },
    { label: 'Saved Projects', value: '15', icon: Eye, change: '5 new' },
    { label: 'Downloads', value: '45', icon: Download, change: '+12 this month' },
  ];

  const recentPurchases = [
    { id: 1, title: 'E-Commerce Platform', price: 8500, date: '2 days ago', type: 'project' },
    { id: 2, title: 'Plagiarism Check', price: 500, date: '3 days ago', type: 'tool' },
    { id: 3, title: 'ML Stock Predictor', price: 12000, date: '1 week ago', type: 'project' },
  ];

  const recentTools = [
    { id: 1, name: 'Reference Finder', uses: 5, lastUsed: '2 hours ago' },
    { id: 2, name: 'AI Humanizer', uses: 3, lastUsed: '1 day ago' },
    { id: 3, name: 'Slide Generator', uses: 2, lastUsed: '3 days ago' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-[#111827] mb-2 tracking-tight">Control Center</h1>
            <p className="text-[#6b7280] font-medium">Resource management for <span className="text-black font-bold">{user?.name}</span></p>
          </div>
          <div className="flex gap-3">
            <Link href="/marketplace/projects"><Button variant="outline" className="border-[#e5e7eb] bg-white rounded-full px-6 font-bold shadow-sm">Explore Market</Button></Link>
            <Link href="/marketplace/tools"><Button className="bg-black hover:bg-zinc-800 text-white rounded-full px-6 font-bold">Launch Tool</Button></Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-[28px] p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#f8f9fc] border border-zinc-100 rounded-2xl flex items-center justify-center"><stat.icon className="w-6 h-6 text-black" /></div>
                <span className="text-green-600 text-[10px] font-black uppercase bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <p className="text-3xl font-black text-[#111827] mb-1 tracking-tight">{stat.value}</p>
              <p className="text-[#9ca3af] text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#f8f9fc] border border-[#e5e7eb] p-1 mb-10 rounded-full shadow-inner inline-flex">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Overview</TabsTrigger>
            <TabsTrigger value="purchases" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Resources</TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Execution</TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-[#111827] mb-8 tracking-tight">Recent Acquisitions</h2>
                  <div className="space-y-4">
                    {recentPurchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-5 bg-[#f8f9fc] rounded-[20px] border border-zinc-50">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center">
                            {purchase.type === 'project' ? <Code2 className="w-6 h-6 text-blue-600" /> : <Wrench className="w-6 h-6 text-zinc-900" />}
                          </div>
                          <div>
                            <p className="text-[#111827] font-bold text-base">{purchase.title}</p>
                            <p className="text-[#9ca3af] text-[10px] font-black uppercase mt-1">{purchase.date} • {purchase.type}</p>
                          </div>
                        </div>
                        <span className="text-black font-black text-lg">{formatCurrency(purchase.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-[32px] p-8 shadow-2xl text-white">
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Available Funds</p>
                  <p className="text-4xl font-black text-white tracking-tight mb-8">{formatCurrency(wallet.balance)}</p>
                  <Button className="w-full bg-white text-black hover:bg-zinc-100 rounded-xl py-6 font-bold">Refill Wallet</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
