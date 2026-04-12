"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Presentation, BarChart3, Search, Lightbulb,
  SpellCheck, Quote, Image, Code2, RefreshCw as RefreshIcon,
  ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { getToolById } from '@/data/marketplace/tools';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/marketplace-utils';
import { toast } from 'sonner';

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
  Image,
  Code2,
  RefreshCw: RefreshIcon,
};

export default function ToolInterfacePage() {
  const { toolId } = useParams();
  const navigate = useRouter();
  const { wallet, deductFunds } = useWallet();

  const [tool, setTool] = useState(undefined);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

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

    if (!hasPaid) {
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setOutput(`PROCESSED_RESULT_FOR_${toolId.toUpperCase()}`);
      setIsProcessing(false);
      toast.success('Processing complete!');
    }, 2000);
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
              <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-[24px] flex items-center justify-center"><Icon className="w-10 h-10 text-blue-600" /></div>
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tight">{tool.name}</h1>
                <p className="text-[#6b7280] font-medium mt-1">{tool.description}</p>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-[24px] px-8 py-4 text-center text-white font-black text-2xl">{formatCurrency(tool.pricePerUse)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
            <h2 className="text-lg font-black text-[#111827] uppercase mb-6 tracking-tighter">Input Source</h2>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[400px] bg-[#f8f9fc] border-[#e5e7eb] rounded-[20px] p-6 focus:border-black focus:ring-0" placeholder="Paste content here..." />
            <Button className="w-full bg-black hover:bg-zinc-800 text-white rounded-full py-7 font-black mt-8" onClick={handleProcess} disabled={isProcessing || !input.trim()}>
              {isProcessing ? 'Processing...' : 'Execute Tool'}
            </Button>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
            <h2 className="text-lg font-black text-[#111827] uppercase mb-6 tracking-tighter">Results</h2>
            <div className="min-h-[400px] bg-zinc-900 rounded-[20px] p-8 text-zinc-300 font-mono text-sm leading-relaxed overflow-auto">
              {output || 'Output will appear here'}
            </div>
            {output && <Button variant="outline" className="w-full border-[#e5e7eb] rounded-full py-6 font-bold mt-8" onClick={handleCopy}>Copy Results</Button>}
          </div>
        </div>
      </div>

      {showPaymentDialog && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-center mb-8 tracking-tight">Authorize Payment</h2>
            <div className="bg-[#f8f9fc] p-6 rounded-[24px] mb-10 text-center font-black text-xl text-blue-600">{formatCurrency(tool.pricePerUse)}</div>
            <div className="flex gap-4">
              <Button variant="ghost" className="flex-1 font-bold rounded-full" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
              <Button className="flex-[2] bg-black text-white rounded-full py-7 font-black shadow-xl" onClick={handlePayment}>Pay Now</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
