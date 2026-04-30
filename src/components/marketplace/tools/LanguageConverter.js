"use client";
import { useState, useEffect } from 'react';
import { 
  Languages, Sparkles, RefreshCw, Copy, 
  Check, Zap, Info, ArrowRight, MessageSquare,
  Globe2, Type
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';

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
  const [inputText, setInputText] = useState('');
  const [convertedText, setConvertedText] = useState('');
  const [targetLang, setTargetLang] = useState('pidgin');
  const [mode, setMode] = useState('standard');
  const [copied, setCopied] = useState(false);

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && inputText.trim()) {
      handleConvert(true);
    }
  }, [hasPaid]);

  const handleConvert = async (skipPaymentCheck = false) => {
    if (!inputText.trim()) return toast.error("Please enter text to convert.");
    
    if (!hasPaid && !skipPaymentCheck) {
      setShowPaymentDialog(true);
      return;
    }

    const wordCount = inputText.trim().split(/\s+/).length;
    if (wordCount > 1000) return toast.error("Text exceeds the 1000-word limit.");

    setIsProcessing(true);
    try {
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
      setConvertedText(data.convertedText);
      toast.success('Conversion complete!');
      setHasPaid(false);
    } catch (err) {
      toast.error(err.message);
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

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Settings Bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-6 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Globe2 className="w-5 h-5" />
          </div>
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-slate-50 border-slate-100 rounded-lg px-4 py-2 font-bold text-xs uppercase tracking-widest text-zinc-600 focus:outline-none focus:border-indigo-500 transition-all"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.icon} {lang.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
            <Type className="w-5 h-5" />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
            {MODES.map(m => (
              <button 
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === m.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto">
          <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${wordCount > 1000 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {wordCount} / 1000 Words
          </Badge>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-8 shadow-sm relative flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" /> Source Text
            </h3>
            <button 
              onClick={() => setInputText('')}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type your text here (up to 1000 words)..."
              className="w-full h-full p-6 bg-slate-50 border-none rounded-[32px] font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none scrollbar-thin scrollbar-thumb-slate-200"
            />
          </div>
          <div className="mt-8">
            <Button 
              onClick={() => handleConvert()}
              disabled={isProcessing || !inputText.trim() || wordCount > 1000}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-8 font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Languages className="w-5 h-5" />
                  Convert Language
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Output Pane */}
        <div className="bg-zinc-900 rounded-[48px] p-8 shadow-2xl relative flex flex-col h-[600px] overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-indigo-600/10 transition-all duration-700" />
          <div className="relative flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Result
              </h3>
              {convertedText && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className="text-white hover:bg-white/10 rounded-full px-4 font-black uppercase text-[10px] tracking-widest gap-2"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-[32px] p-8 border border-white/10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {convertedText ? (
                <p className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                  {convertedText}
                </p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                    <Languages className="w-8 h-8" />
                  </div>
                  <p className="text-white/20 font-black uppercase text-[10px] tracking-[0.2em] max-w-[200px]">
                    Your converted text will appear here after processing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-600 rounded-[48px] p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full group-hover:bg-white/20 transition-all duration-700" />
        <div className="relative flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
            <Info className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">Multi-Cultural Support</h4>
            <p className="text-indigo-100 font-medium leading-relaxed">
              Our tool handles <span className="text-white font-bold">Nigerian Pidgin, Yoruba, Igbo, and Hausa</span> with deep cultural nuance. Perfect for translating research notes, local stories, or professional documents.
            </p>
          </div>
          <Badge className="bg-white text-indigo-600 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl">
            ₦500 / Use
          </Badge>
        </div>
      </div>
    </div>
  );
}
