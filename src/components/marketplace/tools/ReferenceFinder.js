'use client';

import { useState, useEffect } from 'react';
import { Search, Quote, Download, Copy, Check, Filter, Calendar, FileText, Zap, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';

export default function ReferenceFinder({ tool, user, walletBalance, hasPaid, setHasPaid, setShowPaymentDialog }) {
  // Discover Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('free'); // 'free' | 'deep'
  const [yearStart, setYearStart] = useState('2018');
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear().toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-execute after payment (DeepSearch)
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

  const handleCopyCitation = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Formatted citation copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-300" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter research topic or paper title..."
              className="h-14 md:h-16 pl-12 md:pl-14 bg-slate-50 border-slate-100 rounded-2xl md:rounded-3xl font-bold text-sm md:text-base text-zinc-900 focus:border-black transition-all"
            />
          </div>
          <div className="flex gap-2 justify-between sm:justify-start">
            <Input type="number" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className="w-20 md:w-24 h-14 md:h-16 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl text-center font-black text-xs md:text-sm text-zinc-900 focus:border-black transition-all" />
            <div className="flex items-center text-zinc-600 font-black uppercase text-[8px] md:text-[10px] tracking-widest px-1">to</div>
            <Input type="number" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className="w-20 md:w-24 h-14 md:h-16 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl text-center font-black text-xs md:text-sm text-zinc-900 focus:border-black transition-all" />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 md:gap-4 mt-6 md:mt-8">
          <button 
            onClick={() => { setSearchMode('free'); handleReferenceSearch(); }}
            disabled={isProcessing}
            className="flex-1 min-w-[200px] h-14 md:h-16 bg-slate-900 hover:bg-black text-white rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50"
          >
            {isProcessing && searchMode === 'free' ? 'Searching...' : (
              <><Search className="w-3 h-3 md:w-4 md:h-4" /> Standard Search</>
            )}
          </button>
          
          <button 
            onClick={() => { setSearchMode('deep'); handleReferenceSearch(); }}
            disabled={isProcessing}
            className="flex-1 min-w-[200px] h-14 md:h-16 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 group"
          >
            {isProcessing && searchMode === 'deep' ? 'DeepSearching...' : (
              <>
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-indigo-100 group-hover:scale-110 transition-transform" /> 
                DeepSearch <span className="opacity-75 font-medium ml-1">({tool.price} NGN)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {searchResults.map((paper, idx) => (
          <div key={idx} className="bg-white border border-[#e5e7eb] rounded-[32px] p-6 md:p-8 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                  {paper.year}
                </Badge>
                {paper.citationCount && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Quote className="w-3 h-3" /> {paper.citationCount} Citations
                  </span>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-indigo-600 transition-colors">
                {paper.title}
              </h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 leading-relaxed">
                {paper.authors}
              </p>
              {paper.abstract && (
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-6">
                  {paper.abstract}
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4 mt-auto">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">APA 7th Citation</span>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 group/cite">
                  <p className="text-[11px] md:text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">
                    {paper.citation}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopyCitation(paper.citation, idx)}
                    className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                  >
                    {copiedId === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                {paper.url && (
                  <a 
                    href={paper.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-slate-900 hover:bg-black text-white px-4 py-3 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2"
                  >
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {paper.pdfUrl && (
                  <a 
                    href={paper.pdfUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-3 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2"
                  >
                    PDF <Download className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!isProcessing && searchResults.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Discover Academic Sources</h3>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
            Search for verified academic papers, get proper citations instantly, and access PDF sources for your research project.
          </p>
        </div>
      )}
    </div>
  );
}
