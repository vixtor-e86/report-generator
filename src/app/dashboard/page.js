"use client";
if (typeof window === 'undefined' && typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  };
}
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PRICING } from '@/lib/pricing';
import { ShoppingBag } from 'lucide-react';
import ReferralFAB from '@/components/ReferralFAB';
import FeedbackWidget from '@/components/FeedbackWidget';
import CustomModal from '@/components/premium/modals/CustomModal';
import { academicTools, toolCategories } from '@/data/marketplace/tools';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/marketplace/ui/dropdown-menu';
import { 
  Search, Grid3X3, List, Star, ChevronDown, SlidersHorizontal, 
  ArrowRight, ArrowLeft, Sparkles, Layers, CheckCircle2, Wrench, ShieldCheck, 
  BookOpen, Presentation, BarChart3, Code2, Lightbulb, RefreshCw, 
  SpellCheck, Quote, Image as ImageIcon, Zap, Check, Wallet, Bell, AlertCircle,
  UserCheck, Landmark, Clock, Phone, Mail, Book, TrendingUp, Plus, Eye, Trash2, Activity, Palette, ClipboardList, X
} from 'lucide-react';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { Button } from '@/components/marketplace/ui/button';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { PaymentMethodModal, PayoutRequestModal } from '@/components/marketplace/PayoutModals';
import SellerAccreditationForm from '@/components/marketplace/SellerAccreditationForm';
import ProjectUploadForm from '@/components/marketplace/ProjectUploadForm';
import EbookUploadForm from '@/components/marketplace/EbookUploadForm';
import MarketItemDetail from '@/components/marketplace/MarketItemDetail';
import ManualPaymentModal from '@/components/ManualPaymentModal';
import ReactMarkdown from 'react-markdown';
import { getToolById } from '@/data/marketplace/tools';

// Modular Tool Components
import ReferenceFinder from '@/components/marketplace/tools/ReferenceFinder';
import SlideGenerator from '@/components/marketplace/tools/SlideGenerator';
import AIHumanizer from '@/components/marketplace/tools/AIHumanizer';
import VisualStudio from '@/components/marketplace/tools/VisualStudio';
import ProjectFinder from '@/components/marketplace/tools/ProjectFinder';
import CodeExplainer from '@/components/marketplace/tools/CodeExplainer';
import LanguageConverter from '@/components/marketplace/tools/LanguageConverter';
import DataAnalysis from '@/components/marketplace/tools/DataAnalysis';
import PlagiarismChecker from '@/components/marketplace/tools/PlagiarismChecker';
import QuestionnaireGenerator from '@/components/marketplace/tools/QuestionnaireGenerator';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const iconMap = {
  ShieldCheck,
  UserCheck: ShieldCheck,
  Presentation,
  BookOpen,
  Search,
  Lightbulb,
  BarChart3,
  SpellCheck,
  Quote,
  Image: ImageIcon,
  Code2,
  RefreshCw,
};

