"use client";
import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Sparkles, RefreshCw, Upload, 
  FileText, FileCheck, AlertTriangle, ExternalLink,
  Check, Zap, Info, ArrowRight, Gauge, Layers,
  Copy, Search
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import mammoth from 'mammoth';

export default function PlagiarismChecker({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog,
  setCustomPrice
}) {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const currentPrice = Math.ceil(wordCount / 10000) * 1500 || 1500;

  // Sync price with parent for payment dialog
  useEffect(() => {
    if (setCustomPrice) {
      setCustomPrice(currentPrice);
    }
    // Cleanup on unmount
    return () => {
      if (setCustomPrice) setCustomPrice(null);
    };
  }, [currentPrice, setCustomPrice]);

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && inputText.trim()) {
      handleScan(true);
    }
  }, [hasPaid]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      return toast.error("Currently, only .docx files are supported for extraction.");
    }

    setIsExtracting(true);
    setFileName(file.name);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
        setIsExtracting(false);
        toast.success(`Extracted ${result.value.split(/\s+/).length} words from ${file.name}`);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Failed to extract text from file.");
      setIsExtracting(false);
    }
  };

  const handleScan = async (skipPaymentCheck = false) => {
    if (!inputText.trim()) return toast.error("Please paste text or upload a file first.");
    
    if (wordCount < 10) return toast.error("Text is too short for a reliable scan (min 10 words).");

    if (!hasPaid && !skipPaymentCheck) {
      // Logic for dynamic pricing can be passed to the payment dialog if it supports it
      // For now, we trigger the dialog. We might need to pass the price.
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/marketplace/tools/plagiarism-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data.data);
      toast.success('Integrity scan complete!');
      setHasPaid(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 15) return 'text-emerald-500';
    if (score < 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Configuration Bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-6 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Scan Intensity</h3>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          <Badge className="bg-white text-zinc-900 shadow-sm border-none px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest">Deep Scan</Badge>
          <span className="px-4 py-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">Standard</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 font-black text-[10px] text-slate-400 border-slate-200">
            {wordCount.toLocaleString()} Words
          </Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
            ₦{currentPrice.toLocaleString()} Total
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-12">
        {/* Input Area */}
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Content for Scan</h2>
                <p className="text-sm text-slate-500 font-medium">Text or .docx uploads</p>
              </div>
            </div>
            <div className="flex gap-4">
                <label className="cursor-pointer group">
                    <input type="file" accept=".docx" onChange={handleFileChange} className="hidden" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-all border border-slate-200">
                        {isExtracting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{fileName ? 'Change File' : 'Upload DOCX'}</span>
                    </div>
                </label>
                <button 
                onClick={() => { setInputText(''); setFileName(''); }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                Clear
                </button>
            </div>
          </div>
          
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your research content here to check for plagiarism..."
            className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border-[#e5e7eb] rounded-[32px] p-8 focus:border-black focus:ring-0 text-zinc-900 leading-relaxed font-bold resize-none"
          />

          <Button 
            onClick={() => handleScan()}
            disabled={isProcessing || isExtracting || !inputText.trim()}
            className="w-full bg-black hover:bg-zinc-800 text-white rounded-[24px] py-10 font-black uppercase text-sm tracking-[0.2em] shadow-xl mt-8 flex items-center justify-center gap-4 shrink-0"
          >
            {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 text-yellow-400" />}
            {isProcessing ? 'Scanning Database...' : `Execute Scan (₦${currentPrice.toLocaleString()})`}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 pb-8 border-b border-slate-50 gap-8">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center bg-slate-50 rounded-full border-4 border-slate-100">
                <span className={`text-2xl font-black ${getScoreColor(result.score)}`}>{result.score}%</span>
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full clip-path-score" style={{ clipPath: `inset(${100-result.score}% 0 0 0)` }} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Integrity Report</h3>
                <p className="text-sm text-slate-500 font-medium">Similarity detected in {result.sources?.length || 0} sources</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Words</p>
                    <p className="text-xl font-black text-zinc-900">{result.total_words}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-lg font-black uppercase ${result.score < 20 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {result.score < 20 ? 'Safe' : 'Action Required'}
                    </p>
                </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Search className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Matching Sources</h4>
            </div>

            {result.sources && result.sources.length > 0 ? (
                <div className="grid gap-4">
                    {result.sources.map((source, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 hover:border-blue-200 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px]">{source.score}% Match</Badge>
                                    <h5 className="font-black text-zinc-900 uppercase tracking-tight text-sm truncate max-w-md">{source.title || source.url}</h5>
                                </div>
                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-blue-600">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{source.snippet}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">No matching sources found</p>
                    <p className="text-xs text-slate-400 font-medium">Your content is highly original.</p>
                </div>
            )}
          </div>
        </div>
      )}

      {!result && !isProcessing && (
        <div className="py-32 text-center bg-white border border-dashed border-slate-200 rounded-[64px]">
          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Originality Engine</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] max-w-sm mx-auto">
            Scan your project against billions of web pages and academic documents
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="py-32 text-center bg-white border border-[#e5e7eb] rounded-[64px] animate-pulse">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-red-100 rounded-[40px] animate-ping opacity-25" />
            <div className="relative w-24 h-24 bg-red-50 rounded-[40px] flex items-center justify-center text-red-600">
              <RefreshCw className="w-12 h-12 animate-spin" />
            </div>
          </div>
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] animate-bounce">
            Searching global archives...
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-zinc-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 blur-[100px] rounded-full group-hover:bg-emerald-600/20 transition-all duration-700" />
        <div className="relative flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
            <Info className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">Academic Integrity</h4>
            <p className="text-slate-400 font-medium leading-relaxed">
              We check your work against <span className="text-white font-bold">400 billion+</span> web pages and academic journals. Use the <span className="text-emerald-400 font-bold">AI Humanizer</span> later to refine your writing style!
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge className="bg-emerald-500 text-white px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg">
                Verified Safe
            </Badge>
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Institutional Grade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
