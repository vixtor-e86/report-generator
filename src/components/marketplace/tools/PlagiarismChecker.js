"use client";
import { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, Upload, 
  FileText, AlertTriangle, ExternalLink,
  Check, Zap, Search, Layers,
  Timer, FileSignature, Wallet
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/marketplace/UserContext';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PlagiarismChecker({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog,
  setCustomPrice
}) {
  const { user } = useUser();
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, processing, completed
  const [wordBalance, setWordBalance] = useState(0);

  // Price Calculation
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const currentPrice = 2000; // Fixed refill price

  useEffect(() => {
    if (user) fetchBalance();
  }, [user]);

  const fetchBalance = async () => {
    const { data } = await supabase
      .from('tool_word_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('tool_id', 'plagiarism-checker')
      .maybeSingle();
    
    if (data) setWordBalance(data.balance);
  };

  useEffect(() => {
    if (setCustomPrice) setCustomPrice(currentPrice);
    return () => { if (setCustomPrice) setCustomPrice(null); };
  }, [currentPrice, setCustomPrice]);

  // Handle Payment Completion
  useEffect(() => {
    if (hasPaid && inputText.trim()) {
      startScanProcess(true);
    }
  }, [hasPaid]);

  const extractPdfText = async (arrayBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(" ") + "\n";
      }
      return fullText;
    } catch (err) {
      console.error("PDF Extraction Error:", err);
      throw new Error("Failed to extract text from PDF");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['.docx', '.pdf', '.txt', '.doc'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      return toast.error("File format not supported. Use PDF, DOCX, or TXT.");
    }

    setIsExtracting(true);
    setFileName(file.name);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        
        let extractedText = "";
        if (ext === '.docx' || ext === '.doc') {
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
        } else if (ext === '.pdf') {
          extractedText = await extractPdfText(arrayBuffer);
        } else if (ext === '.txt') {
          extractedText = new TextDecoder().decode(arrayBuffer);
        }
        
        if (!extractedText.trim()) {
          throw new Error("No readable text found in document.");
        }

        setInputText(extractedText);
        setIsExtracting(false);
        toast.success(`${file.name} uploaded and text extracted.`);
      };
      
      reader.readAsArrayBuffer(file);

    } catch (err) {
      console.error("Extraction error:", err);
      toast.error(err.message || "Failed to extract text from file.");
      setIsExtracting(false);
      setFileName('');
    }
  };

  const startScanProcess = async (skipPaymentCheck = false) => {
    if (!inputText.trim()) return;
    
    if (inputText.length < 100) {
        return toast.error("Content too short. Please provide at least 100 characters for an accurate scan.");
    }

    // Word Balance Logic
    if (!skipPaymentCheck) {
      if (wordBalance < wordCount) {
        setShowPaymentDialog(true);
        return;
      }
    }

    setScanStatus('processing');
    setIsProcessing(true);
    
    try {
      // 1. Refill balance if user just paid
      if (skipPaymentCheck) {
        const { data: current } = await supabase
          .from('tool_word_balances')
          .select('balance')
          .eq('user_id', user.id)
          .eq('tool_id', 'plagiarism-checker')
          .maybeSingle();
        
        const newBalance = (current?.balance || 0) + 10000;
        
        await supabase
          .from('tool_word_balances')
          .upsert({ 
            user_id: user.id, 
            tool_id: 'plagiarism-checker', 
            balance: newBalance,
            updated_at: new Date().toISOString()
          });
        
        setWordBalance(newBalance);
      }

      const response = await fetch('/api/marketplace/tools/plagiarism-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      
      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || 'Scan failed');
      }
      
      // 2. Deduct words from balance
      const { data: finalBalData } = await supabase
        .from('tool_word_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('tool_id', 'plagiarism-checker')
        .single();
      
      const updatedBalance = Math.max(0, finalBalData.balance - wordCount);
      
      await supabase
        .from('tool_word_balances')
        .update({ balance: updatedBalance })
        .eq('user_id', user.id)
        .eq('tool_id', 'plagiarism-checker');

      setWordBalance(updatedBalance);
      setResult(data.data);
      setScanStatus('completed');
      setHasPaid(false);
      toast.success('Plagiarism scan complete!');
      
    } catch (err) {
      toast.error('System under maintenance. Please try again later.');
      setScanStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Configuration Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 shadow-2xl flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Enterprise Plagiarism Scan</h3>
          </div>
        </div>
        
        <div className="h-8 w-px bg-zinc-800 mx-2" />

        <div className="flex items-center gap-4">
          <Badge className="bg-zinc-800 text-zinc-300 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            {wordCount.toLocaleString()} Words
          </Badge>
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              <Wallet className="w-4 h-4 text-emerald-400" />
              {wordBalance.toLocaleString()} Credits
          </div>
          <Badge className="bg-white text-black border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
            Refill: ₦2,000 / 10k Words
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-12">
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center">
                <FileSignature className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Content Source</h2>
                <p className="text-sm text-slate-500 font-medium">Text, PDF, or DOCX supported</p>
              </div>
            </div>
            <div className="flex gap-4">
                <label className="cursor-pointer group">
                    <input type="file" accept=".docx,.pdf,.doc,.txt" onChange={handleFileChange} className="hidden" />
                    <div className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white hover:bg-black rounded-full transition-all shadow-xl">
                        {isExtracting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{fileName ? 'Change File' : 'Upload File'}</span>
                    </div>
                </label>
                <button 
                  onClick={() => { setInputText(''); setFileName(''); setResult(null); setScanStatus('idle'); }}
                  className="px-6 py-3 border border-zinc-200 rounded-full text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-red-500 hover:border-red-100 transition-all"
                >
                  Clear
                </button>
            </div>
          </div>
          
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={scanStatus === 'processing'}
            placeholder="Paste text here or upload a document to extract content..."
            className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-50 border-none rounded-[32px] p-10 focus:ring-2 focus:ring-zinc-900/5 text-zinc-900 leading-relaxed font-bold resize-none text-lg"
          />

          {scanStatus === 'idle' && (
            <Button 
                onClick={() => setShowPaymentDialog(true)}
                disabled={!inputText.trim()}
                className="w-full bg-black hover:bg-zinc-800 text-white rounded-[24px] py-10 font-black uppercase text-sm tracking-[0.3em] shadow-2xl mt-8 flex items-center justify-center gap-4 shrink-0 transition-all active:scale-[0.98]"
            >
                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                Start Plagiarism Audit
            </Button>
          )}

          {scanStatus === 'processing' && (
            <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <Timer className="w-5 h-5 text-zinc-900 animate-pulse" />
                        <span className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                            Analyzing Manuscript...
                        </span>
                    </div>
                </div>
                <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div className="h-full bg-zinc-900 animate-progress-indeterminate" style={{ width: '40%' }} />
                </div>
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Performing deep-layer linguistic cross-matching</p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="bg-zinc-900 rounded-[64px] p-12 shadow-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 text-white border border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-12">
            <div className="flex items-center gap-10">
              <div className="relative w-40 h-40 flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                <div className={`absolute inset-4 rounded-full border border-white/5 ${result.score > 20 ? 'animate-pulse text-red-500' : 'text-emerald-500'}`} />
                <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Similarity</p>
                    <p className={`text-5xl font-black ${result.score > 20 ? 'text-red-500' : 'text-white'}`}>{result.score}%</p>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Audit Results</h3>
                <p className="text-zinc-600 font-medium max-w-md">Our advanced engine has completed the analysis. A score of 0% indicates complete originality.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
                <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 text-center border border-white/10 w-40">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Words</p>
                    <p className="text-2xl font-black text-white">{(result?.total_words || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white text-black rounded-[32px] p-8 text-center w-40 shadow-xl">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Integrity</p>
                    <p className="text-xl font-black uppercase tracking-tighter">
                        {(result?.score || 0) < 5 ? 'Elite' : (result?.score || 0) < 20 ? 'High' : 'Flagged'}
                    </p>
                </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10">
                        <Layers className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-black text-white uppercase tracking-widest">Matched Sources</h4>
                </div>
                <Badge className="bg-zinc-800 text-zinc-600 border-none font-black text-[10px] uppercase px-4 py-2">{(result?.sources?.length || 0)} Matches Found</Badge>
            </div>

            {result.sources && result.sources.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {result.sources.map((source, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="px-4 py-2 bg-red-500 text-white rounded-full text-[10px] font-black uppercase shadow-lg">
                                        {source.score}% Match
                                    </div>
                                    {source.url && (
                                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white text-zinc-600 hover:text-black transition-all">
                                          <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                </div>
                                <h5 className="font-black text-white uppercase tracking-tight text-md mb-4 leading-tight line-clamp-2">{source.title || 'Academic Source'}</h5>
                                <div className="h-px w-12 bg-zinc-700 mb-6 group-hover:w-full transition-all duration-500" />
                                <p className="text-sm text-zinc-600 leading-relaxed font-medium line-clamp-3 mb-8 italic">"{source.snippet || 'No snippet available'}"</p>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500 group-hover:text-white transition-colors">
                                <Search className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] truncate">
                                  {source.url ? new URL(source.url).hostname : 'Database Match'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-white/5 rounded-[64px] border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-white/5">
                        <Check className="w-10 h-10" />
                    </div>
                    <p className="text-xl font-black text-white uppercase tracking-widest mb-2">100% Original</p>
                    <p className="text-zinc-500 font-medium max-w-xs mx-auto">No matching records were found in our global database.</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