function MarketCard({ item, viewMode, onView }) {
  const sellerName = item.marketplace_sellers 
    ? `${item.marketplace_sellers.first_name} ${item.marketplace_sellers.last_name}` 
    : 'Verified Seller';

  const image = item.itemType === 'blueprint' ? item.preview_images?.[0] : item.cover_image;
  const tag = item.itemType === 'blueprint' ? item.faculty : item.category;

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onView(item)} 
        className="group bg-white border border-[#e5e7eb] p-4 rounded-3xl hover:border-indigo-600 hover:shadow-xl transition-all flex items-center gap-6 cursor-pointer"
      >
        <div className={`rounded-2xl overflow-hidden flex-shrink-0 ${item.itemType === 'blueprint' ? 'w-32 h-24' : 'w-20 h-28 border border-zinc-100'}`}>
          <img src={image} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${item.itemType === 'blueprint' ? 'text-indigo-600' : 'text-slate-600'}`}>{tag}</span>
          </div>
          <h3 className="font-black text-slate-900 truncate text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.title}</h3>
          <p className="text-xs text-slate-500 font-medium">By {sellerName}</p>
        </div>
        <div className="text-right pr-4">
          <div className="text-xl font-black text-slate-900">{formatCurrency(item.price)}</div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Academic Blueprint</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onView(item)} 
      className="flex flex-col bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500 relative group cursor-pointer"
    >
      <div className={`relative overflow-hidden p-2 ${item.itemType === 'blueprint' ? 'h-52' : 'h-64'}`}>
        <img
          src={image}
          alt={item.title}
          className="w-full h-full object-cover rounded-[24px] transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 bg-white border border-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg`}>
            {tag}
          </span>
        </div>
        {item.itemType === 'ebook' && (
             <div className="absolute top-4 right-4">
                <Badge className="bg-zinc-900 text-white border-none text-[8px] px-2 font-black">EBOOK</Badge>
             </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-slate-900 font-black mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
            {item.title}
          </h3>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-4">
            BY {sellerName}
          </p>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
          <span className="text-[#111827] font-black text-lg">
            {formatCurrency(item.price)}
          </span>
          <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center group-hover:bg-indigo-600 transition-all shadow-lg active:scale-90">
             <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { 
    user: authUser, 
    profile: globalProfile, 
    loading: contextLoading, 
    notifications, 
    unreadCount, 
    markNotificationsAsRead,
    refreshUser 
  } = useUser();
  const [projects, setProjects] = useState([]);

  const [standardProjects, setStandardProjects] = useState([]);
  const [premiumProjects, setPremiumProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [pendingStandardPayment, setPendingStandardPayment] = useState(null);
  const [pendingPremiumPayment, setPendingPremiumPayment] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [paymentTier, setPaymentTier] = useState(null);
  // Navigation State
  const [activeTab, setActiveTab] = useState('projects'); // projects, market, tools, seller
  const { wallet, deductFunds, refreshWallet, setShowFundingModal } = useWallet();
  const router = useRouter();

  // Tool Launch State
  const [selectedToolId, setSelectedToolId] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isToolProcessing, setIsToolProcessing] = useState(false);
  const [toolHasPaid, setToolHasPaid] = useState(false);
  const [showToolPaymentDialog, setShowToolPaymentDialog] = useState(false);
  const [pendingToolIterative, setPendingToolIterative] = useState(false);
  const [toolCustomPrice, setToolCustomPrice] = useState(null);

  const handleLaunchTool = (id) => {
    const found = getToolById(id);
    if (found) {
      setSelectedTool(found);
      setSelectedToolId(id);
      setToolHasPaid(false);
      setToolCustomPrice(null);
      setIsToolProcessing(false);
    }
  };

  const activeToolPrice = toolCustomPrice !== null ? toolCustomPrice : 
                        (selectedToolId === 'reference-finder' ? 200 : (selectedTool?.pricePerUse || 0));

  const handleToolPayment = async () => {
    if (!selectedTool) return;
    if (wallet.balance < activeToolPrice) return toast.error('Insufficient balance.');

    const label = selectedToolId === 'reference-finder' ? `DeepSearch: ${selectedTool.name}` : 
                  selectedToolId === 'diagram-studio' ? `Visual Studio Generation` :
                  selectedToolId === 'plagiarism-checker' ? `Integrity Scan` :
                  `Tool: ${selectedTool.name}`;
    
    const success = await deductFunds(activeToolPrice, label);
    if (success) {
      setToolHasPaid(true);
      setShowToolPaymentDialog(false);
      toast.success('Payment successful!');
    }
  };

  // Shared props for tool components
  const toolProps = {
    isProcessing: isToolProcessing,
    setIsProcessing: setIsToolProcessing,
    hasPaid: toolHasPaid,
    setHasPaid: setToolHasPaid,
    setShowPaymentDialog: setShowToolPaymentDialog,
    setPendingIterative: setPendingToolIterative, 
    pendingIterative: pendingToolIterative,
    setCustomPrice: setToolCustomPrice
  };

  // Accreditation flow state
  const [showAccreditation, setShowAccreditation] = useState(false);
  const [showUploadProject, setShowUploadProject] = useState(false);
  const [showUploadEbook, setShowUploadEbook] = useState(false);

  // DERIVED ADMIN STATUS
  const isAdmin = globalProfile?.role === 'admin';

  // --- BROWSER HISTORY MANAGEMENT ---
  useEffect(() => {
    const handlePopState = (e) => {
      if (showAccreditation || showUploadProject || showUploadEbook || selectedToolId) {
        // Intercept back button to close sub-views
        setShowAccreditation(false);
        setShowUploadProject(false);
        setShowUploadEbook(false);
        setSelectedToolId(null);
        // We don't need to go back in history because we already "consumed" the state
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Push a dummy state when any internal view is opened
    const isAnyViewOpen = showAccreditation || showUploadProject || showUploadEbook || !!selectedToolId;
    if (isAnyViewOpen) {
        window.history.pushState({ internalView: true }, '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [showAccreditation, showUploadProject, showUploadEbook, selectedToolId]);

  // Market State
  const [marketItems, setMarketItems] = useState([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketSearch, setMarketSearch] = useState('');
  const [marketType, setMarketType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMarketItem, setSelectedMarketItem] = useState(null);

  // Tools State
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategory, setToolCategory] = useState('all');

  // Seller Hub Internal State
  const [sellerWallet, setSellerWallet] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [sellerAccount, setSellerAccount] = useState(null);

  useEffect(() => {
    if (activeTab === 'market') fetchMarketItems();
    if (activeTab === 'seller') fetchSellerData();
  }, [activeTab, marketType]);

  const fetchSellerData = useCallback(async () => {
    if (!globalProfile?.is_seller) return;
    setLoadingSeller(true);
    try {
      // 1. Wallet
      const { data: sWallet } = await supabase.from('marketplace_seller_wallets').select('*').eq('user_id', authUser.id).single();
      setSellerWallet(sWallet);

      // 2. Bank
      const { data: sAccount } = await supabase.from('marketplace_sellers').select('bank_name, account_number, account_name').eq('user_id', authUser.id).single();
      setSellerAccount(sAccount);

      // 3. Library
      const [projectsRes, ebooksRes] = await Promise.all([
        supabase.from('marketplace_projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
        supabase.from('marketplace_ebooks').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false })
      ]);
      const combined = [
        ...(projectsRes.data || []).map(i => ({ ...i, itemType: 'blueprint' })),
        ...(ebooksRes.data || []).map(i => ({ ...i, itemType: 'ebook' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMyItems(combined);
    } catch (err) { console.error(err); } finally { setLoadingSeller(false); }
  }, [authUser, globalProfile]);

  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteItem = async (id, type) => {
    setItemToDelete({ id, type });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;
    try {
      const res = await fetch(`/api/marketplace/delete?id=${id}&type=${type}&userId=${authUser.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success('Listing deleted successfully');
      setMyItems(prev => prev.filter(item => item.id !== id));
      setItemToDelete(null);
    } catch (err) { 
      toast.error(err.message);
      setItemToDelete(null);
    }
  };

  async function fetchMarketItems() {
    setMarketLoading(true);
    try {
      const fetchBlueprints = async () => {
        const { data } = await supabase
          .from('marketplace_projects')
          .select('*, marketplace_sellers(first_name, last_name)')
          .eq('status', 'active');
        return (data || []).map(item => ({ ...item, itemType: 'blueprint' }));
      };

      const fetchEbooks = async () => {
        const { data } = await supabase
          .from('marketplace_ebooks')
          .select('*, marketplace_sellers(first_name, last_name)')
          .eq('status', 'active');
        return (data || []).map(item => ({ ...item, itemType: 'ebook' }));
      };

      let combined = [];
      if (marketType === 'all') {
        const [blueprints, ebooks] = await Promise.all([fetchBlueprints(), fetchEbooks()]);
        combined = [...blueprints, ...ebooks];
      } else if (marketType === 'blueprints') {
        combined = await fetchBlueprints();
      } else {
        combined = await fetchEbooks();
      }

      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMarketItems(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setMarketLoading(false);
    }
  }

  // Notification Modal State
  const [notification, setNotification] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Continue',
    cancelText: 'Cancel'
  });

  const showNotification = (title, message, type = 'info', onConfirm = null, onCancel = null, confirmText = 'Continue', cancelText = 'Cancel') => {
    setNotification({ isOpen: true, title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };

  // Seller Intro Modal State
  const [showSellerIntro, setShowSellerIntro] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      if (contextLoading) return;
      if (!authUser) {
        router.push('/');
        return;
      }

      if (!globalProfile) {
        // Only redirect if we are SURE there's no profile
        const { data: checkProf } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', authUser.id)
            .single();
        if (!checkProf) {
            router.push('/onboarding');
            return;
        }
      }

      try {
        const { data: userProjects } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const { data: userStandardProjects } = await supabase
          .from('standard_projects')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const { data: userPremiumProjects } = await supabase
          .from('premium_projects')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        // Check for unused payments (Standard)
        const { data: unusedStandard } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('status', 'paid')
          .eq('tier', 'standard')
          .eq('amount', PRICING.STANDARD)
          .is('project_id', null)
          .not('paystack_reference', 'ilike', '%UNLOCK%')
          .not('paystack_reference', 'ilike', '%FUND%')
          .order('paid_at', { ascending: false })
          .limit(1);

        if (unusedStandard && unusedStandard.length > 0) {
          setPendingStandardPayment(unusedStandard[0]);
        }

        // Check for unused payments (Premium)
        const { data: unusedPremium } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('status', 'paid')
          .eq('tier', 'premium')
          .eq('amount', PRICING.PREMIUM)
          .is('project_id', null)
          .not('paystack_reference', 'ilike', '%UNLOCK%')
          .not('paystack_reference', 'ilike', '%FUND%')
          .order('paid_at', { ascending: false })
          .limit(1);

        if (unusedPremium && unusedPremium.length > 0) {
          setPendingPremiumPayment(unusedPremium[0]);
        }

        setProjects((userProjects || []).map(p => ({ ...p, tier: p.tier || 'free' })));
        setStandardProjects(userStandardProjects || []);
        setPremiumProjects(userPremiumProjects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [authUser, globalProfile, contextLoading, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreateFree = () => {
    if (!isAdmin) {
      const freeProjects = projects.filter(p => p.tier === 'free');
      if (freeProjects.length >= 1) {
        showNotification('Limit Reached', 'You have already used your 1 free project. Upgrade to Standard or Premium to create more.', 'warning');
        return;
      }
    }
    router.push('/project/template-select');
  };

  const handleCreateStandard = async () => {
    if (isAdmin) {
      router.push('/template-select');
      return;
    }

    if (pendingStandardPayment) {
      showNotification(
        'Existing Payment Found',
        'You have an unused Standard payment. Would you like to use it or pay for a new one?',
        'confirm',
        () => router.push('/template-select'),
        () => {
          setPaymentTier('standard');
          setShowManualPayment(true);
        },
        'Use Existing',
        'Pay for New'
      );
      return;
    }

    setPaymentTier('standard');
    setShowManualPayment(true);
  };

  const handleCreatePremium = async () => {
    if (isAdmin) {
      router.push('/premium/template-selection');
      return;
    }

    if (pendingPremiumPayment) {
      showNotification(
        'Existing Premium Payment',
        'You have an unused Premium payment. Would you like to use it or pay for a new one?',
        'confirm',
        () => router.push('/premium/template-selection'),
        () => {
          setPaymentTier('premium');
          setShowManualPayment(true);
        },
        'Use Existing',
        'Pay for New'
      );
      return;
    }

    setPaymentTier('premium');
    setShowManualPayment(true);
  };

  const allProjects = [...projects, ...standardProjects, ...premiumProjects];
  const totalReports = allProjects.length;
  const completedReports = allProjects.filter(p => p.status === 'completed').length;
  const inProgressReports = allProjects.filter(p => p.status === 'in_progress').length;
  const hasFreeProject = projects.some(p => p.tier === 'free');

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 rounded-full border-t-indigo-600 animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8" />
              <span className="hidden lg:inline-block text-xl font-bold text-slate-900 tracking-tight">W3 WriteLab</span>
            </Link>
            
            <div className="flex-1 flex items-center justify-center min-w-0">
               <div className="flex items-center gap-1 sm:gap-4 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth px-6 max-w-full">

                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`whitespace-nowrap text-[10px] sm:text-sm font-black uppercase tracking-widest transition-colors py-4 ${activeTab === 'projects' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Blueprints
                </button>
                <button 
                  onClick={() => setActiveTab('market')}
                  className={`whitespace-nowrap text-[10px] sm:text-sm font-black uppercase tracking-widest transition-colors py-4 ${activeTab === 'market' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Market
                </button>
                <button 
                  onClick={() => setActiveTab('tools')}
                  className={`whitespace-nowrap text-[10px] sm:text-sm font-black uppercase tracking-widest transition-colors py-4 ${activeTab === 'tools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Tools
                </button>

                {authUser?.isSeller && (
                  <button 
                    onClick={() => setActiveTab('seller')}
                    className={`whitespace-nowrap text-[10px] sm:text-sm font-black uppercase tracking-widest transition-colors py-4 ${activeTab === 'seller' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Seller Hub
                  </button>
                )}
               </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Notifications */}
              <DropdownMenu onOpenChange={(open) => open && markNotificationsAsRead()}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-[#6b7280] hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all shrink-0"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-white border-slate-200 rounded-2xl shadow-2xl p-0 overflow-hidden z-[100]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Notifications</h3>
                    {unreadCount > 0 && <span className="text-[10px] font-bold text-indigo-600">New Alerts</span>}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              notif.type === 'success' ? 'bg-emerald-500' :
                              notif.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
                            }`} />
                            <div>
                              <p className="text-sm font-black text-slate-900 leading-tight mb-1">{notif.title}</p>
                              <p className="text-xs font-medium text-slate-500 leading-relaxed">{notif.message}</p>
                              <p className="text-[9px] font-black text-slate-300 uppercase mt-2">{new Date(notif.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden md:flex items-center gap-4">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-black transition-all shadow-lg border border-indigo-500"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                
                <div className="h-6 w-px bg-slate-200"></div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-semibold text-slate-900 leading-none">{globalProfile?.username || 'Student'}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{isAdmin ? 'Admin' : 'Scholar'}</p>
                  </div>
                  <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                    {(globalProfile?.username || authUser?.email || 'U')[0].toUpperCase()}
                  </div>
                </div>

                <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors p-2 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>

              <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 hover:text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex bg-zinc-50 p-2 rounded-2xl flex-col gap-2">
                <button onClick={() => { setActiveTab('projects'); setIsMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Academic Blueprints</button>
                <button onClick={() => { setActiveTab('market'); setIsMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'market' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Live Market</button>
                <button onClick={() => { setActiveTab('tools'); setIsMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'tools' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Academic Tools</button>
                {authUser?.isSeller && (
                  <button onClick={() => { setActiveTab('seller'); setIsMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'seller' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Seller Hub</button>
                )}
            </div>
            
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 px-2">
              <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                {(globalProfile?.username || authUser?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 truncate uppercase text-sm tracking-tight">{globalProfile?.username || 'Student'}</p>
                <p className="text-xs text-slate-500 font-medium truncate">{authUser?.email}</p>
              </div>
            </div>
            
            {isAdmin && (
              <Link 
                href="/admin" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 font-black uppercase text-[10px] tracking-[0.2em] shadow-sm active:scale-95 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Console
              </Link>
            )}
            
            <button 
              onClick={handleLogout} 
              className="w-full text-center py-3 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 rounded-xl transition-all"
            >
              Sign Out Account
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {showAccreditation ? (
            <SellerAccreditationForm 
                user={authUser} 
                onComplete={() => {
                    setShowAccreditation(false);
                    refreshUser();
                }}
                onCancel={() => setShowAccreditation(false)}
            />
        ) : showUploadProject ? (
            <ProjectUploadForm 
                user={authUser}
                onComplete={() => {
                    setShowUploadProject(false);
                    fetchSellerData();
                }}
                onCancel={() => setShowUploadProject(false)}
            />
        ) : showUploadEbook ? (
            <EbookUploadForm 
                user={authUser}
                onComplete={() => {
                    setShowUploadEbook(false);
                    fetchSellerData();
                }}
                onCancel={() => setShowUploadEbook(false)}
            />
        ) : (
            <>
                {/* Header */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                {activeTab === 'projects' ? 'Academic Blueprint Hub' : activeTab === 'market' ? 'Live Market' : activeTab === 'seller' ? 'Seller Management' : 'Academic Tools'}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
                {activeTab === 'projects' ? 'Manage your architectural research and generate new blueprints.' : 
                 activeTab === 'market' ? 'Explore vetted academic blueprints and digital ebooks.' : 
                 activeTab === 'seller' ? 'Control your marketplace library and settlement requests.' :
                 'Professional research and writing tools for elite academics.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {(activeTab === 'market' || activeTab === 'tools') && (
                <button 
                    onClick={() => setShowFundingModal(true)}
                    className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-black transition-all active:scale-95 animate-in fade-in zoom-in-95"
                >
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Balance</p>
                        <p className="text-sm font-black text-slate-900 leading-none">{formatCurrency(wallet.balance)}</p>
                    </div>
                </button>
            )}
            {isAdmin && (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Admin
                </span>
            )}
          </div>
        </div>

        {/* --- PROJECTS VIEW --- */}
        {activeTab === 'projects' && (
          <div className="animate-in fade-in duration-500">
            {/* Payment Success Alert (Standard) */}
            {pendingStandardPayment && !isAdmin && (
            <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="flex-1">
                <h3 className="font-bold text-emerald-900">Standard Payment Confirmed!</h3>
                <p className="text-emerald-700 text-sm mt-1">Your Standard tier payment of <strong>₦{pendingStandardPayment.amount.toLocaleString()}</strong> is active.</p>
                </div>
                <button onClick={() => router.push('/template-select')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition shadow-sm">
                Continue Setup →
                </button>
            </div>
            )}

            {/* Payment Success Alert (Premium) */}
            {pendingPremiumPayment && !isAdmin && (
            <div className="mb-8 rounded-xl border border-purple-200 bg-purple-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="flex-1">
                <h3 className="font-bold text-purple-900">Premium Payment Confirmed!</h3>
                <p className="text-purple-700 text-sm mt-1">Your Premium tier payment of <strong>₦{pendingPremiumPayment.amount.toLocaleString()}</strong> is active. Enjoy elite features.</p>
                </div>
                <button onClick={() => router.push('/premium/template-selection')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-sm transition shadow-sm">
                Setup Premium Workspace →
                </button>
            </div>
            )}

            {/* Project Creation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* FREE TIER */}
            <div className="group relative bg-white rounded-[32px] border border-slate-200 p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
                <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Starter</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Essential Access</p>
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">₦0</span>
                </div>
                <ul className="space-y-3 mb-10">
                <li className="flex gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> 2 Images Max</li>
                <li className="flex gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Basic AI Model</li>
                <li className="flex gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> PDF Export Only</li>
                </ul>
                <div className="mt-auto">
                <button 
                    onClick={handleCreateFree}
                    disabled={!isAdmin && hasFreeProject}
                    className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 border-slate-100 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {!isAdmin && hasFreeProject ? 'Limit Reached' : 'Launch Free Blueprint'}
                </button>
                </div>
            </div>

            {/* STANDARD TIER */}
            <div className="relative bg-slate-900 rounded-[32px] border border-indigo-500 p-8 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl">RECOMMENDED</div>
                <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-black text-white text-lg uppercase tracking-tight">Standard</h3>
                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Professional Grade</p>
                </div>
                <span className="text-2xl font-black text-white tracking-tighter">{isAdmin ? 'Free' : `₦${PRICING.STANDARD.toLocaleString()}`}</span>
                </div>
                <ul className="space-y-3 mb-10">
                <li className="flex gap-2 text-xs font-bold text-indigo-100 uppercase tracking-tight"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Smart Improvements</li>
                <li className="flex gap-2 text-xs font-bold text-indigo-100 uppercase tracking-tight"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> DOCX + PDF Export</li>
                <li className="flex gap-2 text-xs font-bold text-indigo-100 uppercase tracking-tight"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Full Code Injection</li>
                </ul>
                <div className="mt-auto">
                <button 
                    onClick={handleCreateStandard}
                    disabled={creatingPayment}
                    className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 disabled:opacity-70"
                >
                    {creatingPayment ? 'Processing...' : (isAdmin ? 'Launch Standard Blueprint' : 'Select Standard Blueprint')}
                </button>
                </div>
            </div>

            {/* PREMIUM TIER */}
            <div className="bg-white rounded-[32px] border border-slate-200 p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
                <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Premium</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Maximum Power</p>
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">{isAdmin ? 'Free' : `₦${PRICING.PREMIUM.toLocaleString()}`}</span>
                </div>
                <ul className="space-y-3 mb-10">
                <li className="flex gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight"><Check className="w-4 h-4 text-purple-500 shrink-0" /> Superior AI Engine</li>
                <li className="flex gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight"><Check className="w-4 h-4 text-purple-500 shrink-0" /> Custom Logic Blocks</li>
                <li className="flex gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight"><Check className="w-4 h-4 text-purple-500 shrink-0" /> Priority Pipeline</li>
                </ul>
                <div className="mt-auto">
                <button 
                    onClick={handleCreatePremium} 
                    disabled={creatingPayment}
                    className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-black shadow-xl disabled:opacity-70"
                >
                    {creatingPayment ? 'Processing...' : (isAdmin ? 'Launch Premium Blueprint' : 'Select Premium Blueprint')}
                </button>
                </div>
            </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Total Blueprints</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalReports}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">In Development</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{inProgressReports}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Finalized</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{completedReports}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Acct Rank</p>
                <p className={`text-sm font-black uppercase tracking-tight ${isAdmin ? 'text-indigo-600' : 'text-slate-900'}`}>
                {isAdmin ? 'System Admin' : hasFreeProject ? 'Scholar' : 'New Recruit'}
                </p>
            </div>
            </div>

            {/* Recent Projects List */}
            <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vetted Repositories</h2>
                <Link href="/features" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Compare Features →</Link>
            </div>
            
            {totalReports === 0 ? (
                <div className="text-center py-24 bg-white rounded-[48px] border border-[#e5e7eb] shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">No Active Blueprints</h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto">Select an architectural plan above to begin your first technical document.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allProjects.map((project) => (
                    <Link 
                    key={project.id} 
                    href={
                        (project.tier === 'free' || project.tier === 'unlocked') ? `/project/${project.id}` : 
                        project.tier === 'standard' ? `/standard/${project.id}` :
                        `/premium/workspace?id=${project.id}`
                    }
                    className="group block bg-white rounded-[32px] border border-slate-200 p-8 hover:border-indigo-400 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                    >
                    <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        project.tier === 'free' ? 'bg-slate-100 text-slate-600' : 
                        project.tier === 'unlocked' ? 'bg-emerald-50 text-emerald-600' :
                        project.tier === 'standard' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                        {project.tier} Blueprint
                        </span>
                        <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                        project.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                        <span className={`h-2 w-2 rounded-full shadow-sm animate-pulse ${
                            project.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}></span>
                        {project.status === 'completed' ? 'Finalized' : 'Syncing'}
                        </span>
                    </div>
                    
                    <h3 className="font-black text-slate-900 mb-2 text-xl group-hover:text-indigo-600 transition-colors line-clamp-1 uppercase tracking-tighter">{project.title}</h3>
                    <p className="text-sm text-slate-500 mb-8 line-clamp-2 min-h-[40px] leading-relaxed font-medium">{project.description}</p>
                    
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 pt-6 border-t border-slate-100 uppercase tracking-widest">
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        
                        {/* Expiration Warning for Free Projects */}
                        {project.tier === 'free' && (
                        <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                            {Math.max(0, 30 - Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)))}D Left
                        </span>
                        )}

                        <span className="text-zinc-900">Ch. {project.current_chapter || 1}/5</span>
                    </div>
                    </Link>
                ))}
                </div>
            )}
            </div>
          </div>
        )}

        {/* --- LIVE MARKET VIEW --- */}
        {activeTab === 'market' && (
            <div className="animate-in fade-in duration-500">
                {selectedMarketItem ? (
                    <MarketItemDetail 
                        itemId={selectedMarketItem.id} 
                        itemType={selectedMarketItem.itemType} 
                        onBack={() => {
                            setSelectedMarketItem(null);
                            refreshWallet();
                        }} 
                    />
                ) : (
                    <>
                        {/* Market Toolbar */}
                        <div className="sticky top-[70px] z-40 bg-[#f8f9fc]/95 backdrop-blur-md border border-slate-200 rounded-3xl p-4 mb-8 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input 
                                        placeholder="Search blueprints or ebooks..." 
                                        value={marketSearch}
                                        onChange={(e) => setMarketSearch(e.target.value)}
                                        className="pl-12 bg-white border-slate-200 rounded-2xl h-12 font-bold focus:border-black shadow-inner"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                        {['all', 'blueprints', 'ebooks'].map(t => (
                                            <button 
                                                key={t}
                                                onClick={() => setMarketType(t)}
                                                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${marketType === t ? 'bg-zinc-900 shadow-lg text-white' : 'text-slate-400'}`}
                                            >
                                                {t === 'all' ? 'All Items' : t === 'blueprints' ? 'Blueprints' : 'Ebooks'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 text-black' : 'text-slate-300'}`}><Grid3X3 className="w-4 h-4" /></button>
                                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-100 text-black' : 'text-slate-300'}`}><List className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Become a Seller FAB (Market Tab Only) */}
                        {!authUser?.isSeller && !showAccreditation && (
                            <button 
                                onClick={() => setShowSellerIntro(true)}
                                className="fixed bottom-24 left-6 z-[40] group flex items-center gap-3 bg-zinc-900 text-white pl-4 pr-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-left-8 duration-500 border border-white/10"
                            >
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Earn as a Seller</span>
                            </button>
                        )}

                        {marketLoading ? (
                            <div className="py-24 text-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto" /></div>
                        ) : marketItems.filter(p => p.title.toLowerCase().includes(marketSearch.toLowerCase())).length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[48px] border border-slate-200">
                                <Layers className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Market Catalog Empty</h3>
                                <p className="text-slate-500 font-medium">Try a different search term or category.</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "flex flex-col gap-4"}>
                                {marketItems.filter(p => p.title.toLowerCase().includes(marketSearch.toLowerCase())).map((item) => (
                                    <MarketCard key={item.id} item={item} viewMode={viewMode} onView={setSelectedMarketItem} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        )}

        {/* --- ACADEMIC TOOLS VIEW --- */}
        {activeTab === 'tools' && (
            <div className="animate-in fade-in duration-500">
                {selectedToolId ? (
                    <div className="space-y-8 pb-20">
                        {/* Tool Header */}
                        <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-10 shadow-sm">
                            <button onClick={() => setSelectedToolId(null)} className="flex items-center gap-2 text-[#6b7280] hover:text-black transition-colors mb-6 text-[10px] font-black uppercase tracking-widest">
                                <ArrowLeft className="w-4 h-4" />Back to Catalog
                            </button>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 border border-indigo-100 rounded-[24px] flex items-center justify-center shrink-0">
                                        {(() => {
                                            const ToolIcon = iconMap[selectedTool?.icon] || Wrench;
                                            return <ToolIcon className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />;
                                        })()}
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-xl md:text-3xl font-black text-[#111827] tracking-tight uppercase truncate">{selectedTool?.name}</h1>
                                        <p className="text-[#6b7280] text-xs md:text-sm font-medium mt-1 line-clamp-2 md:line-clamp-none">{selectedTool?.description}</p>
                                    </div>
                                </div>
                                <div className={`rounded-2xl px-6 md:px-8 py-3 md:py-4 text-center font-black text-lg md:text-xl shadow-xl shrink-0 w-fit ${activeToolPrice === 0 ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white'}`}>
                                    {activeToolPrice === 0 ? 'FREE ACCESS' : formatCurrency(activeToolPrice)}
                                </div>
                            </div>
                        </div>

                        {/* Tool Interface */}
                        <div className="bg-white border border-slate-200 rounded-[40px] p-2 sm:p-4 shadow-sm min-h-[500px]">
                            {selectedToolId === 'project-finder' && <ProjectFinder {...toolProps} />}
                            {selectedToolId === 'code-explainer' && <CodeExplainer {...toolProps} />}
                            {selectedToolId === 'language-converter' && <LanguageConverter {...toolProps} />}
                            {selectedToolId === 'data-analysis' && <DataAnalysis {...toolProps} />}
                            {selectedToolId === 'plagiarism-checker' && <PlagiarismChecker {...toolProps} />}
                            {selectedToolId === 'reference-finder' && <ReferenceFinder {...toolProps} />}
                            {selectedToolId === 'slide-generator' && <SlideGenerator {...toolProps} />}
                            {selectedToolId === 'ai-humanizer' && <AIHumanizer {...toolProps} />}
                            {selectedToolId === 'diagram-studio' && <VisualStudio {...toolProps} />}
                            {selectedToolId === 'questionnaire-generator' && <QuestionnaireGenerator {...toolProps} />}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tools Toolbar */}
                        <div className="sticky top-[70px] z-40 bg-[#f8f9fc]/95 backdrop-blur-md border border-slate-200 rounded-3xl p-4 mb-8 shadow-sm">
                            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                                <div className="relative w-full lg:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input 
                                        placeholder="Search research engines..." 
                                        value={toolSearch}
                                        onChange={(e) => setToolSearch(e.target.value)}
                                        className="pl-12 bg-white border-slate-200 rounded-2xl h-12 font-bold focus:border-black shadow-inner"
                                    />
                                </div>

                                <div className="w-full lg:w-auto overflow-x-auto no-scrollbar">
                                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex min-w-max">
                                        {toolCategories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setToolCategory(cat.id)}
                                                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${toolCategory === cat.id ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {academicTools
                                .filter(t => (toolCategory === 'all' || t.category === toolCategory) && (t.name.toLowerCase().includes(toolSearch.toLowerCase()) || t.description.toLowerCase().includes(toolSearch.toLowerCase())))
                                .map((tool) => {
                                    const Icon = iconMap[tool.icon] || Wrench;
                                    return (
                                    <div key={tool.id} className="group bg-white border border-slate-200 rounded-[32px] p-8 hover:border-indigo-500 transition-all duration-300 flex flex-col shadow-sm hover:shadow-2xl">
                                        <div className="flex items-start justify-between mb-8">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                                            <Icon className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                        <Badge variant="secondary" className={`border-none px-4 py-1.5 rounded-full text-[9px] font-black ${!tool.isAvailable ? 'bg-red-50 text-red-600' : tool.pricePerUse === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-900'}`}>
                                            {!tool.isAvailable ? 'UNAVAILABLE' : tool.pricePerUse === 0 ? 'FREE ACCESS' : formatCurrency(tool.pricePerUse)}
                                        </Badge>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{tool.name}</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed font-medium mb-8 flex-1 line-clamp-3">{tool.description}</p>
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{tool.usageCount.toLocaleString()} USES</span>
                                            {tool.isAvailable ? (
                                                <Button 
                                                    onClick={() => handleLaunchTool(tool.id)}
                                                    size="sm" 
                                                    className="bg-black hover:bg-zinc-800 text-white rounded-xl px-6 font-black text-[10px] uppercase tracking-widest h-10 transition-all active:scale-95"
                                                >
                                                    Launch
                                                </Button>
                                            ) : (
                                                <Button size="sm" disabled className="bg-slate-100 text-slate-400 rounded-xl px-6 font-black text-[10px] uppercase tracking-widest h-10 cursor-not-allowed">Offline</Button>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                        </div>
                    </>
                )}
            </div>
        )}

        {/* --- SELLER HUB VIEW --- */}
        {activeTab === 'seller' && authUser?.isSeller && (
            <div className="animate-in fade-in duration-500 space-y-12 pb-20">
                {selectedMarketItem ? (
                    <MarketItemDetail 
                        itemId={selectedMarketItem.id} 
                        itemType={selectedMarketItem.itemType} 
                        onBack={() => {
                            setSelectedMarketItem(null);
                        }} 
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-zinc-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Withdrawable Earnings</p>
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

                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">My Academic Library</h2>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowUploadProject(true)}
                                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-black transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Blueprint
                                    </button>
                                    <button 
                                        onClick={() => setShowUploadEbook(true)}
                                        className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-zinc-200 transition-all border border-zinc-200"
                                    >
                                        <Plus className="w-3 h-3" /> Ebook
                                    </button>
                                </div>
                            </div>

                            {loadingSeller ? (
                                <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mx-auto"></div></div>
                            ) : myItems.length === 0 ? (
                                <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center">
                                    <Layers className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                    <p className="font-black text-slate-400 uppercase text-xs tracking-widest italic">You haven&apos;t listed any academic blueprints or ebooks yet</p>
                                </div>
                            ) : (

                                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sales</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {myItems.map((item) => {
                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                                                        <td className="px-6 py-5">
                                                            <div className="font-black text-slate-900 text-sm uppercase tracking-tight truncate max-w-md">{item.title}</div>
                                                            <div className="flex gap-2 mt-1">
                                                                <Badge className="bg-zinc-100 text-zinc-500 border-none px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">{item.itemType}</Badge>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{formatCurrency(item.price)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className="font-black text-slate-900 text-lg">{item.sales_count || 0}</div>
                                                            <div className="text-[8px] font-black text-slate-400 uppercase">Downloads</div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <Badge className={`border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                                item.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                                                                item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                                            }`}>
                                                                {item.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <button 
                                                                    onClick={() => setSelectedMarketItem(item)}
                                                                    className="p-3 bg-white text-zinc-900 rounded-xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm border border-zinc-200" 
                                                                    title="View Listing"
                                                                >
                                                                    <Eye className="w-4 h-4 text-inherit" />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.preventDefault(); handleDeleteItem(item.id, item.itemType); }}
                                                                    className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-zinc-200"
                                                                    title="Delete Listing"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-inherit" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        )}
      </>
    )}

        {/* Modals (Common) */}
        <PaymentMethodModal 
            open={showAccountModal} 
            onOpenChange={setShowAccountModal} 
            userId={authUser?.id}
            currentAccount={sellerAccount}
            onSaved={(data) => setSellerAccount(data)}
        />
        <PayoutRequestModal 
            open={showPayoutModal} 
            onOpenChange={setShowPayoutModal} 
            userId={authUser?.id}
            balance={sellerWallet?.balance || 0}
            onRequested={() => {
                fetchSellerData();
                refreshWallet();
            }}
        />
        <ManualPaymentModal 
            isOpen={showManualPayment} 
            onClose={() => {
                setShowManualPayment(false);
                setPaymentTier(null);
            }} 
            userId={authUser?.id}
            userEmail={authUser?.email}
            initialTier={paymentTier}
        />
      </div>

      <FeedbackWidget userId={authUser?.id} />

      {/* Tool Payment Dialog */}
      {showToolPaymentDialog && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-center mb-8 tracking-tight uppercase text-zinc-900">Authorize Usage</h2>
            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 mb-8">
                <button onClick={() => { setShowFundingModal(true); setShowToolPaymentDialog(false); }} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-100 shadow-sm"><Wallet className="w-5 h-5" /></div>
                    <div className="text-left"><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance</p><p className="text-zinc-900 font-black text-base">{formatCurrency(wallet.balance)}</p></div>
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fee</p>
                    <p className="text-blue-600 font-black text-base">
                        {formatCurrency(activeToolPrice)}
                    </p>
                </div>
            </div>
            {wallet.balance < activeToolPrice ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-[10px] text-red-600 font-black uppercase tracking-widest leading-tight">Insufficient funds to launch tool.</p></div>
                    <Button onClick={() => { setShowFundingModal(true); setShowToolPaymentDialog(false); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-7 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Zap className="w-4 h-4" /> Fund Wallet Now</Button>
                    <button className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-2" onClick={() => setShowToolPaymentDialog(false)}>Cancel</button>
                </div>
            ) : (
                <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-full py-8" onClick={() => setShowToolPaymentDialog(false)}>Cancel</Button>
                    <Button className="flex-[2] bg-black text-white rounded-full py-8 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all" onClick={handleToolPayment}>Authorize & Pay</Button>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Tutorial Trigger */}
      <button 
        onClick={() => setShowTutorial(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 active:scale-95 z-[40]"
        title="Watch Tutorial Guide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
      </button>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setShowTutorial(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.197-3L10 9v6z"/><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/></svg>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Mastering W3 WriteLab</h3>
            <p className="text-slate-600 mb-8 leading-relaxed font-medium">
              This quick walkthrough guide shows you exactly how to generate a &quot;Standard &amp; Good&quot; project using our 3 different packages.
            </p>

            <a 
              href="https://youtube.com/watch?v=KIfsDZbiMDo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative block aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl border-4 border-slate-50 transition-all hover:ring-4 hover:ring-red-100 mb-8 group"
            >
              <img 
                src="https://img.youtube.com/vi/KIfsDZbiMDo/maxresdefault.jpg" 
                alt="Tutorial Preview" 
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>  
            </a>
            
            <button 
              onClick={() => setShowTutorial(false)}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
            >
              I Understand!
            </button>
          </div>
        </div>
      )}

      <CustomModal 
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
        onCancel={notification.onCancel}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
      />

      {/* Seller Introduction Modal */}
      {showSellerIntro && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
             <button onClick={() => setShowSellerIntro(false)} className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-black transition-colors"><X className="w-6 h-6" /></button>
             
             <div className="p-10 text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-8">
                    <TrendingUp className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter mb-4 leading-tight">Monetize Your<br/>Research Expertise</h2>
                <p className="text-zinc-500 font-medium leading-relaxed mb-10 px-4">
                    Join our elite network of academic contributors and earn industry-leading commissions on your original research assets.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 text-center">
                        <p className="text-2xl font-black text-indigo-600">70%</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Blueprints</p>
                    </div>
                    <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 text-center">
                        <p className="text-2xl font-black text-emerald-600">90%</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Digital Ebooks</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => { setShowSellerIntro(false); setShowAccreditation(true); }}
                        className="w-full bg-zinc-900 hover:bg-black text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
                    >
                        Apply for Accreditation
                    </button>
                    <button 
                        onClick={() => setShowSellerIntro(false)}
                        className="w-full text-zinc-400 font-black uppercase text-[10px] tracking-widest py-3"
                    >
                        Maybe Later
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-10 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Confirm Removal</h2>
                <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                    Are you sure you want to delete this {itemToDelete.type}? This action is irreversible and will remove all associated data.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-black">Cancel</button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-[2] bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-200"
                    >
                        Delete Permanently
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
