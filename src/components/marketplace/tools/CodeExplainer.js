import { useState, useEffect } from 'react';
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

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && code.trim()) {
      handleExplain(true);
    }
  }, [hasPaid]);

  const lineCount = code.split('\n').filter(l => l.trim()).length;
  const MAX_LINES = 500;
  const isOverLimit = lineCount > MAX_LINES;

  const handleExplain = async (skipPaymentCheck = false) => {
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
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Explanation copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Settings Bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-6 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Braces className="w-5 h-5" />
          </div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-50 border-slate-100 rounded-lg px-4 py-2 font-bold text-xs uppercase tracking-widest text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
          >
            <option value="javascript">JavaScript / TS</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++ / C</option>
            <option value="php">PHP</option>
            <option value="sql">SQL</option>
            <option value="css">CSS / HTML</option>
          </select>
        </div>

        <div className="ml-auto">
          <Badge variant="outline" className={`rounded-full px-4 py-1.5 font-black text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-600'}`}>
            {lineCount} / {MAX_LINES} Lines
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Input Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Terminal className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Code Core</h2>
                    <p className="text-sm text-slate-500 font-medium">Technical logic</p>
                </div>
            </div>
            <button 
              onClick={() => setCode('')}
              className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>

          <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your code here...
function example() {
  console.log('Let AI explain this!');
}"
            className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900 text-emerald-400 font-mono text-sm rounded-[32px] border-4 border-zinc-800 p-8 focus:border-emerald-500/30 focus:outline-none transition-all resize-none shadow-2xl"
          />

          <Button 
            onClick={() => handleExplain()}
            disabled={isProcessing || !code.trim() || isOverLimit}
            className="w-full bg-black hover:bg-zinc-800 text-white rounded-[24px] py-8 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-8 flex items-center justify-center gap-4 shrink-0"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
            {isProcessing ? 'Analyzing Logic...' : `Execute Explainer (₦300)`}
          </Button>
        </div>

        {/* Output Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Logic Breakdown</h2>
                <p className="text-sm text-slate-500 font-medium">Deep analysis</p>
              </div>
            </div>
            {explanation && (
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                className="rounded-full px-6 border-[#e5e7eb] text-zinc-900 font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied' : 'Copy Results'}
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900 rounded-[32px] p-8 text-zinc-300 font-medium leading-relaxed prose prose-invert prose-emerald max-w-none">
            {explanation ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
                <Terminal className="w-12 h-12 mb-4 opacity-10" />
                Logic breakdown will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {!explanation && !isProcessing && (
        <div className="py-32 text-center bg-white border border-dashed border-slate-200 rounded-[64px]">
          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200">
            <Code2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Deep Logic Analysis</h2>
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em] max-w-xs mx-auto">
            Paste your code snippet above to receive a comprehensive line-by-line explanation
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="py-32 text-center bg-white border border-[#e5e7eb] rounded-[64px] animate-pulse">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-emerald-100 rounded-[40px] animate-ping opacity-25" />
            <div className="relative w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center text-emerald-600">
              <RefreshCw className="w-12 h-12 animate-spin" />
            </div>
          </div>
          <p className="text-emerald-600 font-black uppercase text-[10px] tracking-[0.3em] animate-bounce">
            Deconstructing your code...
          </p>        </div>
      )}

      {/* Warning Card */}
      <div className="bg-zinc-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 blur-[100px] rounded-full group-hover:bg-emerald-600/20 transition-all duration-700" />
        <div className="relative flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
            <Info className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">Learning Tip</h4>
            <p className="text-slate-400 font-medium leading-relaxed">
              Use this tool to understand <span className="text-white font-bold">complex algorithms</span> or <span className="text-white font-bold">legacy code</span>. Don't just copy-paste; read the breakdown to improve your own engineering skills!
            </p>
          </div>
          <Badge className="bg-emerald-500 text-white px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
            500 Lines Support
          </Badge>
        </div>
      </div>
    </div>
  );
}
