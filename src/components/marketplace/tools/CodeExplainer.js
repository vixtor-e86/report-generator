import { useState, useEffect, useCallback } from 'react';
import { 
  Code2, Sparkles, RefreshCw, FileCode, 
  Terminal, Copy, Check, Zap, Info, Braces
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CodeExplainer({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog
}) {
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false);

  const lineCount = code.split('\n').filter(l => l.trim()).length;
  const MAX_LINES = 500;
  const isOverLimit = lineCount > MAX_LINES;

  const handleExplain = useCallback(async (skipPaymentCheck = false) => {
    if (!code.trim()) return toast.error("Please paste your code snippet first.");
    
    if (isOverLimit) return toast.error(`Code exceeds the ${MAX_LINES}-line limit.`);

    if (!hasPaid && !skipPaymentCheck) {
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/marketplace/tools/code-explainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setExplanation(data.explanation);
      toast.success('Code explained successfully!');
      setHasPaid(false); // Reset for next use
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [code, language, hasPaid, isOverLimit, setIsProcessing, setShowPaymentDialog, setHasPaid]);

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && code.trim()) {
      handleExplain(true);
    }
  }, [hasPaid, code, handleExplain]);

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Explanation copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
      {/* Settings Bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-600">
            <Braces className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-50 border-slate-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 font-bold text-[10px] md:text-xs uppercase tracking-widest text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
          >
            <option value="javascript">JS / TS</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++ / C</option>
            <option value="php">PHP</option>
            <option value="sql">SQL</option>
            <option value="css">CSS / HTML</option>
          </select>
        </div>

        <div className="ml-auto">
          <Badge variant="outline" className={`rounded-full px-3 md:px-4 py-1 md:py-1.5 font-black text-[9px] md:text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-600'}`}>
            {lineCount} / {MAX_LINES} Lines
          </Badge>
        </div>
      </div>

      {/* Input Pane - Full Width */}
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600">
                  <Terminal className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                  <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Code Core</h2>
                  <p className="text-[10px] md:text-sm text-slate-500 font-medium">Technical logic</p>
              </div>
          </div>
          <button 
            onClick={() => setCode('')}
            className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        </div>

        <textarea 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste your code here..."
          className="flex-1 min-h-[250px] overflow-y-auto custom-scrollbar bg-zinc-900 text-emerald-400 font-mono text-xs md:text-sm rounded-[24px] md:rounded-[32px] border-4 border-zinc-800 p-6 md:p-8 focus:border-emerald-500/30 focus:outline-none transition-all resize-none shadow-2xl"
        />

        <Button 
          onClick={() => handleExplain()}
          disabled={isProcessing || !code.trim() || isOverLimit}
          className="w-full bg-black hover:bg-zinc-800 text-white rounded-[20px] md:rounded-[24px] py-6 md:py-8 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-xl mt-6 flex items-center justify-center gap-3 md:gap-4 shrink-0"
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin text-emerald-400" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />}
          {isProcessing ? 'Analyzing Logic...' : `Execute Explainer (₦500)`}
        </Button>
      </div>

      {/* Output / Explanation Results */}
      {explanation && (
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                <FileCode className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Deep Logic Analysis</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">Deep analysis</p>
              </div>
            </div>
            <Button 
              onClick={handleCopy} 
              variant="outline" 
              className="rounded-full px-4 md:px-6 border-[#e5e7eb] text-zinc-900 font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-black hover:text-white transition-all h-10"
            >
              {copied ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-green-600" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="prose prose-slate max-w-none text-sm md:text-base
            prose-headings:text-zinc-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed
            prose-strong:text-zinc-900 prose-strong:font-black
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-emerald-700 prose-code:font-bold
            prose-pre:bg-zinc-900 prose-pre:rounded-[20px] md:prose-pre:rounded-[24px] prose-pre:p-4 md:prose-pre:p-6 prose-pre:shadow-xl
            prose-table:border prose-table:border-slate-100 prose-table:rounded-2xl prose-table:overflow-hidden
            prose-th:bg-slate-50 prose-th:p-3 md:prose-th:p-4 prose-th:text-[9px] md:prose-th:text-[10px] prose-th:font-black prose-th:uppercase prose-th:tracking-widest
            prose-td:p-3 md:prose-td:p-4 prose-td:text-xs md:prose-td:text-sm prose-td:border-t prose-td:border-slate-50
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="py-16 md:py-32 text-center bg-white border border-[#e5e7eb] rounded-[48px] md:rounded-[64px] animate-pulse px-6">
          <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto mb-6 md:mb-8">
            <div className="absolute inset-0 bg-emerald-100 rounded-[32px] md:rounded-[40px] animate-ping opacity-25" />
            <div className="relative w-16 h-16 md:w-24 md:h-24 bg-emerald-50 rounded-[32px] md:rounded-[40px] flex items-center justify-center text-emerald-600">
              <RefreshCw className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
            </div>
          </div>
          <p className="text-emerald-600 font-black uppercase text-[8px] md:text-[10px] tracking-[0.3em] animate-bounce">
            Deconstructing your code...
          </p>
        </div>
      )}

      {/* Empty State / Placeholder */}
      {!explanation && !isProcessing && (
        <div className="py-16 md:py-32 text-center bg-white border border-dashed border-slate-200 rounded-[48px] md:rounded-[64px] px-6">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-[32px] md:rounded-[40px] flex items-center justify-center mx-auto mb-6 md:mb-8 text-slate-200">
            <Code2 className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Deep Logic Analysis</h2>
          <p className="text-slate-600 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.2em] max-w-xs mx-auto">
            Paste your code snippet above to receive a comprehensive line-by-line explanation
          </p>
        </div>
      )}

      {/* Warning Card */}
      <div className="bg-zinc-900 rounded-[32px] md:rounded-[48px] p-6 md:p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-emerald-600/10 blur-[60px] md:blur-[100px] rounded-full group-hover:bg-emerald-600/20 transition-all duration-700" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-md">
            <Info className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2">Learning Tip</h4>
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">
              Use this tool to understand <span className="text-white font-bold">complex algorithms</span> or <span className="text-white font-bold">legacy code</span>. Don&apos;t just copy-paste; read the breakdown to improve your own engineering skills!
            </p>
          </div>
          <Badge className="bg-emerald-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
            500 Lines Support
          </Badge>
        </div>
      </div>
    </div>
  );
}
