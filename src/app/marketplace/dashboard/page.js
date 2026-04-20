"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Wrench, Wallet, 
  TrendingUp, Download, Eye, Star, ArrowUpRight,
  ChevronRight, Zap, FileText, CheckCircle2, Clock,
  Plus, Users, BarChart3, Landmark
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/marketplace/ui/tabs';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/marketplace/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function MarketplaceDashboardPage() {
  const { user } = useUser();
  const { wallet, refreshWallet } = useWallet();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  
  // Refill Modal State
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [fundingAmount, setFundingAmount] = useState(5000);
  const [isFunding, setIsFunding] = useState(false);

  // Seller Hub States
  const [sellerWallet, setSellerWallet] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [loadingSeller, setLoadingSeller] = useState(false);

  const fetchSellerData = useCallback(async () => {
    if (!user?.isSeller) return;
    setLoadingSeller(true);
    try {
      // 1. Fetch Seller Wallet (70% Earnings)
      const { data: sWallet } = await supabase
        .from('marketplace_seller_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setSellerWallet(sWallet);

      // 2. Fetch My Projects
      const { data: projects } = await supabase
        .from('marketplace_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setMyProjects(projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSeller(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'seller' || user?.isSeller) {
        fetchSellerData();
    }
  }, [activeTab, user, fetchSellerData]);

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
        body: JSON.stringify({ userId: user.id, email: user.email, amount: fundingAmount })
      });
      const data = await response.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
      else toast.error(data.error || 'Failed to initialize');
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Control Center</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your academic acquisitions and earnings</p>
          </div>
          <div className="flex gap-3">
            <Link href="/marketplace/projects"><Button variant="outline" className="border-[#e5e7eb] bg-white rounded-full px-6 font-black text-[#111827] shadow-sm hover:bg-zinc-50 transition-all uppercase text-[11px] tracking-widest">Explore Market</Button></Link>
            <Link href="/marketplace/tools"><Button className="bg-black hover:bg-zinc-800 text-white rounded-full px-6 font-black uppercase text-[11px] tracking-widest">Launch Tool</Button></Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-[70px] z-30 bg-[#f8f9fc]/95 backdrop-blur-md pt-2 pb-6 mb-4">
            <TabsList className="bg-zinc-100 border border-[#e5e7eb] p-1 rounded-full shadow-inner inline-flex">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Overview</TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Billing</TabsTrigger>
              {user?.isSeller && (
                <TabsTrigger value="seller" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-full text-blue-600 px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all ml-2">Seller Hub</TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* USER OVERVIEW */}
          <TabsContent value="overview" className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ShoppingBag className="w-6 h-6" /></div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Recent Acquisitions</h2>
                </div>
                <div className="space-y-4">
                  {wallet.transactions.filter(t => t.type === 'purchase').slice(0, 3).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-zinc-100"><FileText className="w-5 h-5 text-zinc-400" /></div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{tx.description.replace('Purchase: ', '')}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300" />
                    </div>
                  ))}
                  {wallet.transactions.filter(t => t.type === 'purchase').length === 0 && (
                    <p className="text-center py-10 text-slate-400 font-bold italic">No projects purchased yet</p>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-[40px] p-10 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Marketplace Credit</p>
                  <p className="text-5xl font-black text-white tracking-tight mb-10">{formatCurrency(wallet.balance)}</p>
                  <Button onClick={() => setShowRefillModal(true)} className="w-full bg-white text-black hover:bg-zinc-100 rounded-2xl py-8 font-black uppercase text-xs tracking-widest shadow-xl">Refill Wallet</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* BILLING / WALLET HISTORY */}
          <TabsContent value="billing" className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white border border-[#e5e7eb] rounded-[40px] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Transaction Ledger</h3>
                    <Badge variant="outline" className="rounded-full px-4 py-1 border-slate-200 text-[10px] font-black">{wallet.transactions.length} Total</Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {wallet.transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${tx.type === 'deposit' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            <span className="font-bold text-slate-900 text-sm">{tx.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6"><span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 px-2 py-1 rounded capitalize">{tx.reference?.slice(0,12)}</span></td>
                                    <td className="px-8 py-6"><span className={`font-black ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>{tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}</span></td>
                                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">{new Date(tx.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </TabsContent>

          {/* SELLER HUB (ONLY FOR VERIFIED SELLERS) */}
          {user?.isSeller && (
            <TabsContent value="seller" className="space-y-10 animate-in fade-in duration-500">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Withdrawable Balance (70%)</p>
                        <p className="text-4xl font-black">{formatCurrency(sellerWallet?.balance || 0)}</p>
                        <Button variant="outline" className="mt-8 w-full border-zinc-700 hover:bg-zinc-800 text-white rounded-xl py-6 font-black uppercase text-[10px] tracking-widest">Request Payout</Button>
                    </div>
                    <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Lifetime Earnings</p>
                        <p className="text-4xl font-black text-slate-900">{formatCurrency(sellerWallet?.total_earned || 0)}</p>
                        <div className="mt-6 flex items-center gap-2 text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-tight">Active Growth</span>
                        </div>
                    </div>
                    <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Approved Blueprints</p>
                        <p className="text-4xl font-black text-slate-900">{myProjects.length}</p>
                        <Link href="/marketplace/upload-project" className="mt-6 block">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-4 h-4" /> List New Project
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Projects List */}
                <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Layers className="w-6 h-6" /></div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">My Technical Library</h2>
                        </div>
                        <Link href="/marketplace/upload-project">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20">Upload Project</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myProjects.map(project => (
                            <div key={project.id} className="flex items-center justify-between p-6 bg-zinc-50 rounded-[32px] border border-zinc-100 hover:border-blue-400 transition-all group">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-200 flex-shrink-0">
                                        <img src={project.preview_images?.[0]} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-slate-900 text-sm truncate uppercase">{project.title}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <Badge className={`px-2 py-0 text-[8px] font-black uppercase ${
                                                project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                                project.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {project.status}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-slate-400">{project.sales_count} SALES</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/marketplace/project/${project.id}`}>
                                        <button className="p-3 bg-white rounded-xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm border border-zinc-200"><Eye className="w-4 h-4" /></button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {myProjects.length === 0 && (
                            <div className="md:col-span-2 py-20 text-center space-y-4">
                                <Landmark className="w-12 h-12 text-zinc-200 mx-auto" />
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">You haven't listed any projects yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Refill Wallet Dialog */}
      <Dialog open={showRefillModal} onOpenChange={setShowRefillModal}>
        <DialogContent className="bg-white border-none text-[#111827] max-w-lg rounded-[40px] p-10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight uppercase tracking-tighter">Fund Your Wallet</DialogTitle>
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
