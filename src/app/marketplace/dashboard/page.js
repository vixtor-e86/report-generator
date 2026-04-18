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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/marketplace/ui/dialog';
import { toast } from 'sonner';

export default function MarketplaceDashboardPage() {
  const { user } = useUser();
  const { wallet, refreshWallet } = useWallet();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  
  // Refill Modal State
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [fundingAmount, setFundingAmount] = useState(5000);
  const [isFunding, setIsFunding] = useState(false);

  const fundingOptions = [
    { label: 'Starter', amount: 5000, description: 'Perfect for small tools' },
    { label: 'Essential', amount: 10000, description: 'Best for standard projects' },
    { label: 'Professional', amount: 20000, description: 'Bulk research & high-tier tools' },
    { label: 'Institutional', amount: 50000, description: 'Complete library access' },
  ];

  const handleFundWallet = async () => {
    if (!user) return;
    setIsFunding(true);
    
    try {
      const response = await fetch('/api/marketplace/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          amount: fundingAmount
        })
      });

      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsFunding(false);
    }
  };

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
            <Link href="/marketplace/projects"><Button variant="outline" className="border-[#e5e7eb] bg-white rounded-full px-6 font-black text-[#111827] shadow-sm hover:bg-zinc-50 transition-all uppercase text-[11px] tracking-widest">Explore Market</Button></Link>
            <Link href="/marketplace/tools"><Button className="bg-black hover:bg-zinc-800 text-white rounded-full px-6 font-black uppercase text-[11px] tracking-widest">Launch Tool</Button></Link>
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
          <div className="sticky top-[70px] z-30 bg-[#f8f9fc]/95 backdrop-blur-md pt-2 pb-6 mb-4">
            <TabsList className="bg-zinc-100 border border-[#e5e7eb] p-1 rounded-full shadow-inner inline-flex">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Overview</TabsTrigger>
              <TabsTrigger value="purchases" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Resources</TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Execution</TabsTrigger>
              <TabsTrigger value="wallet" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Billing</TabsTrigger>
            </TabsList>
          </div>

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
                  <div className="space-y-3">
                    <Button 
                        onClick={() => setShowRefillModal(true)}
                        className="w-full bg-white text-black hover:bg-zinc-100 rounded-xl py-6 font-bold"
                    >
                        Refill Wallet
                    </Button>
                    
                    {user?.isSeller && (
                        <Link href="/marketplace/upload-project" className="block w-full">
                            <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Upload Project
                            </Button>
                        </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Refill Wallet Dialog */}
      <Dialog open={showRefillModal} onOpenChange={setShowRefillModal}>
        <DialogContent className="bg-white border-none text-[#111827] max-w-lg rounded-[40px] p-10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight">Fund Your Wallet</DialogTitle>
            <DialogDescription className="text-[#6b7280] font-medium text-base">Select a funding package to continue</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8">
            {fundingOptions.map((option) => (
              <button
                key={option.amount}
                onClick={() => setFundingAmount(option.amount)}
                className={`flex flex-col text-left p-6 rounded-[24px] border-2 transition-all ${
                  fundingAmount === option.amount 
                    ? 'border-black bg-zinc-900 text-white shadow-xl scale-[1.02]' 
                    : 'border-[#e5e7eb] bg-[#f8f9fc] text-black hover:border-zinc-300'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${fundingAmount === option.amount ? 'text-blue-400' : 'text-[#9ca3af]'}`}>
                  {option.label}
                </span>
                <span className="text-xl font-black mb-2">{formatCurrency(option.amount)}</span>
                <span className={`text-[11px] font-medium leading-tight ${fundingAmount === option.amount ? 'text-zinc-400' : 'text-[#6b7280]'}`}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              className="flex-1 text-[#6b7280] font-bold rounded-full py-7" 
              onClick={() => setShowRefillModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-full py-7 font-black shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98]"
              onClick={handleFundWallet}
              disabled={isFunding}
            >
              {isFunding ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Pay ₦{fundingAmount.toLocaleString()}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
