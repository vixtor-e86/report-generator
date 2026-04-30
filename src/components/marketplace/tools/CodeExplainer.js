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

  const handleExplain = async (skipPaymentCheck = false) => {
    if (!code.trim()) return toast.error("Please paste your code snippet first.");
    
    if (!hasPaid && !skipPaymentCheck) {
      setShowPaymentDialog(true);
      return;
    }

    const lineCount = code.split('\n').length;
    if (lineCount > 550) return toast.error("Code exceeds the 500-line limit.");

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
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Input Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
        
        <div className="relative space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Braces className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Paste Your Code</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supports up to 500 lines of code</p>
                </div>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-50 border-slate-100 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-widest text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
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

          <div className="relative group">
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your code here...
function example() {
  console.log('Let Claude explain this!');
}"
              className="w-full h-[400px] p-8 bg-zinc-900 text-emerald-400 font-mono text-sm rounded-[32px] border-4 border-zinc-800 focus:border-emerald-500/30 focus:outline-none transition-all resize-none shadow-2xl"
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-3">
              <Badge className="bg-zinc-800 text-zinc-400 border-none px-3 py-1 rounded-full text-[10px] font-black tracking-widest">
                {code.split('\n').filter(l => l.trim()).length} LINES
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4">
            <Button 
              onClick={() => handleExplain()}
              disabled={isProcessing || !code.trim()}
              className="bg-zinc-900 hover:bg-black text-white rounded-full px-12 py-8 font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  Analyzing Logic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Explain Code
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {explanation && (
        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Logic Breakdown</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 gap-2"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Explanation'}
            </Button>
          </div>

          <div className="prose prose-slate max-w-none 
            prose-headings:text-zinc-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed
            prose-strong:text-zinc-900 prose-strong:font-black
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-emerald-700 prose-code:font-bold
            prose-pre:bg-zinc-900 prose-pre:rounded-[24px] prose-pre:p-6 prose-pre:shadow-xl
            prose-ul:list-none prose-ul:pl-0
            prose-li:bg-slate-50/50 prose-li:p-4 prose-li:rounded-2xl prose-li:mb-2 prose-li:border prose-li:border-slate-100/50
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {!explanation && !isProcessing && (
        <div className="py-32 text-center bg-white border border-dashed border-slate-200 rounded-[64px]">
          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200">
            <Code2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Deep Logic Analysis</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] max-w-xs mx-auto">
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
            Claude is deconstructing your code...
          </p>
        </div>
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
