"use client";
import { useState, useEffect } from 'react';
import { 
  Zap, RefreshCw, Copy, Download, Image, Activity, Palette
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Input } from '@/components/marketplace/ui/input';
import { toast } from 'sonner';

export default function VisualStudio({ 
  isProcessing, 
  setIsProcessing, 
  hasPaid, 
  setHasPaid, 
  setShowPaymentDialog 
}) {
  const [activeVisualTool, setActiveVisualTool] = useState('diagram');
  const [prompt, setPrompt] = useState('');
  const [visualResult, setVisualResult] = useState(null);
  const [visualCaption, setVisualCaption] = useState('');

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && prompt.trim()) {
      handleVisualGeneration(true);
    }
  }, [hasPaid]);

  const handleVisualGeneration = async (skipPaymentCheck = false) => {
    if (!prompt.trim()) return toast.error("Please describe your visual");

    if (!hasPaid && !skipPaymentCheck) {
        setShowPaymentDialog(true);
        return;
    }

    setIsProcessing(true);
    try {
        const response = await fetch('/api/premium/visual-tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: activeVisualTool, 
                prompt: prompt,
                isMarketplace: true
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Generation failed');
        
        if (activeVisualTool === 'diagram') {
            const encodedCode = btoa(data.code);
            const imageUrl = `https://mermaid.ink/img/${encodedCode}`;
            setVisualResult({ type: 'diagram', imageUrl, code: data.code });
        } else {
            setVisualResult({ type: 'image', imageUrl: data.imageUrl });
        }
        setVisualCaption(prompt.substring(0, 50));
        toast.success('Visual generated successfully!');
        setHasPaid(false);
    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Controls Column */}
        <div className="lg:w-96 space-y-8">
          <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-8 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-8">
              <button 
                onClick={() => setActiveVisualTool('diagram')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeVisualTool === 'diagram' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <Activity className="w-4 h-4" /> DIAGRAMS
              </button>
              <button 
                onClick={() => setActiveVisualTool('image')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeVisualTool === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                <Image className="w-4 h-4" /> CONCEPTS
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Describe your vision</label>
              <Textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeVisualTool === 'diagram' ? "e.g. A flowchart of a solar irrigation system..." : "e.g. A realistic 3D render of a robotic arm..."}
                className="min-h-[160px] p-4 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm font-bold text-zinc-900 leading-relaxed resize-none transition-all bg-slate-50/50"
              />
            </div>

            <Button 
              onClick={() => handleVisualGeneration()} 
              disabled={isProcessing || !prompt.trim()}
              className="w-full mt-8 py-8 bg-slate-900 hover:bg-black text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4" /> GENERATE (₦100)</>}
            </Button>
          </div>

          {visualResult && (
            <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl animate-in slide-in-from-bottom-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Visual Metadata</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase">Caption / Reference</label>
                  <Input 
                    value={visualCaption} 
                    onChange={(e) => setVisualCaption(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white focus:border-white/20"
                  />
                </div>
                <a 
                  href={visualResult.imageUrl} 
                  download={`visual-${Date.now()}.png`}
                  className="w-full bg-white text-zinc-900 rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 no-underline hover:bg-zinc-100 transition-all"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Preview Column */}
        <div className="flex-1 min-h-[500px] lg:min-h-0 bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Studio Canvas</h2>
            {visualResult && (
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(visualResult.imageUrl);
                  toast.success('Image link copied!');
                }}
                variant="outline" 
                className="rounded-full px-6 border-[#e5e7eb] font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Link
              </Button>
            )}
          </div>

          <div className="flex-1 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center overflow-hidden p-8">
            {isProcessing ? (
              <div className="text-center animate-pulse">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-6" />
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Architecting Visual...</p>
              </div>
            ) : visualResult ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                <div className="relative group max-w-full max-h-full">
                  <img 
                    src={visualResult.imageUrl} 
                    alt="Generated Visual" 
                    className="max-w-full max-h-[400px] object-contain rounded-2xl shadow-2xl border-4 border-white transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <p className="text-slate-500 font-medium italic text-sm text-center px-8">
                  "{visualCaption}"
                </p>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <div className="w-24 h-24 bg-slate-200 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                  <Palette className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">Visual preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
