"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShoppingBag, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Play, Code2, Star, Heart, Share2,
  Clock, CheckCircle2, ChevronRight, Bookmark,
  FileText, Landmark, X, User, Phone, Mail, Sparkles
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/marketplace/ui/tabs';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

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
  const [sellerUsername, setSellerUsername] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_projects')
          .select('*, marketplace_sellers(*)')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);

        if (data.marketplace_sellers) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', data.marketplace_sellers.user_id)
            .maybeSingle();
          if (profile) setSellerUsername(profile.username);
        }

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
        const sellerEarnings = Math.floor(project.price * 0.7);
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

        await supabase.from('marketplace_notifications').insert({
            user_id: project.user_id_seller,
            title: 'New Sale!',
            message: `You earned ${formatCurrency(sellerEarnings)} from a sale of "${project.title}".`,
            type: 'success'
        });

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

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" /></div>;
  if (!project) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-black uppercase tracking-widest text-zinc-800">Project Not Found</div>;

  const sellerName = project.marketplace_sellers ? `${project.marketplace_sellers.first_name} ${project.marketplace_sellers.last_name}` : 'W3 Hub';
  const isAdminProject = !project.seller_id;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sticky Navigation */}
      <div className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-3 text-zinc-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to technical market
          </button>
          <div className="flex items-center gap-4">
             <button className="p-3 text-zinc-500 hover:text-white transition-colors"><Share2 className="w-5 h-5" /></button>
             <button className="p-3 text-zinc-500 hover:text-white transition-colors"><Bookmark className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-16">
          
          {/* Left: Images and Technical Previews */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Main Showcase */}
            <div className="space-y-6">
              <div className="aspect-video bg-zinc-900 rounded-[48px] overflow-hidden border border-zinc-800 shadow-3xl relative group">
                <img 
                  src={project.preview_images?.[activeImage]} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  alt={project.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                <div className="absolute top-8 left-8">
                   <Badge className="bg-emerald-500 text-black border-none px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">
                      Blueprint Preview
                   </Badge>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {project.preview_images?.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveTab(i)}
                    className={`w-32 h-24 rounded-3xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === i ? 'border-emerald-500 scale-105 shadow-xl shadow-emerald-500/10' : 'border-zinc-800 opacity-40 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>

            {/* Content Discovery */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1.5 mb-12 rounded-[28px] shadow-2xl inline-flex">
                <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 rounded-[22px] text-zinc-500 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all">Abstract</TabsTrigger>
                <TabsTrigger value="chapter1" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 rounded-[22px] text-zinc-500 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all">Chapter 1</TabsTrigger>
                {project.code_snippet && (
                    <TabsTrigger value="code" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 rounded-[22px] text-zinc-500 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all">Code Sample</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="bg-zinc-900/30 border border-zinc-900 rounded-[56px] p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-8">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">AI Restructured Abstract</h3>
                </div>
                <div className="prose prose-invert prose-emerald max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:text-lg">
                  <ReactMarkdown>{project.abstract}</ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="chapter1" className="bg-zinc-900/30 border border-zinc-900 rounded-[56px] p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-8">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Chapter 01 : Introduction</h3>
                </div>
                <div className="prose prose-invert prose-emerald max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:text-lg">
                  <ReactMarkdown>{project.chapter_1_preview}</ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="code" className="bg-black border border-zinc-900 rounded-[56px] p-12 shadow-3xl animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Technical Implementation</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Live Script Snippet</Badge>
                </div>
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[32px] blur opacity-25" />
                    <pre className="relative text-[13px] text-emerald-400/90 font-mono leading-relaxed overflow-x-auto custom-scrollbar p-8 bg-zinc-950 rounded-[32px] border border-zinc-900">
                        <code>{project.code_snippet}</code>
                    </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Pricing and Core Actions */}
          <div className="space-y-10">
            
            {/* Purchase Hub */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[56px] p-10 shadow-3xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full" />
               
               <div className="mb-10">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Official Blueprint</p>
                  <h1 className="text-3xl font-black text-white tracking-tighter leading-[1.1] mb-6">{project.title}</h1>
                  <div className="flex flex-wrap gap-2">
                     <Badge className="bg-zinc-800 text-zinc-400 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase">{project.level} Level</Badge>
                     <Badge className="bg-zinc-800 text-zinc-400 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase">{project.project_type?.replace('_', ' ')}</Badge>
                  </div>
               </div>

               <div className="space-y-8 mb-10">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-white tracking-tighter">{formatCurrency(project.price)}</span>
                    {project.original_price && (
                      <span className="text-lg text-zinc-600 line-through font-bold mb-1">{formatCurrency(project.original_price)}</span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 group">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800/50 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      Documentation Included
                    </div>
                    {project.project_type !== 'documentation' && (
                        <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 group">
                             <div className="w-8 h-8 rounded-xl bg-zinc-800/50 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                                <Code2 className="w-4 h-4 text-emerald-500" />
                             </div>
                             Complete Source Code
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 group">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800/50 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      Tested Technical Blueprint
                    </div>
                  </div>
               </div>

               {isPurchased ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-emerald-500/5 text-emerald-500 p-8 rounded-[32px] border border-emerald-500/10 text-center">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-4 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Ownership Verified</p>
                        <p className="text-xs font-bold opacity-60">Full Access Unlocked</p>
                    </div>
                    <a href={project.file_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button className="w-full bg-white text-zinc-950 hover:bg-zinc-200 rounded-[28px] py-9 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <Download className="w-5 h-5" /> Download Repository
                        </Button>
                    </a>
                </div>
               ) : (
                <Button 
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-[28px] py-9 font-black text-[11px] uppercase tracking-[0.2em] shadow-3xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all border-none"
                >
                    {purchasing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-zinc-950" />}
                    Inject Into Dashboard
                </Button>
               )}
            </div>

            {/* Seller Hub Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[56px] p-10 shadow-3xl relative overflow-hidden group">
               {isAdminProject && (
                  <div className="absolute top-0 right-0 p-6">
                     <div className="bg-emerald-500 text-black px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">Official Platform</div>
                  </div>
               )}
               
               <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-10">
                  {isAdminProject ? 'Master Architect' : 'Verified Seller'}
               </h3>
               
               <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 rounded-[32px] bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-2xl font-black overflow-hidden group-hover:border-emerald-500/30 transition-colors">
                    {isAdminProject ? (
                        <img src="/favicon.ico" className="w-10 h-10" alt="W3" />
                    ) : (
                        <span className="opacity-40">{sellerName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-black text-xl tracking-tight leading-tight mb-1">{sellerName}</p>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{isAdminProject ? 'W3 Hub Core' : project.faculty}</p>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Department</span>
                    <span className="text-zinc-300 font-black text-xs">{project.department}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Faculty</span>
                    <span className="text-zinc-300 font-black text-xs">{project.faculty}</span>
                  </div>
               </div>
               
               {isAdminProject && (
                  <div className="mt-10 p-6 bg-zinc-950/50 rounded-[32px] border border-zinc-800">
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        This blueprint has been <span className="text-emerald-500 font-black">Verified & Tested</span> by the W3 HUB engineering team. Quality is guaranteed.
                    </p>
                  </div>
               )}

               <button 
                  onClick={() => setShowContactModal(true)}
                  className="w-full mt-10 py-6 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl"
               >
                  Contact Architect
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Architect Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[56px] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500">
            <div className="p-12">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Direct Contact</h2>
                <button onClick={() => setShowContactModal(false)} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6 p-6 bg-zinc-950/50 rounded-[32px] border border-zinc-800">
                  <div className="w-16 h-16 bg-zinc-800 rounded-[24px] flex items-center justify-center text-zinc-500 overflow-hidden">
                    {isAdminProject ? (
                        <img src="/favicon.ico" className="w-8 h-8" alt="W3" />
                    ) : (
                        <User className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Architect</p>
                    <p className="text-white font-black text-lg">{isAdminProject ? 'W3 Hub' : (sellerUsername || sellerName)}</p>
                  </div>
                </div>

                {!isAdminProject && (
                    <a href={`https://wa.me/${project.marketplace_sellers?.phone_number?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 p-6 bg-zinc-950 hover:bg-emerald-500/5 rounded-[32px] border border-zinc-800 hover:border-emerald-500/20 transition-all group">
                    <div className="w-16 h-16 bg-zinc-800 rounded-[24px] flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-2xl">
                        <Phone className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">WhatsApp Channel</p>
                        <p className="text-white font-black text-lg">{project.marketplace_sellers?.phone_number}</p>
                    </div>
                    </a>
                )}

                <a href={`mailto:${isAdminProject ? 'w3writelab@gmail.com' : project.marketplace_sellers?.email_updates}`} className="flex items-center gap-6 p-6 bg-zinc-950 hover:bg-emerald-500/5 rounded-[32px] border border-zinc-800 hover:border-emerald-500/20 transition-all group">
                  <div className="w-16 h-16 bg-zinc-800 rounded-[24px] flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-2xl">
                    <Mail className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Electronic Mail</p>
                    <p className="text-white font-black text-lg truncate max-w-[200px]">{isAdminProject ? 'w3writelab@gmail.com' : project.marketplace_sellers?.email_updates}</p>
                  </div>
                </a>
              </div>
            </div>
            <div className="bg-zinc-950/80 p-8 text-center border-t border-zinc-800/50">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                {isAdminProject ? 'Official W3 Hub Project • Enterprise Grade' : 'Secure Technical Exchange Protocol'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
