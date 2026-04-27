"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Presentation, BarChart3, Search, Lightbulb,
  SpellCheck, Quote, Image, Code2, RefreshCw as RefreshIcon,
  ClipboardCheck, Wallet, Sparkles, UserCheck
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { getToolById } from '@/data/marketplace/tools';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

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
};

export default function ToolInterfacePage() {
  const { id: toolId } = useParams();
  const navigate = useRouter();
  const { wallet, deductFunds, setShowFundingModal } = useWallet();

  const [tool, setTool] = useState(undefined);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Word count logic
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const MAX_WORDS = 1500;
  const isOverLimit = wordCount > MAX_WORDS;

  useEffect(() => {
    if (toolId) {
      const found = getToolById(toolId);
      setTool(found);
    }
  }, [toolId]);

  const handleProcess = async () => {
    if (!input.trim()) {
      toast.error('Please enter some text to process');
      return;
    }

    if (isOverLimit) {
        toast.error(`Exceeded maximum limit of ${MAX_WORDS} words.`);
        return;
    }

    if (!hasPaid) {
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      if (toolId === 'ai-humanizer') {
        const response = await fetch('/api/marketplace/tools/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: input })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setOutput(data.result);
      } else {
        // Generic fallback for other tools (mock)
        await new Promise(resolve => setTimeout(resolve, 2000));
        setOutput(`PROCESSED_RESULT_FOR_${toolId.toUpperCase()}`);
      }
      setIsProcessing(false);
      toast.success('Processing complete!');
    } catch (err) {
      toast.error(err.message || 'Processing failed');
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!tool) return;
    if (wallet.balance < tool.pricePerUse) {
      toast.error('Insufficient balance.');
      return;
    }
    const success = await deductFunds(tool.pricePerUse, `Tool: ${tool.name}`);
    if (success) {
      setHasPaid(true);
      setShowPaymentDialog(false);
      toast.success('Payment successful!');
      handleProcess();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied!');
  };

  if (!tool) return null;

  const Icon = iconMap[tool.icon] || Wrench;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate.back()} className="flex items-center gap-2 text-[#6b7280] hover:text-black transition-colors mb-6 text-xs font-black uppercase tracking-widest"><ArrowLeft className="w-4 h-4" />Back</button>
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
            <div className="bg-zinc-900 rounded-[24px] px-8 py-4 text-center text-white font-black text-2xl">{formatCurrency(tool.pricePerUse)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-[#111827] uppercase tracking-tighter">Input Source</h2>
                <Badge variant="outline" className={`rounded-full px-3 py-1 font-bold ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-400'}`}>
                    {wordCount.toLocaleString()} / {MAX_WORDS} WORDS
                </Badge>
            </div>
            <Textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                className={`flex-1 min-h-[400px] bg-[#f8f9fc] border-[#e5e7eb] rounded-[20px] p-6 focus:border-black focus:ring-0 text-slate-700 leading-relaxed font-medium ${isOverLimit ? 'border-red-300' : ''}`} 
                placeholder="Paste content here..." 
            />
            <Button 
                className="w-full bg-black hover:bg-zinc-800 text-white rounded-full py-8 font-black mt-8 shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all" 
                onClick={handleProcess} 
                disabled={isProcessing || !input.trim() || isOverLimit}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    Execute {tool.name}
                </>
              )}
            </Button>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm flex flex-col">
            <h2 className="text-lg font-black text-[#111827] uppercase mb-6 tracking-tighter">Results</h2>
            <div className="flex-1 min-h-[400px] bg-zinc-900 rounded-[20px] p-8 text-zinc-300 font-medium text-sm leading-relaxed overflow-auto custom-scrollbar">
              {output || (
                <div className="h-full flex items-center justify-center text-zinc-600 italic">
                    Output will appear here after processing
                </div>
              )}
            </div>
            {output && (
                <Button 
                    variant="outline" 
                    className="w-full border-[#e5e7eb] rounded-full py-8 font-black mt-8 flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all uppercase text-[11px] tracking-widest" 
                    onClick={handleCopy}
                >
                    <Copy className="w-4 h-4" /> Copy Results
                </Button>
            )}
          </div>
        </div>
      </div>

      {showPaymentDialog && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-center mb-8 tracking-tight uppercase">Authorize Tool Usage</h2>
            
            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 mb-8">
                <button 
                    onClick={() => {
                        setShowFundingModal(true);
                        setShowPaymentDialog(false);
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
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fee</p>
                    <p className="text-blue-600 font-black">{formatCurrency(tool.pricePerUse)}</p>
                </div>
            </div>

            {wallet.balance < tool.pricePerUse ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-[10px] text-red-600 font-black uppercase tracking-widest leading-tight">Insufficient funds to launch tool.</p>
                    </div>
                    <Button 
                        onClick={() => {
                            setShowFundingModal(true);
                            setShowPaymentDialog(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-7 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <Zap className="w-4 h-4" /> Fund Wallet Now
                    </Button>
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
