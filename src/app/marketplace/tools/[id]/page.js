"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Wrench, Zap, AlertCircle, ShieldCheck,
  BookOpen, Presentation, BarChart3, Search, Lightbulb,
  SpellCheck, Quote, Image, Code2, RefreshCw as RefreshIcon,
  Wallet, UserCheck, Activity, Palette, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { getToolById } from '@/data/marketplace/tools';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// Import Modular Tool Components
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

const iconMap = {
  ShieldCheck,
  UserCheck,
  Presentation,
  BookOpen,
  Search,
  Lightbulb,
  BarChart3,
  SpellCheck,
  Quote,
  Image,
  Code2,
  RefreshCw: RefreshIcon,
  Activity,
  Palette,
  ClipboardList
};

export default function ToolInterfacePage() {
  const { id: toolId } = useParams();
  const navigate = useRouter();
  const { wallet, deductFunds, setShowFundingModal } = useWallet();

  const [tool, setTool] = useState(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingIterative, setPendingIterative] = useState(false);
  const [customPrice, setCustomPrice] = useState(null);

  useEffect(() => {
    if (toolId) {
      const found = getToolById(toolId);
      setTool(found);
    }
  }, [toolId]);

  const activePrice = customPrice !== null ? customPrice : 
                    (toolId === 'reference-finder' ? 200 : (tool?.pricePerUse || 0));

  const handlePayment = async () => {
    if (!tool) return;
    
    if (wallet.balance < activePrice) {
      toast.error('Insufficient balance.');
      return;
    }

    const label = toolId === 'reference-finder' ? `DeepSearch: ${tool.name}` : 
                  toolId === 'diagram-studio' ? `Visual Studio Generation` :
                  toolId === 'plagiarism-checker' ? `Integrity Scan` :
                  `Tool: ${tool.name}`;
    const success = await deductFunds(activePrice, label);
    if (success) {
      setHasPaid(true);
      setShowPaymentDialog(false);
      toast.success('Payment successful!');
    }
  };

  if (!tool) return null;
  const Icon = iconMap[tool.icon] || Wrench;

  // Shared props for tool components
  const toolProps = {
    isProcessing,
    setIsProcessing,
    hasPaid,
    setHasPaid,
    setShowPaymentDialog,
    setPendingIterative, 
    pendingIterative,
    setCustomPrice
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate.back()} className="flex items-center gap-2 text-[#6b7280] hover:text-black transition-colors mb-6 text-xs font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-[24px] flex items-center justify-center">
                <Icon className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tight uppercase">{tool.name}</h1>
                <p className="text-[#6b7280] font-medium mt-1">{tool.description}</p>
              </div>
            </div>
            <div className={`rounded-[24px] px-8 py-4 text-center font-black text-2xl shadow-xl ${activePrice === 0 ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white'}`}>
                {activePrice === 0 ? 'FREE' : formatCurrency(activePrice)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Render Specialized Tool Component */}
        {toolId === 'project-finder' && <ProjectFinder {...toolProps} />}
        {toolId === 'code-explainer' && <CodeExplainer {...toolProps} />}
        {toolId === 'language-converter' && <LanguageConverter {...toolProps} />}
        {toolId === 'data-analysis' && <DataAnalysis {...toolProps} />}
        {toolId === 'plagiarism-checker' && <PlagiarismChecker {...toolProps} />}
        {toolId === 'reference-finder' && <ReferenceFinder {...toolProps} />}
        {toolId === 'slide-generator' && <SlideGenerator {...toolProps} />}
        {toolId === 'ai-humanizer' && <AIHumanizer {...toolProps} />}
        {toolId === 'diagram-studio' && <VisualStudio {...toolProps} />}
        {toolId === 'questionnaire-generator' && <QuestionnaireGenerator {...toolProps} />}
        
        {/* Fallback for other tools */}
        {!['project-finder', 'code-explainer', 'language-converter', 'data-analysis', 'plagiarism-checker', 'reference-finder', 'slide-generator', 'ai-humanizer', 'diagram-studio', 'questionnaire-generator'].includes(toolId) && (
            <div className="py-20 text-center">
                <Wrench className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 uppercase">Tool Under Development</h2>
                <p className="text-slate-500 font-medium mt-2">This module is currently being architected. Check back soon!</p>
            </div>
        )}
      </div>

      {showPaymentDialog && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-center mb-8 tracking-tight uppercase text-zinc-900">Authorize Tool Usage</h2>
            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 mb-8">
                <button onClick={() => { setShowFundingModal(true); setShowPaymentDialog(false); }} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-100 shadow-sm"><Wallet className="w-5 h-5" /></div>
                    <div><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance</p><p className="text-zinc-900 font-black">{formatCurrency(wallet.balance)}</p></div>
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fee</p>
                    <p className="text-blue-600 font-black">
                        {formatCurrency(activePrice)}
                    </p>
                </div>
            </div>
            {wallet.balance < activePrice ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-[10px] text-red-600 font-black uppercase tracking-widest leading-tight">Insufficient funds to launch tool.</p></div>
                    <Button onClick={() => { setShowFundingModal(true); setShowPaymentDialog(false); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-7 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Zap className="w-4 h-4" /> Fund Wallet Now</Button>
                    <Button variant="ghost" className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                </div>
            ) : (
                <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-full py-8" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                    <Button className="flex-[2] bg-black text-white rounded-full py-8 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all" onClick={handlePayment}>Authorize & Pay</Button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
