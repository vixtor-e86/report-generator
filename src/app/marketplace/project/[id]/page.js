"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShoppingBag, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Play, Code2, Star, Heart, Share2,
  Clock, CheckCircle2, ChevronRight, Bookmark,
  FileText, Landmark
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/marketplace/ui/tabs';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ProjectDetailPage({ params }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const { user } = useUser();
  const { wallet, deductFunds } = useWallet();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setProcessing] = useState(false);
  const [activeImage, setActiveTab] = useState(0);

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      try {
        // 1. Fetch project and seller info
        const { data, error } = await supabase
          .from('marketplace_projects')
          .select('*, marketplace_sellers(*)')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);

        // 2. Check if already purchased
        if (user) {
          const { data: purchase } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'purchase')
            .eq('status', 'completed')
            .filter('description', 'ilike', `%${data.title}%`)
            .maybeSingle();

          if (purchase) setIsPurchased(true);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    }
    if (projectId) loadProject();
  }, [projectId, user]);

  const handlePurchase = async () => {
    if (!user) return toast.error("Please login to purchase");
    if (wallet.balance < project.price) {
        return toast.error("Insufficient balance. Please refill your wallet.");
    }

    setProcessing(true);
    try {
      const success = await deductFunds(project.price, `Purchase: ${project.title}`);
      
      if (success) {
        // 1. Calculate Seller Earnings (70%)
        const sellerEarnings = Math.floor(project.price * 0.7);

        // 2. Increment seller wallet balance
        const { data: sellerWallet } = await supabase
            .from('marketplace_seller_wallets')
            .select('balance, total_earned')
            .eq('seller_id', project.seller_id)
            .single();
        
        if (sellerWallet) {
            await supabase
                .from('marketplace_seller_wallets')
                .update({ 
                    balance: sellerWallet.balance + sellerEarnings,
                    total_earned: (sellerWallet.total_earned || 0) + sellerEarnings,
                    updated_at: new Date().toISOString()
                })
                .eq('seller_id', project.seller_id);
        }

        // 3. Notify Seller
        await supabase.from('marketplace_notifications').insert({
            user_id: project.user_id_seller, // Ensure this exists or use seller_id join
            title: 'New Sale!',
            message: `You earned ${formatCurrency(sellerEarnings)} from a sale of "${project.title}".`,
            type: 'success'
        });

        // 4. Increment global sales count
        await supabase.rpc('increment_project_sales', { row_id: project.id });
        
        setIsPurchased(true);
        toast.success("Purchase successful! Download unlocked.");
      } else {
        toast.error("Transaction failed. Try again.");
      }
    } catch (err) {
      toast.error("An error occurred during purchase");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="py-40 text-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto" /></div>;
  if (!project) return <div className="py-40 text-center font-black uppercase tracking-widest text-zinc-400">Project Not Found</div>;

  const sellerName = project.marketplace_sellers ? `${project.marketplace_sellers.first_name} ${project.marketplace_sellers.last_name}` : 'Verified Seller';

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans">
      {/* Header Nav */}
      <div className="bg-white border-b border-[#e5e7eb] sticky top-[70px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6b7280] hover:text-black font-black text-[10px] uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back to market
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left: Images and Technical Previews */}
          <div className="lg:col-span-2 space-y-10">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-video bg-zinc-900 rounded-[40px] overflow-hidden border border-zinc-800 shadow-2xl relative">
                <img 
                  src={project.preview_images?.[activeImage]} 
                  className="w-full h-full object-cover animate-in fade-in duration-700" 
                  alt={project.title} 
                />
                <div className="absolute top-6 left-6">
                   <Badge className="bg-blue-600 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                      Blueprint Preview
                   </Badge>
                </div>
              </div>
              
              <div className="flex gap-4">
                {project.preview_images?.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveTab(i)}
                    className={`w-24 h-20 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-blue-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-zinc-100 border border-[#e5e7eb] p-1 mb-8 rounded-full shadow-inner inline-flex">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Abstract</TabsTrigger>
                <TabsTrigger value="chapter1" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Chapter 1</TabsTrigger>
                {project.code_snippet && (
                    <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm rounded-full text-[#374151] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Code Sample</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm animate-in fade-in duration-500">
                <h3 className="text-xl font-black text-[#111827] mb-6 uppercase tracking-tight">Executive Abstract</h3>
                <div className="prose prose-zinc max-w-none text-zinc-600 font-medium leading-[1.8] text-justify">
                  {project.abstract}
                </div>
              </TabsContent>

              <TabsContent value="chapter1" className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm animate-in fade-in duration-500">
                <h3 className="text-xl font-black text-[#111827] mb-6 uppercase tracking-tight">Chapter 1: Introduction</h3>
                <div className="prose prose-zinc max-w-none text-zinc-600 font-medium leading-[1.8] whitespace-pre-wrap">
                  {project.chapter_1_preview}
                </div>
              </TabsContent>

              <TabsContent value="code" className="bg-zinc-950 border border-zinc-800 rounded-[40px] p-10 shadow-2xl animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Technical Implementation</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Live Snippet</Badge>
                </div>
                <pre className="text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto custom-scrollbar p-4 bg-black/40 rounded-2xl">
                    <code>{project.code_snippet}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Pricing and Action */}
          <div className="space-y-8">
            <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.2em] mb-1">Standard License</p>
                    <h1 className="text-3xl font-black text-[#111827] tracking-tighter leading-tight">{project.title}</h1>
                  </div>
               </div>

               <div className="space-y-6 mb-10">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-[#111827]">{formatCurrency(project.price)}</span>
                    {project.original_price && (
                      <span className="text-lg text-[#9ca3af] line-through font-bold">{formatCurrency(project.original_price)}</span>
                    )}
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Full Documentation Included
                    </div>
                    {project.project_type !== 'documentation' && (
                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> Complete Source Code Access
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Verified Technical Accuracy
                    </div>
                  </div>
               </div>

               {isPurchased ? (
                <div className="space-y-4">
                    <div className="bg-emerald-50 text-emerald-700 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><ShieldCheck className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest">Ownership Verified</p>
                            <p className="text-xs font-medium opacity-80">You have full access to this blueprint.</p>
                        </div>
                    </div>
                    <a href={project.file_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button className="w-full bg-zinc-900 text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95">
                            <Download className="w-5 h-5" /> Download Full Package
                        </Button>
                    </a>
                </div>
               ) : (
                <Button 
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    {purchasing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    Unlock Full Access
                </Button>
               )}
            </div>

            {/* Seller Info */}
            <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl">
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Verified Architect</h3>
               <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-[24px] bg-white/10 border border-white/5 flex items-center justify-center text-white text-xl font-black">
                    {sellerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{sellerName}</p>
                    <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">{project.faculty}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold">DEPARTMENT</span>
                    <span className="text-white font-black">{project.department}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold">ACADEMIC LEVEL</span>
                    <span className="text-white font-black">{project.level} Level</span>
                  </div>
               </div>
               <button className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all">
                  Contact Seller
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
