"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Wrench, Wallet, 
  TrendingUp, Download, Eye, Star, ArrowUpRight,
  ChevronRight, Zap, FileText, CheckCircle2, Clock,
  Plus, Users, BarChart3, Landmark, Layers, ArrowRight, Trash2, Book
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/marketplace/ui/tabs';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PaymentMethodModal, PayoutRequestModal } from '@/components/marketplace/PayoutModals';

export default function MarketplaceDashboardPage() {
  const { user } = useUser();
  const { wallet, refreshWallet, setShowFundingModal } = useWallet();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  
  // Seller Hub States
  const [sellerWallet, setSellerWallet] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [sellerAccount, setSellerAccount] = useState(null);

  const fetchSellerData = useCallback(async () => {
    if (!user?.isSeller) return;
    setLoadingSeller(true);
    try {
      // 1. Fetch Seller Wallet
      const { data: sWallet } = await supabase
        .from('marketplace_seller_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setSellerWallet(sWallet);

      // 2. Fetch Bank Details
      const { data: sAccount } = await supabase
        .from('marketplace_sellers')
        .select('bank_name, account_number, account_name')
        .eq('user_id', user.id)
        .single();
      
      setSellerAccount(sAccount);

      // 3. Fetch My Projects & Ebooks
      const [projectsRes, ebooksRes] = await Promise.all([
        supabase.from('marketplace_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('marketplace_ebooks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      
      const combined = [
        ...(projectsRes.data || []).map(i => ({ ...i, itemType: 'blueprint' })),
        ...(ebooksRes.data || []).map(i => ({ ...i, itemType: 'ebook' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setMyItems(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSeller(false);
    }
  }, [user]);

  const handleDeleteItem = async (id, type) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/marketplace/delete?id=${id}&type=${type}&userId=${user.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Listing deleted successfully');
      setMyItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete listing');
    }
  };

  useEffect(() => {
    if (activeTab === 'seller' || user?.isSeller) {
        fetchSellerData();
    }
  }, [activeTab, user, fetchSellerData]);

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Control Center</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your academic acquisitions and earnings</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/marketplace/projects"><Button variant="outline" className="border-[#e5e7eb] bg-white rounded-full px-6 font-black text-[#111827] shadow-sm hover:bg-zinc-50 transition-all uppercase text-[11px] tracking-widest">Explore Market</Button></Link>
            <Link href="/marketplace/tools"><Button className="bg-black hover:bg-zinc-800 text-white rounded-full px-6 font-black uppercase text-[11px] tracking-widest">Launch Tool</Button></Link>
            {user?.isSeller && (
                <div className="flex gap-2">
                    <Link href="/marketplace/upload-project"><Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-black uppercase text-[11px] tracking-widest">+ Blueprint</Button></Link>
                    <Link href="/marketplace/upload-ebook"><Button className="bg-zinc-900 hover:bg-black text-white rounded-full px-6 font-black uppercase text-[11px] tracking-widest">+ Ebook</Button></Link>
                </div>
            )}
          </div>
        </div>

        <div className="sticky top-[70px] z-30 bg-[#f8f9fc]/95 backdrop-blur-md pt-2 pb-6 mb-4">
          <div className="bg-zinc-100 border border-zinc-200 p-1 rounded-xl shadow-sm inline-flex">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('billing')}
              className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'billing' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
            >
              Billing
            </button>
            {user?.isSeller && (
              <button 
                onClick={() => setActiveTab('seller')}
                className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ml-1 ${activeTab === 'seller' ? 'bg-blue-600 shadow-lg text-white' : 'text-blue-500'}`}
              >
                Seller Hub
              </button>
            )}
          </div>
        </div>

        {/* USER OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ShoppingBag className="w-6 h-6" /></div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Recent Acquisitions</h2>
                </div>
                <div className="space-y-4">
                  {wallet.transactions.filter(t => t.type === 'purchase').slice(0, 3).map(tx => {
                    const projectUrl = tx.metadata?.project_id 
                        ? `/marketplace/project/${tx.metadata.project_id}` 
                        : tx.metadata?.ebook_id
                        ? `/marketplace/ebook/${tx.metadata.ebook_id}`
                        : null;
                        
                    return (
                        <Link 
                            key={tx.id} 
                            href={projectUrl || '#'} 
                            className={`flex items-center justify-between p-5 bg-zinc-50 rounded-3xl border border-zinc-100 hover:border-black transition-all group ${!projectUrl ? 'cursor-default' : ''}`}
                        >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-zinc-100 group-hover:bg-black group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5 text-zinc-900 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                            <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{tx.description.replace('Purchase: ', '')}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {projectUrl && <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black transition-colors" />}
                        </Link>
                    );
                  })}
                  {wallet.transactions.filter(t => t.type === 'purchase').length === 0 && (
                    <p className="text-center py-10 text-slate-400 font-bold italic">No academic acquisitions yet</p>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-[40px] p-10 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Marketplace Credit</p>
                  <p className="text-5xl font-black text-white tracking-tight mb-10">{formatCurrency(wallet.balance)}</p>
                  <Button onClick={() => setShowFundingModal(true)} className="w-full bg-white text-black hover:bg-zinc-100 rounded-2xl py-8 font-black uppercase text-xs tracking-widest shadow-xl">Refill Wallet</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BILLING / WALLET HISTORY */}
        {activeTab === 'billing' && (
          <div className="space-y-8 animate-in fade-in duration-500">
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
          </div>
        )}

        {/* SELLER HUB (ONLY FOR VERIFIED SELLERS) */}
        {user?.isSeller && activeTab === 'seller' && (
          <div className="space-y-10 animate-in fade-in duration-500">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Withdrawable Balance (70%)</p>
                      <p className="text-4xl font-black">{formatCurrency(sellerWallet?.balance || 0)}</p>
                      <Button 
                        onClick={() => setShowPayoutModal(true)}
                        className="mt-8 w-full bg-white text-black hover:bg-zinc-100 rounded-xl py-6 font-black uppercase text-[10px] tracking-widest"
                      >
                        Request Payout
                      </Button>
                  </div>
                  <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Settlement Account</p>
                      {sellerAccount?.bank_name ? (
                        <div className="space-y-1 mt-2">
                           <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{sellerAccount.bank_name}</p>
                           <p className="text-xs font-bold text-slate-500">{sellerAccount.account_number}</p>
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest pt-2">{sellerAccount.account_name}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-slate-400 mt-4 italic">No account added yet</p>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAccountModal(true)}
                        className="mt-6 w-full border-zinc-200 hover:border-black text-zinc-900 rounded-xl py-2 font-black uppercase text-[9px] tracking-widest"
                      >
                        {sellerAccount?.bank_name ? 'Update Account' : 'Add Account Details'}
                      </Button>
                  </div>
                  <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Lifetime Earnings</p>
                      <p className="text-4xl font-black text-slate-900">{formatCurrency(sellerWallet?.total_earned || 0)}</p>
                      <div className="mt-6 flex items-center gap-2 text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-tight">Active Growth</span>
                      </div>
                  </div>
              </div>

              {/* Modals */}
              <PaymentMethodModal 
                open={showAccountModal} 
                onOpenChange={setShowAccountModal} 
                userId={user?.id}
                currentAccount={sellerAccount}
                onSaved={(data) => setSellerAccount(data)}
              />
              <PayoutRequestModal 
                open={showPayoutModal} 
                onOpenChange={setShowPayoutModal} 
                userId={user?.id}
                balance={sellerWallet?.balance || 0}
                onRequested={() => {
                  fetchSellerData();
                  refreshWallet();
                }}
              />

              {/* Upload Action Center */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/marketplace/upload-project" className="group">
                      <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 hover:border-blue-600 hover:shadow-xl transition-all flex items-center justify-between">
                          <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Plus className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="font-black text-slate-900 uppercase tracking-tight">Upload Project</h3>
                                  <p className="text-xs text-slate-500 font-medium">List a new technical blueprint</p>
                              </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                  </Link>
                  <Link href="/marketplace/upload-ebook" className="group">
                      <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 hover:border-zinc-900 hover:shadow-xl transition-all flex items-center justify-between">
                          <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Book className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="font-black text-slate-900 uppercase tracking-tight">Upload Ebook</h3>
                                  <p className="text-xs text-slate-500 font-medium">List an academic digital book</p>
                              </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
                      </div>
                  </Link>
              </div>

              {/* Library List */}
              <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Layers className="w-6 h-6" /></div>
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">My Technical Library</h2>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myItems.map(item => {
                          const image = item.itemType === 'blueprint' ? item.preview_images?.[0] : item.cover_image;
                          const url = item.itemType === 'blueprint' ? `/marketplace/project/${item.id}` : `/marketplace/ebook/${item.id}`;
                          
                          return (
                              <div key={item.id} className="flex items-center justify-between p-6 bg-zinc-50 rounded-[32px] border border-zinc-100 hover:border-blue-400 transition-all group">
                                  <div className="flex items-center gap-5 min-w-0">
                                      <div className={`rounded-2xl overflow-hidden border border-zinc-200 flex-shrink-0 ${item.itemType === 'blueprint' ? 'w-16 h-16' : 'w-12 h-16'}`}>
                                          <img src={image} className="w-full h-full object-cover" alt="" />
                                      </div>
                                      <div className="min-w-0">
                                          <h4 className="font-black text-slate-900 text-sm truncate uppercase">{item.title}</h4>
                                          <div className="flex items-center gap-3 mt-1">
                                              <Badge className={`px-2 py-0 text-[8px] font-black uppercase ${
                                                  item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                                  item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                              }`}>
                                                  {item.status}
                                              </Badge>
                                              <Badge variant="outline" className="px-2 py-0 text-[7px] font-black uppercase border-slate-200">{item.itemType}</Badge>
                                              <span className="text-[10px] font-bold text-slate-400">{item.sales_count} SALES</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <Link href={url}>
                                          <button className="p-3 bg-white text-zinc-900 rounded-xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm border border-zinc-200" title="View Listing">
                                            <Eye className="w-4 h-4 text-inherit" />
                                          </button>
                                      </Link>
                                      <button 
                                        onClick={(e) => { e.preventDefault(); handleDeleteItem(item.id, item.itemType); }}
                                        className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-zinc-200"
                                        title="Delete Listing"
                                      >
                                          <Trash2 className="w-4 h-4 text-inherit" />
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                      {myItems.length === 0 && (
                          <div className="md:col-span-2 py-20 text-center space-y-4">
                              <Landmark className="w-12 h-12 text-zinc-200 mx-auto" />
                              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest italic">You haven't listed any digital assets yet</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
