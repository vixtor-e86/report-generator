"use client";
import { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Sparkles, RefreshCw, Upload, 
  FileText, FileCheck, AlertTriangle, ExternalLink,
  Check, Zap, Info, ArrowRight, Gauge, Layers,
  Copy, Search, FileSignature, Timer
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
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, submitting, processing, completed
  const [progress, setProgress] = useState(0);
  const [scanId, setScanId] = useState('');
  
  const pollingInterval = useRef(null);

  // Price Calculation
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const currentPrice = Math.ceil(wordCount / 10000) * 1500 || 1500;

  useEffect(() => {
    if (setCustomPrice) setCustomPrice(currentPrice);
    return () => { if (setCustomPrice) setCustomPrice(null); };
  }, [currentPrice, setCustomPrice]);

  // Handle Payment Completion
  useEffect(() => {
    if (hasPaid && (inputText.trim() || fileBase64)) {
      startScanProcess();
    }
  }, [hasPaid]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['.docx', '.pdf', '.txt', '.doc'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      return toast.error("File format not supported for direct scan.");
    }

    setIsExtracting(true);
    setFileName(file.name);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result.split(',')[1];
        setFileBase64(base64);
        
        // Local extraction for word count estimate only
        if (ext === '.docx') {
          const result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
          setInputText(result.value);
        } else if (ext === '.txt') {
          setInputText(new TextDecoder().decode(event.target.result));
        } else {
          // For PDF, we'll use a placeholder word count or simple estimate if we can't extract easily
          // For now, let's assume wordCount 1000 if we can't extract, or just set it to 10k base
          setInputText("Estimation placeholder for file content..."); 
        }
        
        setIsExtracting(false);
        toast.success(`${file.name} prepared for enterprise scan.`);
      };
      
      if (ext === '.txt') reader.readAsArrayBuffer(file);
      else reader.readAsDataURL(file); // For base64

    } catch (err) {
      console.error("Preparation error:", err);
      toast.error("Failed to prepare file.");
      setIsExtracting(false);
    }
  };

  const startScanProcess = async () => {
    setScanStatus('submitting');
    setIsProcessing(true);
    
    const generatedScanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setScanId(generatedScanId);

    try {
      const response = await fetch('/api/marketplace/tools/plagiarism-checker/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText, 
          fileBase64, 
          filename: fileName,
          scanId: generatedScanId 
        })
      });
      
      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned an invalid response format (Status: ${response.status})`);
      }

      if (data.error) throw new Error(data.error);
      
      setScanStatus('processing');
      // Start Polling
      startPolling(generatedScanId);
      
    } catch (err) {
      toast.error(err.message);
      setIsProcessing(false);
      setScanStatus('idle');
    }
  };

  const startPolling = (id) => {
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/marketplace/tools/plagiarism-checker/results?scanId=${id}`);
        
        let data;
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Server returned an invalid response format (Status: ${response.status})`);
        }

        if (data.status === 'completed') {
          clearInterval(pollingInterval.current);
          setResult(data.data);
          setScanStatus('completed');
          setIsProcessing(false);
          setHasPaid(false);
          toast.success('Enterprise scan complete!');
        } else if (data.status === 'processing') {
          setProgress(data.progress || 0);
        } else if (data.status === 'error') {
          throw new Error(data.message || 'Scan failed');
        }
      } catch (err) {
        clearInterval(pollingInterval.current);
        toast.error(err.message);
        setIsProcessing(false);
        setScanStatus('idle');
      }
    }, 5000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Configuration Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 shadow-2xl flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Enterprise Scan</h3>
          </div>
        </div>
        
        <div className="h-8 w-px bg-zinc-800 mx-2" />

        <div className="flex items-center gap-4">
          <Badge className="bg-zinc-800 text-zinc-400 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            {wordCount.toLocaleString()} Words Detected
          </Badge>
          <Badge className="bg-white text-black border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
            Total Fee: ₦{currentPrice.toLocaleString()}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-12">
        {/* Input Area */}
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Content Repository</h2>
                <p className="text-sm text-slate-500 font-medium">Enterprise integrity verification</p>
              </div>
            </div>
            <div className="flex gap-4">
                <label className="cursor-pointer group">
                    <input type="file" accept=".docx,.pdf,.doc,.txt" onChange={handleFileChange} className="hidden" />
                    <div className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white hover:bg-black rounded-full transition-all shadow-xl">
                        {isExtracting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{fileName ? 'Update Document' : 'Upload Document'}</span>
                    </div>
                </label>
                <button 
                  onClick={() => { setInputText(''); setFileName(''); setFileBase64(''); setResult(null); setScanStatus('idle'); }}
                  className="px-6 py-3 border border-zinc-200 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-red-500 hover:border-red-100 transition-all"
                >
                  Clear
                </button>
            </div>
          </div>
          
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={scanStatus !== 'idle'}
            placeholder="Paste your manuscript here or upload a document for professional verification..."
            className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-50 border-none rounded-[32px] p-10 focus:ring-2 focus:ring-zinc-900/5 text-zinc-900 leading-relaxed font-bold resize-none text-lg"
          />

          {scanStatus === 'idle' && (
            <Button 
                onClick={() => setShowPaymentDialog(true)}
                disabled={!inputText.trim() && !fileBase64}
                className="w-full bg-black hover:bg-zinc-800 text-white rounded-[24px] py-10 font-black uppercase text-sm tracking-[0.3em] shadow-2xl mt-8 flex items-center justify-center gap-4 shrink-0 transition-all active:scale-[0.98]"
            >
                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                Initialize Enterprise Scan
            </Button>
          )}

          {(scanStatus === 'submitting' || scanStatus === 'processing') && (
            <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <Timer className="w-5 h-5 text-zinc-900 animate-pulse" />
                        <span className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                            {scanStatus === 'submitting' ? 'Submitting to Cloud...' : `Analyzing: ${progress}% Complete`}
                        </span>
                    </div>
                    <Badge className="bg-zinc-100 text-zinc-500 border-none font-black text-[10px]">ID: {scanId.split('-').pop()}</Badge>
                </div>
                <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div 
                      className="h-full bg-zinc-900 transition-all duration-1000 ease-out" 
                      style={{ width: `${scanStatus === 'submitting' ? 10 : progress}%` }}
                    />
                </div>
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Our servers are comparing your work against 400 billion+ records</p>
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Results Section (Mainly Black/Professional) */}
      {result && (
        <div className="bg-zinc-900 rounded-[64px] p-12 shadow-3xl animate-in fade-in slide-in-from-bottom-10 duration-700 text-white border border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-12">
            <div className="flex items-center gap-10">
              <div className="relative w-40 h-40 flex items-center justify-center bg-white/5 rounded-full border border-white/10 group">
                <div className="absolute inset-4 rounded-full border border-white/5 animate-ping opacity-20" />
                <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Similarity</p>
                    <p className="text-5xl font-black text-white">{result.score}%</p>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Integrity Audit Complete</h3>
                <p className="text-zinc-400 font-medium max-w-md">Our enterprise engine has finished cross-referencing your document. Below is the detailed breakdown of matched segments.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
                <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 text-center border border-white/10 w-40">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Words</p>
                    <p className="text-2xl font-black text-white">{result.total_words.toLocaleString()}</p>
                </div>
                <div className="bg-white text-black rounded-[32px] p-8 text-center w-40 shadow-xl">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Safety</p>
                    <p className="text-xl font-black uppercase tracking-tighter">
                        {result.score < 15 ? 'Elite' : result.score < 30 ? 'High' : 'Moderate'}
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
                    <h4 className="text-lg font-black text-white uppercase tracking-widest">Matched Source Repositories</h4>
                </div>
                <Badge className="bg-zinc-800 text-zinc-400 border-none font-black text-[10px] uppercase px-4 py-2">{result.sources?.length || 0} Records Found</Badge>
            </div>

            {result.sources && result.sources.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {result.sources.map((source, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="px-4 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase shadow-lg">
                                        {source.score}% Overlap
                                    </div>
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white text-zinc-400 hover:text-black transition-all">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                                <h5 className="font-black text-white uppercase tracking-tight text-md mb-4 leading-tight line-clamp-2">{source.title}</h5>
                                <div className="h-px w-12 bg-zinc-700 mb-6 group-hover:w-full transition-all duration-500" />
                                <p className="text-sm text-zinc-400 leading-relaxed font-medium line-clamp-3 mb-8 italic">"{source.snippet}"</p>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500 group-hover:text-white transition-colors">
                                <Search className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] truncate">{new URL(source.url).hostname}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-white/5 rounded-[64px] border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-white/5">
                        <Check className="w-10 h-10" />
                    </div>
                    <p className="text-xl font-black text-white uppercase tracking-widest mb-2">Absolute Originality</p>
                    <p className="text-zinc-500 font-medium max-w-xs mx-auto">No matching patterns were found across our global indexed databases.</p>
                </div>
            )}
          </div>

          <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 text-zinc-500">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <p className="text-[10px] font-black uppercase tracking-widest max-w-sm">Institutional Notice: These results are provided by professional cross-matching. Final academic judgment rests with your supervisor.</p>
            </div>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white hover:text-black rounded-full px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] transition-all">
                Print Official Audit
            </Button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-zinc-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-100/5 blur-[100px] rounded-full" />
        <div className="relative flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">Institutional Integrity</h4>
            <p className="text-zinc-400 font-medium leading-relaxed">
              We leverage enterprise indexing to check your work against <span className="text-white font-bold">billions of data points</span>. This is the same engine used by top global universities to ensure academic honesty.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge className="bg-white text-black px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg">
                Secure Scan
            </Badge>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">Encrypted Connection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
