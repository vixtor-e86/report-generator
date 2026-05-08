"use client";
import { useState, useEffect } from 'react';
import { 
  Languages, Sparkles, RefreshCw, Copy, 
  Check, Zap, Info, ArrowRight, MessageSquare,
  Globe2, Type, Wallet
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/marketplace/UserContext';

const LANGUAGES = [
  // Core Nigerian
  { id: 'pidgin', name: 'Nigerian Pidgin', icon: '🇳🇬' },
  { id: 'yoruba', name: 'Yoruba', icon: '🇳🇬' },
  { id: 'igbo', name: 'Igbo', icon: '🇳🇬' },
  { id: 'hausa', name: 'Hausa', icon: '🇳🇬' },
  // International
  { id: 'english', name: 'English (UK/US)', icon: '🇬🇧' },
  { id: 'french', name: 'French', icon: '🇫🇷' },
  { id: 'spanish', name: 'Spanish', icon: '🇪🇸' },
  { id: 'german', name: 'German', icon: '🇩🇪' },
  { id: 'chinese', name: 'Chinese', icon: '🇨🇳' },
  { id: 'arabic', name: 'Arabic', icon: '🇸🇦' },
  { id: 'portuguese', name: 'Portuguese', icon: '🇵🇹' },
  { id: 'russian', name: 'Russian', icon: '🇷🇺' },
  { id: 'japanese', name: 'Japanese', icon: '🇯🇵' },
  { id: 'korean', name: 'Korean', icon: '🇰🇷' },
  { id: 'italian', name: 'Italian', icon: '🇮🇹' },
  { id: 'swahili', name: 'Swahili', icon: '🇰🇪' },
  { id: 'hindi', name: 'Hindi', icon: '🇮🇳' },
  { id: 'turkish', name: 'Turkish', icon: '🇹🇷' },
  { id: 'dutch', name: 'Dutch', icon: '🇳🇱' },
  { id: 'hebrew', name: 'Hebrew', icon: '🇮🇱' },
];

const MODES = [
  { id: 'standard', name: 'Standard' },
  { id: 'professional', name: 'Professional' },
  { id: 'casual', name: 'Casual' },
  { id: 'academic', name: 'Academic' },
];

export default function LanguageConverter({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog
}) {
  const { user } = useUser();
  const [inputText, setInputText] = useState('');
  const [convertedText, setConvertedText] = useState('');
  const [targetLang, setTargetLang] = useState('pidgin');
  const [mode, setMode] = useState('standard');
  const [copied, setCopied] = useState(false);
  const [wordBalance, setWordBalance] = useState(0);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const MAX_WORDS = 3000;
  const isOverLimit = wordCount > MAX_WORDS;

  // Fetch word balance on mount
  useEffect(() => {
    if (user) fetchBalance();
  }, [user]);

  const fetchBalance = async () => {
    const { data } = await supabase
      .from('tool_word_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('tool_id', 'language-converter')
      .maybeSingle();
    
    if (data) setWordBalance(data.balance);
  };

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && inputText.trim()) {
      handleConvert(true);
    }
  }, [hasPaid]);

  const handleConvert = async (skipPaymentCheck = false) => {
    if (!inputText.trim()) return toast.error("Please enter text to convert.");
    
    if (isOverLimit) {
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
      // 1. Refill balance if user just paid
      if (skipPaymentCheck) {
        const { data: current } = await supabase
          .from('tool_word_balances')
          .select('balance')
          .eq('user_id', user.id)
          .eq('tool_id', 'language-converter')
          .maybeSingle();
        
        const newBalance = (current?.balance || 0) + 2000;
        
        await supabase
          .from('tool_word_balances')
          .upsert({ 
            user_id: user.id, 
            tool_id: 'language-converter', 
            balance: newBalance,
            updated_at: new Date().toISOString()
          });
        
        setWordBalance(newBalance);
      }

      const response = await fetch('/api/marketplace/tools/language-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText, 
          targetLanguage: LANGUAGES.find(l => l.id === targetLang)?.name,
          mode 
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // 2. Deduct words from balance
      const { data: finalBalData } = await supabase
        .from('tool_word_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('tool_id', 'language-converter')
        .single();
      
      const updatedBalance = Math.max(0, finalBalData.balance - wordCount);
      
      await supabase
        .from('tool_word_balances')
        .update({ balance: updatedBalance })
        .eq('user_id', user.id)
        .eq('tool_id', 'language-converter');

      setWordBalance(updatedBalance);
      setConvertedText(data.convertedText);
      toast.success('Conversion complete!');
      setHasPaid(false);
    } catch (err) {
      toast.error(err.message || 'System under maintenance. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Converted text copied!');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Settings Bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 rounded-lg md:rounded-xl flex items-center justify-center text-indigo-600">
            <Globe2 className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-slate-50 border-slate-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 font-bold text-[10px] md:text-xs uppercase tracking-widest text-zinc-600 focus:outline-none focus:border-indigo-500 transition-all appearance-none outline-none"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.icon} {lang.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-pink-50 rounded-lg md:rounded-xl flex items-center justify-center text-pink-600">
            <Type className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-lg gap-0.5 md:gap-1">
            {MODES.map(m => (
              <button 
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-2 md:px-4 py-1 md:py-1.5 rounded-md text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mode === m.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
          <div className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-zinc-900 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">
            <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
            {wordBalance.toLocaleString()} <span className="hidden xs:inline ml-1">Credits</span>
          </div>
          <Badge variant="outline" className={`rounded-full px-3 md:px-4 py-1.5 md:py-2 font-black text-[9px] md:text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-600'}`}>
            {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
          </Badge>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
        {/* Input Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col h-[500px] md:h-[650px]">
          <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Source Core</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">Text to convert</p>
              </div>
            </div>
            <button 
              onClick={() => setInputText('')}
              className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
          
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type your text here..."
            className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border-[#e5e7eb] rounded-[24px] md:rounded-[32px] p-6 md:p-8 focus:border-black focus:ring-0 text-zinc-900 leading-relaxed font-bold resize-none text-sm md:text-base"
          />

          <Button 
            onClick={() => handleConvert()}
            disabled={isProcessing || !inputText.trim() || isOverLimit}
            className="w-full bg-black hover:bg-zinc-800 text-white rounded-[20px] md:rounded-[24px] py-6 md:py-10 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-xl mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-4 shrink-0 transition-all active:scale-95"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />}
            {isProcessing ? 'Converting...' : wordBalance >= wordCount ? 'Execute (Using Credits)' : `Refill & Execute (₦1,000)`}
          </Button>
        </div>

        {/* Output Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col h-[500px] md:h-[650px]">
          <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Result</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">Converted output</p>
              </div>
            </div>
            {convertedText && (
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                className="rounded-full px-4 md:px-6 border-[#e5e7eb] text-zinc-900 font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-black hover:text-white transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-zinc-300 font-bold leading-relaxed whitespace-pre-wrap text-sm md:text-base">
            {convertedText ? (
              convertedText
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
                <Globe2 className="w-10 h-10 md:w-12 md:h-12 mb-4 opacity-10" />
                Converted output will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-600 rounded-[32px] md:rounded-[48px] p-6 md:p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-white/10 blur-[60px] md:blur-[100px] rounded-full group-hover:bg-white/20 transition-all duration-700" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-md">
            <Info className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2">Multi-Cultural Support</h4>
            <p className="text-xs md:text-sm text-indigo-100 font-medium leading-relaxed">
              Our tool handles <span className="text-white font-bold">Nigerian Pidgin, Yoruba, Igbo, and Hausa</span> with deep cultural nuance. Now with a carry-over balance system.
            </p>
          </div>
          <Badge className="bg-white text-indigo-600 px-4 md:px-6 py-2 md:py-3 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl">
            ₦1,000 / 2,000 Words
          </Badge>
        </div>
      </div>
    </div>
  );
}
