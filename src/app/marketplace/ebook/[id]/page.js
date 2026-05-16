"use client";
import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ShoppingBag, Zap, AlertCircle, Check, 
  Download, RefreshCw, ShieldCheck,
  BookOpen, Star, Share2,
  Clock, CheckCircle2, ChevronRight,
  FileText, Landmark, X, User, Phone, Mail, Sparkles,
  Wallet, ArrowRight, Book
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

export default function EbookDetailPage({ params }) {
  const resolvedParams = use(params);
  const ebookId = resolvedParams.id;
  const router = useRouter();
  const { user } = useUser();
  const { wallet, deductFunds, setShowFundingModal } = useWallet();

  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setProcessing] = useState(false);
  const [sellerUsername, setSellerUsername] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function loadEbook() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_ebooks')
          .select('*, marketplace_sellers(*)')
          .eq('id', ebookId)
          .single();

        if (error) throw error;
        setEbook(data);

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
            .contains('metadata', { ebook_id: ebookId })
            .maybeSingle();

          if (purchase) {
            setIsPurchased(true);
          }
          
          setUserEmail(user.email || '');
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load ebook details");
      } finally {
        setLoading(false);
      }
    }
    if (ebookId) loadEbook();
  }, [ebookId, user]);

  const handlePurchase = async () => {
    if (!user) return toast.error("Please login to purchase");
    
    if (!user.isSeller && !userEmail) {
        return toast.error("Please enter an email to receive your copy.");
    }
    
    if (wallet.balance < ebook.price) {
        return toast.error("Insufficient balance. Please refill your wallet.");
    }

    setProcessing(true);
    try {
      const success = await deductFunds(
        ebook.price, 
        `Purchase: Ebook - ${ebook.title}`,
        { ebook_id: ebook.id }
      );
      
      if (success) {
        // 1. Send Email Copy
        const recipientEmail = user.isSeller ? user.email : userEmail;
        await fetch('/api/marketplace/send-purchase-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: recipientEmail,
                projectTitle: `Ebook: ${ebook.title}`,
                price: ebook.price,
                downloadUrl: ebook.file_url
            })
        });

        const sellerEarnings = Math.floor(ebook.price * 0.8);
        if (ebook.seller_id) {
            const { data: sellerWallet } = await supabase
                .from('marketplace_seller_wallets')
                .select('balance, total_earned')
                .eq('seller_id', ebook.seller_id)
                .single();
            
            if (sellerWallet) {
                await supabase
                    .from('marketplace_seller_wallets')
                    .update({ 
                        balance: sellerWallet.balance + sellerEarnings,
                        total_earned: (sellerWallet.total_earned || 0) + sellerEarnings,
                        updated_at: new Date().toISOString()
                    })
                    .eq('seller_id', ebook.seller_id);
            }

            await supabase.from('marketplace_notifications').insert({
                user_id: ebook.user_id,
                title: 'New Ebook Sale!',
                message: `You earned ${formatCurrency(sellerEarnings)} from a sale of your ebook "${ebook.title}".`,
                type: 'success'
            });
        }

        // We'll update sales count directly if RPC isn't ready
        await supabase
          .from('marketplace_ebooks')
          .update({ sales_count: (ebook.sales_count || 0) + 1 })
          .eq('id', ebook.id);

        setIsPurchased(true);
        setShowPurchaseModal(false);
        toast.success("Purchase successful! Check your inbox for the ebook.");
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
  if (!ebook) return <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center font-black uppercase tracking-widest text-zinc-400">Ebook Not Found</div>;

  const sellerName = ebook.marketplace_sellers ? `${ebook.marketplace_sellers.first_name} ${ebook.marketplace_sellers.last_name}` : 'W3 Official';
  const isOfficial = !ebook.seller_id;

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
          
          {/* Left: Cover and Preview */}
          <div className="lg:col-span-2 space-y-12">
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
               <div className="w-full md:w-64 aspect-[3/4] bg-zinc-900 rounded-[32px] overflow-hidden border border-zinc-800 shadow-2xl flex-shrink-0">
                  <img src={ebook.cover_image} className="w-full h-full object-cover" alt={ebook.title} />
               </div>
               <div className="flex-1 space-y-4">
                  <Badge className="bg-blue-600 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Digital Ebook</Badge>
                  <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-tight">{ebook.title}</h1>
                  <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">BY {sellerName}</p>
                  
                  <div className="flex items-center gap-6 pt-4">
                     <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sales</p>
                        <p className="text-lg font-black text-zinc-900">{ebook.sales_count || 0}</p>
                     </div>
                     <div className="h-8 w-px bg-zinc-200" />
                     <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Format</p>
                        <p className="text-lg font-black text-zinc-900 uppercase">{ebook.file_url.split('.').pop()}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* AI Preview Section */}
            <div className="bg-white border border-zinc-200 rounded-[40px] p-10 shadow-sm animate-in fade-in duration-500">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Structured Preview</h3>
               </div>
               <div className="prose prose-zinc max-w-none text-zinc-600 font-medium leading-relaxed max-h-[800px] overflow-y-auto custom-scrollbar pr-4">
                  <ReactMarkdown>{ebook.preview_content}</ReactMarkdown>
               </div>
            </div>
          </div>

          {/* Right: Action and Info */}
          <div className="space-y-8">
            <div className="bg-white border border-zinc-200 rounded-[40px] p-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
               <div className="mb-8">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Standard License</p>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-tight uppercase">Get Full Version</h3>
               </div>

               <div className="space-y-6 mb-10">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-zinc-900">{formatCurrency(ebook.price)}</span>
                    {ebook.original_price && (
                      <span className="text-lg text-zinc-400 line-through font-bold">{formatCurrency(ebook.original_price)}</span>
                    )}
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant Email Delivery
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Manuscript (Digital)
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Lifetime Updates
                    </div>
                  </div>
               </div>

               {isPurchased ? (
                <div className="space-y-4">
                    <div className="bg-emerald-50 text-emerald-700 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                        <ShieldCheck className="w-6 h-6" />
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest">Access Unlocked</p>
                            <p className="text-xs font-medium">Download the full ebook below.</p>
                        </div>
                    </div>
                    <a href={ebook.file_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button className="w-full bg-zinc-900 text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95">
                            <Download className="w-5 h-5" /> Download Manuscript
                        </Button>
                    </a>
                </div>
               ) : (
                <Button 
                    onClick={() => setShowPurchaseModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <ShoppingBag className="w-5 h-5" />
                    Buy Now
                </Button>
               )}
            </div>

            <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
               {isOfficial && (
                  <div className="absolute top-0 right-0 p-4">
                     <Badge className="bg-blue-500 text-white border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Official W3 Release</Badge>
                  </div>
               )}
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">
                  {isOfficial ? 'Publisher' : 'Verified Author'}
               </h3>
               <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-[24px] bg-white/10 border border-white/5 flex items-center justify-center text-white text-xl font-black overflow-hidden">
                    {isOfficial ? (
                        <img src="/favicon.ico" className="w-8 h-8" alt="W3" />
                    ) : (
                        sellerName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{sellerName}</p>
                    <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">{isOfficial ? 'W3 Editorial Team' : 'Verified Contributor'}</p>
                  </div>
               </div>
               
               <button 
                  onClick={() => setShowContactModal(true)}
                  className="w-full mt-6 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all"
               >
                  Contact {isOfficial ? 'Support' : 'Author'}
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
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Purchase Ebook</h2>
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
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance</p>
                            <p className="text-zinc-900 font-black">{formatCurrency(wallet.balance)}</p>
                        </div>
                    </button>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Price</p>
                        <p className="text-zinc-900 font-black">{formatCurrency(ebook.price)}</p>
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
                    </div>
                )}

                {wallet.balance < ebook.price ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Insufficient funds.</p>
                        </div>
                        <Button 
                            onClick={() => {
                                setShowFundingModal(true);
                                setShowPurchaseModal(false);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <Zap className="w-4 h-4" /> Fund Wallet
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
                        {purchasing ? 'Processing...' : 'Confirm Purchase'}
                    </Button>
                )}
              </div>
            </div>
            <div className="bg-zinc-50 p-6 text-center border-t border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Secure Marketplace Exchange</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Contact {isOfficial ? 'Support' : 'Author'}</h2>
                <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-zinc-400 overflow-hidden">
                    {isOfficial ? <img src="/favicon.ico" className="w-6 h-6" alt="W3" /> : <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name</p>
                    <p className="text-zinc-900 font-black">{isOfficial ? 'W3 Hub' : (sellerUsername || sellerName)}</p>
                  </div>
                </div>

                {isPurchased ? (
                  <>
                    {!isOfficial && (
                        <a href={`https://wa.me/${ebook.marketplace_sellers?.phone_number?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-emerald-50 rounded-3xl border border-emerald-100 hover:bg-emerald-100 transition-colors group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">WhatsApp</p>
                            <p className="text-zinc-900 font-black">{ebook.marketplace_sellers?.phone_number}</p>
                        </div>
                        </a>
                    )}

                    <a href={`mailto:${isOfficial ? 'w3writelab@gmail.com' : ebook.marketplace_sellers?.email_updates}`} className="flex items-center gap-4 p-4 bg-blue-50 rounded-3xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Email Address</p>
                        <p className="text-zinc-900 font-black">{isOfficial ? 'w3writelab@gmail.com' : ebook.marketplace_sellers?.email_updates}</p>
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
                          Author contact details are only available to verified purchasers for security reasons.
                        </p>
                     </div>
                     <Button 
                       onClick={() => { setShowContactModal(false); setShowPurchaseModal(true); }}
                       className="w-full bg-white text-black hover:bg-zinc-100 rounded-2xl py-5 font-black text-[10px] uppercase tracking-widest shadow-xl"
                     >
                       Buy to Unlock
                     </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-zinc-50 p-6 text-center border-t border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {isOfficial ? 'Official W3 Editorial Release' : 'Secure and verified author content.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
