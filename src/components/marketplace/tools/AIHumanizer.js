"use client";
import { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Copy, UserCheck, FileText
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';

export default function AIHumanizer({ 
  isProcessing, 
  setIsProcessing, 
  hasPaid, 
  setHasPaid, 
  setShowPaymentDialog 
}) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const MAX_WORDS = 1500;
  const isOverLimit = wordCount > MAX_WORDS;

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

    if (isOverLimit) {
        toast.error(`Exceeded maximum limit of ${MAX_WORDS} words.`);
        return;
    }

    if (!hasPaid && !skipPaymentCheck) {
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/marketplace/tools/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input })
      });
      
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned an invalid response format (Status: ${response.status})`);
      }

      if (data.error) throw new Error(data.error);
      setOutput(data.result);
      toast.success('Ready!');
      setHasPaid(false);
    } catch (err) {
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
    <div className="grid md:grid-cols-2 gap-12 animate-in fade-in duration-700">
      {/* Input Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Content Core</h2>
              <p className="text-sm text-slate-500 font-medium">AI generated text</p>
            </div>
          </div>
          <Badge variant="outline" className={`rounded-full px-4 py-1.5 font-black text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-600'}`}>
            {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
          </Badge>
        </div>
        <Textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border-[#e5e7eb] rounded-[32px] p-8 focus:border-black focus:ring-0 text-zinc-900 leading-relaxed font-bold resize-none" 
          placeholder="Enter project content here..." 
        />
        
        <Button 
          onClick={() => handleProcess()} 
          disabled={isProcessing || !input.trim() || isOverLimit} 
          className="w-full bg-black hover:bg-zinc-800 text-white rounded-[24px] py-8 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-8 flex items-center justify-center gap-4 shrink-0"
        >
          {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
          {isProcessing ? 'Humanizing...' : `Execute Humanizer (₦1,000)`}
        </Button>
      </div>

      {/* Output Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[600px] animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Result</h2>
          {output && (
            <Button 
              onClick={handleCopy} 
              variant="outline" 
              className="rounded-full px-6 border-[#e5e7eb] text-zinc-900 font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Results
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900 rounded-[32px] p-8 text-zinc-300 font-bold leading-relaxed whitespace-pre-wrap">
          {output || (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
              <UserCheck className="w-12 h-12 mb-4 opacity-10" />
              Humanized output will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
