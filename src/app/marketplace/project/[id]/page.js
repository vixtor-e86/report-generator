"use client";
import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ShoppingBag, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Play, Code2, Star, Heart, Share2,
  Clock, CheckCircle2, ChevronRight, Bookmark,
  FileText, Landmark, X, User, Phone, Mail, Sparkles,
  Wallet, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
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
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { wallet, deductFunds, setShowFundingModal } = useWallet();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setProcessing] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState('overview'); // overview, chapter1, code
  const [sellerUsername, setSellerUsername] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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
          // Check for purchase using project_id in metadata
          const { data: purchase } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'purchase')
            .eq('status', 'completed')
            .contains('metadata', { project_id: projectId })
            .maybeSingle();

          if (purchase) {
            setIsPurchased(true);
          } else {
            // Fallback for older transactions that didn't have project_id in metadata
            const { data: legacyPurchase } = await supabase
              .from('wallet_transactions')
              .select('*')
              .eq('user_id', user.id)
              .eq('type', 'purchase')
              .eq('status', 'completed')
              .filter('description', 'ilike', `%${data.title}%`)
              .maybeSingle();
            
            if (legacyPurchase) setIsPurchased(true);
          }
          
          setUserEmail(user.email || '');
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
    
    if (!user.isSeller && !userEmail) {
        return toast.error("Please enter an email to receive your copy.");
    }
    
    if (wallet.balance < project.price) {
        return toast.error("Insufficient balance. Please refill your wallet.");
    }

    setProcessing(true);
    try {
      // Pass project_id in metadata to avoid collisions
      const success = await deductFunds(
        project.price, 
        `Purchase: ${project.title}`,
        { project_id: project.id }
      );
      
      if (success) {
        // 1. Send Email Copy
        const recipientEmail = user.isSeller ? user.email : userEmail;
        await fetch('/api/marketplace/send-purchase-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: recipientEmail,
                projectTitle: project.title,
                price: project.price,
                downloadUrl: project.file_url
            })
        });

        if (project.seller_id) {
            await fetch('/api/marketplace/complete-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: project.id,
                    itemType: 'blueprint',
                    price: project.price,
                    title: project.title
                })
            });
        }

        await supabase.rpc('increment_project_sales', { row_id: project.id });
        setIsPurchased(true);
        setShowPurchaseModal(false);
        toast.success("Purchase successful! Check your inbox (and spam folder) for the project copy.");
      } else {
        toast.error("Transaction failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during purchase");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-zinc-900 border-t-transparent mx-auto" /></div>;
  if (!project) return <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center font-black uppercase tracking-widest text-zinc-400">Project Not Found</div>;

  const sellerName = project.marketplace_sellers ? `${project.marketplace_sellers.first_name} ${project.marketplace_sellers.last_name}` : 'W3 Hub';
  const isAdminProject = !project.seller_id;

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-black font-black text-[10px] uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back to market
          </button>
          <div className="flex items-center gap-4">
             <button className="p-2 text-zinc-400 hover:text-black transition-colors"><Share2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Left: Images and Technical Previews */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Gallery */}
            <div className="space-y-6">
              <div className="aspect-video bg-zinc-900 rounded-[40px] overflow-hidden border border-zinc-800 shadow-2xl relative">
                <img 
                  src={project.preview_images?.[activeImage]} 
                  className="w-full h-full object-cover animate-in fade-in duration-700" 
                  alt={project.title} 
                />
                <div className="absolute top-6 left-6">
                   <Badge className="bg-zinc-900 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                      Blueprint Preview
                   </Badge>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {project.preview_images?.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveTab(i)}
                    className={`w-24 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === i ? 'border-zinc-900 scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-100 border border-zinc-200 p-1 mb-8 rounded-xl shadow-sm inline-flex">
              <button 
                onClick={() => setActiveDetailTab('overview')}
                className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'overview' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
              >
                Abstract
              </button>
              <button 
                onClick={() => setActiveDetailTab('chapter1')}
                className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'chapter1' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
              >
                Chapter 1
              </button>
              {project.code_snippet && (
                <button 
                  onClick={() => setActiveDetailTab('code')}
                  className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'code' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
                >
                  Code Sample
                </button>
              )}
            </div>

            {activeDetailTab === 'overview' && (
              <div className="bg-white border border-zinc-200 rounded-[40px] p-10 shadow-sm animate-in fade-in duration-500">
                <h3 className="text-xl font-black text-zinc-900 mb-6 uppercase tracking-tight">Abstract</h3>
                <div className="prose prose-zinc max-w-none text-zinc-600 font-medium leading-relaxed h-[400px] overflow-y-auto custom-scrollbar pr-4">
                  <ReactMarkdown>{project.abstract}</ReactMarkdown>
                </div>
              </div>
            )}

            {activeDetailTab === 'chapter1' && (
              <div className="bg-white border border-zinc-200 rounded-[40px] p-10 shadow-sm animate-in fade-in duration-500">
                <h3 className="text-xl font-black text-zinc-900 mb-6 uppercase tracking-tight">Chapter 1</h3>
                <div className="prose prose-zinc max-w-none text-zinc-600 font-medium leading-relaxed h-[500px] overflow-y-auto custom-scrollbar pr-4">
                  <ReactMarkdown>{project.chapter_1_preview}</ReactMarkdown>
                </div>
              </div>
            )}

            {activeDetailTab === 'code' && project.code_snippet && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-10 shadow-2xl animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6 text-white">
                  <h3 className="text-xl font-black uppercase tracking-tight">Code Sample</h3>
                  <Badge className="bg-emerald-500 text-black border-none px-3 py-1 rounded-full text-[10px] font-black uppercase">Live Snippet</Badge>
                </div>
                <div className="h-[400px] overflow-y-auto custom-scrollbar">
                    <pre className="text-xs text-emerald-400 font-mono leading-relaxed p-4 bg-black/40 rounded-2xl">
                        <code>{project.code_snippet}</code>
                    </pre>
                </div>
              </div>
            )}
          </div>

          {/* Right: Pricing and Action */}
          <div className="space-y-8">
            <div className="bg-white border border-zinc-200 rounded-[40px] p-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-zinc-900" />
               <div className="mb-8">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Standard License</p>
                  <h1 className="text-3xl font-black text-zinc-900 tracking-tighter leading-tight">{project.title}</h1>
               </div>

               <div className="space-y-6 mb-10">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-zinc-900">{formatCurrency(project.price)}</span>
                    {project.original_price && (
                      <span className="text-lg text-zinc-400 line-through font-bold">{formatCurrency(project.original_price)}</span>
                    )}
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Documentation
                    </div>
                    {project.project_type !== 'documentation' && (
                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Complete Source Code
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Technical Accuracy Verified
                    </div>
                  </div>
               </div>

               {isPurchased ? (
                <div className="space-y-4">
                    <div className="bg-emerald-50 text-emerald-700 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                        <ShieldCheck className="w-6 h-6" />
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest">Access Unlocked</p>
                            <p className="text-xs font-medium">Download the full package below.</p>
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
                    onClick={() => setShowPurchaseModal(true)}
                    className="w-full bg-zinc-900 hover:bg-black text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Zap className="w-5 h-5" />
                    Unlock Full Access
                </Button>
               )}
            </div>

            {/* Seller Info - Dark Card */}
            <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
               {isAdminProject && (
                  <div className="absolute top-0 right-0 p-4">
                     <Badge className="bg-emerald-500 text-black border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Official W3 Hub</Badge>
                  </div>
               )}
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">
                  {isAdminProject ? 'Master Architect' : 'Verified Seller'}
               </h3>
               <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-[24px] bg-white/10 border border-white/5 flex items-center justify-center text-white text-xl font-black overflow-hidden">
                    {isAdminProject ? (
                        <img src="/favicon.ico" className="w-8 h-8" alt="W3" />
                    ) : (
                        sellerName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{sellerName}</p>
                    <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">{isAdminProject ? 'W3 Hub Engineering' : project.faculty}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold">DEPARTMENT</span>
                    <span className="text-white font-black">{project.department}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold">FACULTY</span>
                    <span className="text-white font-black">{project.faculty}</span>
                  </div>
               </div>
               
               {isAdminProject && (
                  <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                        This project was <b>made, verified, tested and trusted</b> by the W3 HUB team.
                    </p>
                  </div>
               )}

               <button 
                  onClick={() => setShowContactModal(true)}
                  className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all"
               >
                  Contact Seller
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Get Access</h2>
                <button onClick={() => setShowPurchaseModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between">
                    <button 
                        onClick={() => {
                            setShowFundingModal(true);
                            setShowPurchaseModal(false);
                        }}
                        className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-100 shadow-sm"><Wallet className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Wallet Balance</p>
                            <p className="text-zinc-900 font-black">{formatCurrency(wallet.balance)}</p>
                        </div>
                    </button>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Price</p>
                        <p className="text-zinc-900 font-black">{formatCurrency(project.price)}</p>
                    </div>
                </div>

                {!user?.isSeller && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Delivery Email</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl h-14 px-12 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none"
                            />
                            <Mail className="absolute left-4 top-4.5 w-5 h-5 text-zinc-300" />
                        </div>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest ml-1">A copy will be sent here immediately.</p>
                    </div>
                )}

                {wallet.balance < project.price ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Insufficient funds in your wallet.</p>
                        </div>
                        <Button 
                            onClick={() => {
                                setShowFundingModal(true);
                                setShowPurchaseModal(false);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <Zap className="w-4 h-4" /> Fund Wallet Now
                        </Button>
                    </div>
                ) : (
                    <Button 
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="w-full bg-zinc-900 hover:bg-black text-white rounded-2xl py-6 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        {purchasing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : <Download className="w-5 h-5" />}
                        {purchasing ? 'Processing Access...' : 'Confirm & Download'}
                    </Button>
                )}
              </div>
            </div>
            <div className="bg-zinc-50 p-6 text-center border-t border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Secure Technical Exchange Protocol</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Seller Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Contact Seller</h2>
                <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-zinc-400 overflow-hidden">
                    {isAdminProject ? (
                        <img src="/favicon.ico" className="w-6 h-6" alt="W3" />
                    ) : (
                        <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username</p>
                    <p className="text-zinc-900 font-black">{isAdminProject ? 'W3 Hub' : (sellerUsername || sellerName)}</p>
                  </div>
                </div>

                {isPurchased ? (
                  <>
                    {!isAdminProject && (
                        <a href={`https://wa.me/${project.marketplace_sellers?.phone_number?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-emerald-50 rounded-3xl border border-emerald-100 hover:bg-emerald-100 transition-colors group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">WhatsApp</p>
                            <p className="text-zinc-900 font-black">{project.marketplace_sellers?.phone_number}</p>
                        </div>
                        </a>
                    )}

                    <a href={`mailto:${isAdminProject ? 'w3writelab@gmail.com' : project.marketplace_sellers?.email_updates}`} className="flex items-center gap-4 p-4 bg-blue-50 rounded-3xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Email Address</p>
                        <p className="text-zinc-900 font-black">{isAdminProject ? 'w3writelab@gmail.com' : project.marketplace_sellers?.email_updates}</p>
                      </div>
                    </a>
                  </>
                ) : (
                  <div className="p-8 bg-zinc-900 rounded-[32px] text-center space-y-4">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                        <ShieldCheck className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-white font-black text-xs uppercase tracking-widest">Contact Locked</p>
                        <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mt-1 px-4">
                          Seller contact details are only available to verified purchasers for security reasons.
                        </p>
                     </div>
                     <Button 
                       onClick={() => { setShowContactModal(false); setShowPurchaseModal(true); }}
                       className="w-full bg-white text-black hover:bg-zinc-100 rounded-2xl py-5 font-black text-[10px] uppercase tracking-widest shadow-xl"
                     >
                       Unlock Access
                     </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-zinc-50 p-6 text-center border-t border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {isAdminProject ? 'Official W3 Hub Project • Verified & Trusted' : 'Always keep transactions within the platform for your protection.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
