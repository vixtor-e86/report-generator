"use client";
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShoppingBag, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Play, Code2, Star, Heart, Share2,
  Clock, CheckCircle2, ChevronRight, Bookmark,
  FileText, Landmark, X, User, Phone, Mail, Sparkles,
  Wallet, ArrowRight, Book
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function MarketItemDetail({ itemId, itemType, onBack }) {
  const { user } = useUser();
  const { wallet, deductFunds, setShowFundingModal } = useWallet();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setProcessing] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [sellerUsername, setSellerUsername] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      try {
        const table = itemType === 'blueprint' ? 'marketplace_projects' : 'marketplace_ebooks';
        const { data, error } = await supabase
          .from(table)
          .select('*, marketplace_sellers(*)')
          .eq('id', itemId)
          .single();

        if (error) throw error;
        setItem(data);

        if (data.marketplace_sellers) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', data.marketplace_sellers.user_id)
            .maybeSingle();
          if (profile) setSellerUsername(profile.username);
        }

        if (user) {
          const metadataKey = itemType === 'blueprint' ? 'project_id' : 'ebook_id';
          const { data: purchase } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'purchase')
            .eq('status', 'completed')
            .contains('metadata', { [metadataKey]: itemId })
            .maybeSingle();

          if (purchase) {
            setIsPurchased(true);
          } else if (itemType === 'blueprint') {
            // Legacy check for blueprints
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
        toast.error(`Failed to load ${itemType} details`);
      } finally {
        setLoading(false);
      }
    }
    if (itemId) loadItem();
  }, [itemId, itemType, user]);

  const handlePurchase = async () => {
    if (!user) return toast.error("Please login to purchase");
    
    if (!user.isSeller && !userEmail) {
        return toast.error("Please enter an email to receive your copy.");
    }
    
    if (wallet.balance < item.price) {
        return toast.error("Insufficient balance. Please refill your wallet.");
    }

    setProcessing(true);
    try {
      const metadataKey = itemType === 'blueprint' ? 'project_id' : 'ebook_id';
      const success = await deductFunds(
        item.price, 
        `Purchase: ${itemType === 'blueprint' ? '' : 'Ebook - '}${item.title}`,
        { [metadataKey]: item.id }
      );
      
      if (success) {
        const recipientEmail = user.isSeller ? user.email : userEmail;
        await fetch('/api/marketplace/send-purchase-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: recipientEmail,
                projectTitle: itemType === 'blueprint' ? item.title : `Ebook: ${item.title}`,
                price: item.price,
                downloadUrl: item.file_url
            })
        });

        const commission = itemType === 'blueprint' ? 0.7 : 0.9;
        const sellerEarnings = Math.floor(item.price * commission);
        
        if (item.seller_id) {
            const { data: sellerWallet } = await supabase
                .from('marketplace_seller_wallets')
                .select('balance, total_earned')
                .eq('seller_id', item.seller_id)
                .single();
            
            if (sellerWallet) {
                await supabase
                    .from('marketplace_seller_wallets')
                    .update({ 
                        balance: sellerWallet.balance + sellerEarnings,
                        total_earned: (sellerWallet.total_earned || 0) + sellerEarnings,
                        updated_at: new Date().toISOString()
                    })
                    .eq('seller_id', item.seller_id);
            }

            const sellerUserId = item.marketplace_sellers?.user_id || item.user_id;
            await supabase.from('marketplace_notifications').insert({
                user_id: sellerUserId,
                title: 'New Sale!',
                message: `You earned ${formatCurrency(sellerEarnings)} from a sale of "${item.title}".`,
                type: 'success'
            });
        }

        if (itemType === 'blueprint') {
            await supabase.rpc('increment_project_sales', { row_id: item.id });
        } else {
            await supabase
              .from('marketplace_ebooks')
              .update({ sales_count: (item.sales_count || 0) + 1 })
              .eq('id', item.id);
        }

        setIsPurchased(true);
        setShowPurchaseModal(false);
        toast.success("Purchase successful! Check your inbox for the copy.");
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

  if (loading) return <div className="h-full flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-zinc-900 border-t-transparent mx-auto" /></div>;
  if (!item) return <div className="h-full flex items-center justify-center py-20 font-black uppercase tracking-widest text-zinc-400">Item Not Found</div>;

  const sellerName = item.marketplace_sellers ? `${item.marketplace_sellers.first_name} ${item.marketplace_sellers.last_name}` : 'W3 Hub';
  const isAdminItem = !item.seller_id;
  const image = itemType === 'blueprint' ? item.preview_images?.[activeImage] : item.cover_image;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-black font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back to market
        </button>
        <div className="flex items-center gap-4">
           <button className="p-2 text-zinc-400 hover:text-black transition-colors"><Share2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left: Images and Previews */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <div className={`bg-zinc-900 rounded-[40px] overflow-hidden border border-zinc-800 shadow-2xl relative ${itemType === 'blueprint' ? 'aspect-video' : 'h-[500px] max-w-sm mx-auto'}`}>
              <img 
                src={image} 
                className="w-full h-full object-cover animate-in fade-in duration-700" 
                alt={item.title} 
              />
              <div className="absolute top-6 left-6">
                 <Badge className="bg-zinc-900 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    {itemType === 'blueprint' ? 'Blueprint Preview' : 'Digital Ebook'}
                 </Badge>
              </div>
            </div>
            
            {itemType === 'blueprint' && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {item.preview_images?.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    className={`w-24 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === i ? 'border-zinc-900 scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-100 border border-zinc-200 p-1 mb-8 rounded-xl shadow-sm inline-flex">
            <button 
              onClick={() => setActiveDetailTab('overview')}
              className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'overview' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
            >
              {itemType === 'blueprint' ? 'Abstract' : 'Overview'}
            </button>
            {itemType === 'blueprint' && (
              <>
                <button 
                  onClick={() => setActiveDetailTab('chapter1')}
                  className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'chapter1' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
                >
                  Chapter 1
                </button>
                {item.code_snippet && (
                  <button 
                    onClick={() => setActiveDetailTab('code')}
                    className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'code' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
                  >
                    Code Sample
                  </button>
                )}
              </>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-[40px] p-10 shadow-sm">
            {activeDetailTab === 'overview' && (
              <div className="animate-in fade-in duration-500">
                <h3 className="text-xl font-black text-zinc-900 mb-6 uppercase tracking-tight">{itemType === 'blueprint' ? 'Abstract' : 'Description'}</h3>
                <div className="prose prose-zinc max-w-none text-zinc-600 font-medium leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                  <ReactMarkdown>{itemType === 'blueprint' ? item.abstract : item.description}</ReactMarkdown>
                </div>
              </div>
            )}

            {activeDetailTab === 'chapter1' && (
              <div className="animate-in fade-in duration-500">
                <h3 className="text-xl font-black text-zinc-900 mb-6 uppercase tracking-tight">Chapter 1 Preview</h3>
                <div className="prose prose-zinc max-w-none text-zinc-600 font-medium leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                  <ReactMarkdown>{item.chapter_1_preview}</ReactMarkdown>
                </div>
              </div>
            )}

            {activeDetailTab === 'code' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight">Code Snippet</h3>
                  <Badge className="bg-emerald-500 text-black border-none px-3 py-1 rounded-full text-[10px] font-black uppercase">Technical Sample</Badge>
                </div>
                <div className="bg-zinc-900 p-8 rounded-3xl overflow-x-auto">
                    <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                        <code>{item.code_snippet}</code>
                    </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pricing and Action */}
        <div className="space-y-8">
          <div className="bg-white border border-zinc-200 rounded-[40px] p-8 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-zinc-900" />
             <div className="mb-8">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{itemType === 'blueprint' ? 'Standard License' : 'Digital Edition'}</p>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tighter leading-tight">{item.title}</h1>
             </div>

             <div className="space-y-6 mb-10">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-zinc-900">{formatCurrency(item.price)}</span>
                  {item.original_price && (
                    <span className="text-lg text-zinc-400 line-through font-bold">{formatCurrency(item.original_price)}</span>
                  )}
                </div>
                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {itemType === 'blueprint' ? 'Full Documentation' : 'Complete Digital Copy'}
                  </div>
                  {itemType === 'blueprint' && item.project_type !== 'documentation' && (
                      <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Source Code Included
                      </div>
                  )}
                  <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Quality
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
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button className="w-full bg-zinc-900 text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95">
                          <Download className="w-5 h-5" /> Download Now
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

          <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
             {isAdminItem && (
                <div className="absolute top-0 right-0 p-4">
                   <Badge className="bg-emerald-500 text-black border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Official W3 Hub</Badge>
                </div>
             )}
             <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">
                {isAdminItem ? 'Master Architect' : 'Verified Seller'}
             </h3>
             <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 rounded-[24px] bg-white/10 border border-white/5 flex items-center justify-center text-white text-xl font-black overflow-hidden">
                  {isAdminItem ? (
                      <img src="/favicon.ico" className="w-8 h-8" alt="W3" />
                  ) : (
                      sellerName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">{sellerName}</p>
                  <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">{isAdminItem ? 'W3 Hub Engineering' : item.faculty || item.category}</p>
                </div>
             </div>
             
             <button 
                onClick={() => setShowContactModal(true)}
                className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all"
             >
                Contact {isAdminItem ? 'W3 Hub' : 'Seller'}
             </button>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Confirm Access</h2>
                <button onClick={() => setShowPurchaseModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance</p>
                        <p className="text-zinc-900 font-black">{formatCurrency(wallet.balance)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Price</p>
                        <p className="text-zinc-900 font-black">{formatCurrency(item.price)}</p>
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

                {wallet.balance < item.price ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Insufficient balance</p>
                        </div>
                        <Button 
                            onClick={() => {
                                setShowFundingModal(true);
                                setShowPurchaseModal(false);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
                        >
                            <Zap className="w-4 h-4" /> Fund Wallet
                        </Button>
                    </div>
                ) : (
                    <Button 
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="w-full bg-zinc-900 hover:bg-black text-white rounded-2xl py-6 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
                    >
                        {purchasing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : <Download className="w-5 h-5" />}
                        {purchasing ? 'Processing...' : 'Confirm & Download'}
                    </Button>
                )}
              </div>
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
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Contact Seller</h2>
                <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                {isPurchased ? (
                  <>
                    {!isAdminItem && (
                        <a href={`https://wa.me/${item.marketplace_sellers?.phone_number?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-emerald-50 rounded-3xl border border-emerald-100 hover:bg-emerald-100 transition-colors group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">WhatsApp</p>
                            <p className="text-zinc-900 font-black">{item.marketplace_sellers?.phone_number}</p>
                        </div>
                        </a>
                    )}

                    <a href={`mailto:${isAdminItem ? 'w3writelab@gmail.com' : item.marketplace_sellers?.email_updates}`} className="flex items-center gap-4 p-4 bg-blue-50 rounded-3xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Email Address</p>
                        <p className="text-zinc-900 font-black">{isAdminItem ? 'w3writelab@gmail.com' : item.marketplace_sellers?.email_updates}</p>
                      </div>
                    </a>
                  </>
                ) : (
                  <div className="p-8 bg-zinc-900 rounded-[32px] text-center space-y-4">
                     <ShieldCheck className="w-12 h-12 text-zinc-400 mx-auto" />
                     <div>
                        <p className="text-white font-black text-xs uppercase tracking-widest">Contact Locked</p>
                        <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mt-1">
                          Purchase this item to unlock the seller's verified contact details.
                        </p>
                     </div>
                     <Button 
                       onClick={() => { setShowContactModal(false); setShowPurchaseModal(true); }}
                       className="w-full bg-white text-black rounded-2xl py-5 font-black text-[10px] uppercase tracking-widest shadow-xl"
                     >
                       Unlock Access
                     </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
