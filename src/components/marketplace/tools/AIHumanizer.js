"use client";
import { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Copy, UserCheck, FileText, Wallet
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/marketplace/UserContext';

export default function AIHumanizer({ 
  isProcessing, 
  setIsProcessing, 
  hasPaid, 
  setHasPaid, 
  setShowPaymentDialog 
}) {
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [wordBalance, setWordBalance] = useState(0);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const MAX_WORDS = 1000;
  const isOverLimit = wordCount > MAX_WORDS;

  // Fetch word balance on mount
  useEffect(() => {
    if (user) fetchBalance();
  }, [user]);

  const fetchBalance = async () => {
    const { data, error } = await supabase
      .from('tool_word_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('tool_id', 'ai-humanizer')
      .maybeSingle();
    
    if (data) setWordBalance(data.balance);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    
    if (words.length > MAX_WORDS) {
      const truncatedText = text.split(/\s+/).slice(0, MAX_WORDS).join(' ');
      setInput(truncatedText);
      toast.error(`Word limit reached! Only the first ${MAX_WORDS} words were kept.`);
    } else {
      setInput(text);
    }
  };

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && input.trim()) {
      handleProcess(true);
    }
  }, [hasPaid]);

  const handleProcess = async (skipPaymentCheck = false) => {
    if (!input.trim()) {
      toast.error('Please enter some text to process');
      return;
    }

    if (wordCount > MAX_WORDS) {
        toast.error(`Exceeded maximum limit of ${MAX_WORDS} words.`);
        return;
    }

    // Word Balance Logic
    if (!skipPaymentCheck) {
      if (wordBalance < wordCount) {
        setShowPaymentDialog(true);
        return;
      }
    }

    setIsProcessing(true);

    try {
      let finalBalanceToUse = wordBalance;

      // 1. If we skipped payment check (meaning user just paid), refill balance first
      if (skipPaymentCheck) {
        const { data: current } = await supabase
          .from('tool_word_balances')
          .select('balance')
          .eq('user_id', user.id)
          .eq('tool_id', 'ai-humanizer')
          .maybeSingle();
        
        finalBalanceToUse = (current?.balance || 0) + 1000;
        
        await supabase
          .from('tool_word_balances')
          .upsert({ 
            user_id: user.id, 
            tool_id: 'ai-humanizer', 
            balance: finalBalanceToUse,
            updated_at: new Date().toISOString()
          });
        
        setWordBalance(finalBalanceToUse);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/marketplace/tools/humanize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: input })
      });
      
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned an invalid response format`);
      }

      if (data.error) throw new Error(data.error);
      
      // Balance is securely updated on backend, use the returned balance
      const updatedBalance = data.newBalance !== undefined ? data.newBalance : Math.max(0, finalBalanceToUse - wordCount);

      setWordBalance(updatedBalance);
      setOutput(data.result);
      toast.success('Humanization complete!');
      setHasPaid(false);
    } catch (err) {
      console.error(err);
      toast.error('System under maintenance. Please try again later.');
      setHasPaid(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied!');
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 animate-in fade-in duration-700">
      {/* Input Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col h-[500px] md:h-[650px]">
        <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center">
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Content Core</h2>
              <p className="text-[10px] md:text-sm text-slate-500 font-medium">AI generated text</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 md:gap-2">
            <Badge variant="outline" className={`rounded-full px-3 md:px-4 py-1 md:py-1.5 font-black text-[9px] md:text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-600'}`}>
              {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
            </Badge>
            <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1 bg-zinc-900 text-white rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-sm">
              <Wallet className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-400" />
              {wordBalance.toLocaleString()} Credits
            </div>
          </div>
        </div>
        <Textarea 
          value={input} 
          onChange={handleInputChange} 
          className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border-[#e5e7eb] rounded-[24px] md:rounded-[32px] p-6 md:p-8 focus:border-black focus:ring-0 text-zinc-900 leading-relaxed font-bold resize-none text-sm md:text-base" 
          placeholder="Enter project content here..." 
        />
        
        <Button 
          onClick={() => handleProcess()} 
          disabled={isProcessing || !input.trim() || isOverLimit} 
          className="w-full bg-black hover:bg-zinc-800 text-white rounded-[20px] md:rounded-[24px] py-6 md:py-10 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-xl mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-4 shrink-0 transition-all active:scale-95"
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />}
          {isProcessing ? 'Humanizing...' : wordBalance >= wordCount ? 'Execute (Using Credits)' : `Refill & Execute (₦1,000)`}
        </Button>
      </div>

      {/* Output Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col h-[500px] md:h-[650px] animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Result</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">Humanized output</p>
              </div>
            </div>
          {output && (
            <Button 
              onClick={handleCopy} 
              variant="outline" 
              className="rounded-full px-4 md:px-6 border-[#e5e7eb] text-zinc-900 font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-black hover:text-white transition-all"
            >
              <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Copy
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-zinc-300 font-bold leading-relaxed whitespace-pre-wrap text-sm md:text-base">
          {output || (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
              <UserCheck className="w-10 h-10 md:w-12 md:h-12 mb-4 opacity-10" />
              Humanized output will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
