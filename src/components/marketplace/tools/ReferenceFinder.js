"use client";
import { useState, useEffect } from 'react';
import { 
  Search, Globe, Sparkles, RefreshCw, ExternalLink, GraduationCap, 
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Copy, Check, FileCheck, Layers
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';

export default function ReferenceFinder({ 
  isProcessing, 
  setIsProcessing, 
  hasPaid, 
  setHasPaid, 
  setShowPaymentDialog 
}) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'verify'

  // Discover Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [yearStart, setYearStart] = useState('2020');
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear().toString());
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('free'); // 'free' or 'deep'

  // Verification State
  const [verifyText, setVerifyText] = useState('');
  const [citationStyle, setCitationStyle] = useState('APA 7th');
  const [auditedResults, setAuditedResults] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-execute after payment (DeepSearch)
  useEffect(() => {
    if (hasPaid && searchQuery.trim() && activeTab === 'discover') {
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

  const handleAuditReferences = async () => {
    if (!verifyText.trim()) return toast.error("Paste your references to verify");

    setIsProcessing(true);
    try {
        const response = await fetch('/api/marketplace/tools/reference-finder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: verifyText,
                mode: 'verify',
                style: citationStyle
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setAuditedResults(data.data || []);
        toast.success('References Audited & Verified!');
    } catch (err) {
        toast.error(err.message || 'Failed to verify references');
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
      {/* Dual Mode Sub-Tab Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'discover' 
              ? 'bg-white text-slate-900 shadow-md' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" /> Discover References
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'verify' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Audit & Verify
        </button>
      </div>

      {activeTab === 'discover' ? (
        /* DISCOVER MODE */
        <>
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
                className={`flex-1 sm:flex-none px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 transition-all ${searchMode === 'free' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> Semantic (Free)
              </button>
              <button 
                onClick={() => setSearchMode('deep')}
                disabled={isProcessing}
                className={`flex-1 sm:flex-none px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 transition-all ${searchMode === 'deep' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-200" /> DeepSearch (₦200)
              </button>
              {searchMode === 'deep' && (
                <Button 
                  onClick={() => handleReferenceSearch()}
                  disabled={isProcessing || !searchQuery.trim()}
                  className="w-full sm:w-auto px-10 bg-black text-white rounded-xl md:rounded-2xl py-6 md:py-4 font-black uppercase text-[10px] md:text-xs animate-in zoom-in-95"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 md:w-4 md:h-4 animate-spin" /> : 'Launch DeepSearch'}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {searchResults.map((paper, idx) => (
              <div key={idx} className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm hover:border-blue-400 transition-all group relative overflow-hidden">
                {searchMode === 'deep' && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />}
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <Badge className="bg-slate-100 text-slate-500 border-none px-3 md:px-4 py-1 rounded-full font-black text-[8px] md:text-[9px] uppercase tracking-widest">{paper.year} • {paper.venue || 'Academic Journal'}</Badge>
                  <a href={paper.url} target="_blank" rel="noreferrer" className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl hover:bg-zinc-900 hover:text-white transition-all"><ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" /></a>
                </div>
                <h3 className="text-lg md:text-xl font-black text-zinc-900 mb-4 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{paper.title}</h3>
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0"><GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                  <p className="text-[10px] md:text-xs font-bold text-slate-500 line-clamp-1">{paper.authors?.join(', ')}</p>
                </div>
                {paper.abstract && (
                  <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 italic text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                    "{paper.abstract}"
                  </div>
                )}
              </div>
            ))}
            {!isProcessing && searchResults.length === 0 && (
              <div className="py-16 md:py-20 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-[24px] md:rounded-[32px] flex items-center justify-center mx-auto mb-4 md:mb-6 text-slate-300"><Search className="w-8 h-8 md:w-10 md:h-10" /></div>
                <p className="text-slate-600 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.2em] px-4">Academic discovery results will appear here</p>
              </div>
            )}
            {isProcessing && (
              <div className="py-16 md:py-20 text-center animate-pulse">
                <RefreshCw className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mx-auto mb-4 md:mb-6 animate-spin" />
                <p className="text-blue-600 font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em]">AI Scholar is searching global archives...</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* AUDIT & VERIFY MODE */
        <div className="space-y-8">
          <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Reference Verification & Style Auditor</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Paste gathered references to verify their authenticity against real literature, check for AI hallucinations, and reformat to standard citation styles.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Pasted References (1 to 10 References)</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Format Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-xs text-slate-900 focus:border-indigo-600"
                  >
                    <option value="APA 7th">APA 7th Edition</option>
                    <option value="IEEE">IEEE Style</option>
                    <option value="Harvard">Harvard Reference Style</option>
                    <option value="MLA 9th">MLA 9th Edition</option>
                    <option value="Chicago">Chicago Manual of Style</option>
                  </select>
                </div>
              </div>

              <Textarea
                value={verifyText}
                onChange={(e) => setVerifyText(e.target.value)}
                rows={6}
                placeholder={`Paste references here, e.g:\n\n1. Adeleke, V. (2023). Machine Learning Applications in Electrical Power Distribution. Journal of Nigerian Engineering, 14(2), 45-58.\n2. Smith, J. & Johnson, R. (2021). Autonomous Robotics in Industrial Automation. IEEE Transactions, 33(1), 102-118.`}
                className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 text-xs md:text-sm font-medium text-slate-900 focus:border-indigo-600 resize-none"
              />
            </div>

            <Button
              onClick={handleAuditReferences}
              disabled={isProcessing || !verifyText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Auditing References & Checking DOI Databases...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Audit & Verify References
                </>
              )}
            </Button>
          </div>

          {/* Audit Results */}
          <div className="space-y-6">
            {auditedResults.map((item, idx) => {
              const isVerified = item.status === 'verified';
              const isCorrected = item.status === 'corrected';
              
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Authentic / Verified
                        </Badge>
                      ) : isCorrected ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Format Corrected
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200 px-3 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-600" /> Unverified / Potential Hallucination
                        </Badge>
                      )}
                      
                      {item.confidenceScore && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {item.confidenceScore}% Confidence
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(item.title || item.originalText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                      >
                        <Search className="w-3 h-3" /> Google Scholar
                      </a>
                      {item.doi && (
                        <a
                          href={`https://doi.org/${item.doi.replace(/^https?:\/\/doi\.org\//, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" /> CrossRef DOI
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standardized Citation ({citationStyle})</span>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                      <p className="text-xs md:text-sm font-semibold text-slate-900 font-mono leading-relaxed select-all">
                        {item.standardizedCitation || item.originalText}
                      </p>
                      <Button
                        onClick={() => handleCopyCitation(item.standardizedCitation || item.originalText, idx)}
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-slate-600 hover:text-indigo-600"
                      >
                        {copiedId === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-950 font-medium leading-relaxed">
                      <strong className="font-bold uppercase tracking-wider text-[10px] text-indigo-700 block mb-1">Audit Assessment:</strong>
                      {item.notes}
                    </div>
                  )}
                </div>
              );
            })}

            {!isProcessing && auditedResults.length === 0 && (
              <div className="py-16 text-center bg-white border border-slate-200 rounded-[32px]">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Paste your gathered references above and click "Audit & Verify"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
