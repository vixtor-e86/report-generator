"use client";
import { useState, useEffect } from 'react';
import { 
  Search, Globe, Sparkles, RefreshCw, ExternalLink, GraduationCap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';

export default function ReferenceFinder({ 
  isProcessing, 
  setIsProcessing, 
  hasPaid, 
  setHasPaid, 
  setShowPaymentDialog 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearStart, setYearStart] = useState('2020');
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear().toString());
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('free'); // 'free' or 'deep'

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && searchQuery.trim()) {
      handleReferenceSearch(true);
    }
  }, [hasPaid]);

  const handleReferenceSearch = async (skipPaymentCheck = false) => {
    if (!searchQuery.trim()) return toast.error("Enter a research topic");
    
    if (searchMode === 'deep' && !hasPaid && !skipPaymentCheck) {
        setShowPaymentDialog(true);
        return;
    }

    setIsProcessing(true);
    try {
        const response = await fetch('/api/marketplace/tools/reference-finder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: searchQuery,
                mode: searchMode,
                yearRange: `${yearStart}-${yearEnd}`
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setSearchResults(data.data);
        toast.success(searchMode === 'deep' ? 'DeepSearch Complete!' : 'Search Complete!');
        setHasPaid(false);
    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter research topic, keywords, or author names..."
              className="h-16 pl-14 bg-slate-50 border-slate-100 rounded-3xl font-bold text-zinc-900 focus:border-black transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Input type="number" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className="w-24 h-16 bg-slate-50 border-slate-100 rounded-2xl text-center font-black text-zinc-900 focus:border-black transition-all" />
            <div className="flex items-center text-zinc-400 font-black uppercase text-[10px] tracking-widest px-1">to</div>
            <Input type="number" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className="w-24 h-16 bg-slate-50 border-slate-100 rounded-2xl text-center font-black text-zinc-900 focus:border-black transition-all" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-8">
          <button 
            onClick={() => { setSearchMode('free'); handleReferenceSearch(); }}
            disabled={isProcessing}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${searchMode === 'free' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <Globe className="w-4 h-4" /> Semantic Search (Free)
          </button>
          <button 
            onClick={() => setSearchMode('deep')}
            disabled={isProcessing}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${searchMode === 'deep' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <Sparkles className="w-4 h-4 text-blue-200" /> DeepSearch (₦200)
          </button>
          {searchMode === 'deep' && (
            <Button 
              onClick={() => handleReferenceSearch()}
              disabled={isProcessing || !searchQuery.trim()}
              className="px-10 bg-black text-white rounded-2xl py-4 font-black uppercase text-xs animate-in zoom-in-95"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Launch DeepSearch'}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {searchResults.map((paper, idx) => (
          <div key={idx} className="bg-white border border-[#e5e7eb] rounded-[40px] p-8 shadow-sm hover:border-blue-400 transition-all group relative overflow-hidden">
            {searchMode === 'deep' && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />}
            <div className="flex justify-between items-start mb-6">
              <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">{paper.year} • {paper.venue || 'Academic Journal'}</Badge>
              <a href={paper.url} target="_blank" className="p-3 bg-slate-50 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all"><ExternalLink className="w-4 h-4" /></a>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-4 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{paper.title}</h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><GraduationCap className="w-4 h-4" /></div>
              <p className="text-xs font-bold text-slate-500">{paper.authors?.join(', ')}</p>
            </div>
            {paper.abstract && (
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 italic text-sm text-slate-600 leading-relaxed font-medium">
                "{paper.abstract}"
              </div>
            )}
          </div>
        ))}
        {!isProcessing && searchResults.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-300"><Search className="w-10 h-10" /></div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Academic discovery results will appear here</p>
          </div>
        )}
        {isProcessing && (
          <div className="py-20 text-center animate-pulse">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-6 animate-spin" />
            <p className="text-blue-600 font-black uppercase text-[10px] tracking-[0.2em]">AI Scholar is searching global archives...</p>
          </div>
        )}
      </div>
    </div>
  );
}
