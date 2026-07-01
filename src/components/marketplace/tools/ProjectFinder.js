"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Sparkles, RefreshCw, GraduationCap, 
  Lightbulb, BookOpen, Layers, CheckCircle2, 
  ArrowRight, Info, Zap, Verified, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/marketplace/UserContext';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import ProposalDetailModal from './ProposalDetailModal';

export default function ProjectFinder({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog,
  setCustomPrice,
  walletBalance,
  onDeductFunds,
  setShowFundingModal
}) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [researchType, setResearchType] = useState('any');
  const [industry, setIndustry] = useState('');
  const [results, setResults] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const PROPOSAL_FEE = 1000;

  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'proposals'
  const [myProposals, setMyProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const fetchMyProposals = useCallback(async () => {
    if (!user?.id) return;
    setLoadingProposals(true);
    try {
      const { data, error } = await supabase
        .from('topic_proposals')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (data) setMyProposals(data);
    } catch (err) {
      console.error('Failed to fetch user proposals:', err);
    } finally {
      setLoadingProposals(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchMyProposals();
    }
  }, [user, fetchMyProposals]);

  const handleSelectProposal = (prop) => {
    setSelectedTopic(prop.topic_data);
  };

  // Fetch initial topics when the component mounts
  useEffect(() => {
    const fetchInitialTopics = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/marketplace/tools/project-finder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '' }) // Empty query triggers DB recent fetch in the API
        });
        const data = await response.json();
        if (data.data) setResults(data.data);
      } catch (err) {
        console.error('Failed to fetch initial topics:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    fetchInitialTopics();
  }, [setIsProcessing]);

  const handleSearch = async (loadMore = false) => {
    if (!query.trim() && !loadMore) return toast.error("Please enter a topic or area of interest");

    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsProcessing(true);
      setResults([]);
    }

    try {
      const response = await fetch('/api/marketplace/tools/project-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          department,
          level,
          researchType,
          industry,
          existingTopics: loadMore ? results.map(r => r.title) : []
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      if (loadMore) {
        setResults(prev => [...prev, ...data.data]);
        toast.success('Found more topics for you!');
      } else {
        setResults(data.data);
        toast.success('Found some great project topics for you!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Tab Switcher */}
      <div className="flex bg-zinc-100 border border-zinc-200 p-1 rounded-2xl shadow-sm max-w-xs mx-auto">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'explore' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Explore Topics
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'proposals' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          My Proposals
          {myProposals.length > 0 && (
            <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0">
              {myProposals.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'explore' ? (
        <>
          {/* Compact Search Section */}
          <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="relative space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What area are you interested in?"
                    className="h-12 md:h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl font-bold text-sm text-zinc-900 focus:border-black transition-all shadow-inner"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="relative col-span-1">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <Input 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Dept"
                      className="h-10 pl-9 bg-slate-50 border-slate-100 rounded-xl font-bold text-[10px] text-zinc-900 focus:border-black transition-all"
                    />
                  </div>
                  <div className="relative col-span-1">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <Input 
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      placeholder="Level"
                      className="h-10 pl-9 bg-slate-50 border-slate-100 rounded-xl font-bold text-[10px] text-zinc-900 focus:border-black transition-all"
                    />
                  </div>
                  <div className="relative col-span-1">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <select 
                      value={researchType}
                      onChange={(e) => setResearchType(e.target.value)}
                      className="w-full h-10 pl-9 pr-2 bg-slate-50 border-slate-100 rounded-xl font-bold text-[10px] text-zinc-900 focus-border-black transition-all appearance-none outline-none"
                    >
                      <option value="any">Methodology</option>
                      <option value="quantitative">Quantitative</option>
                      <option value="qualitative">Qualitative</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="relative col-span-1">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <Input 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Industry"
                      className="h-10 pl-9 bg-slate-50 border-slate-100 rounded-xl font-bold text-[10px] text-zinc-900 focus:border-black transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge className="bg-blue-50 text-blue-600 border-none px-2.5 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest">Free Tool</Badge>
                
                <Button 
                  onClick={() => handleSearch(false)}
                  disabled={isProcessing || (!query.trim() && results.length === 0)}
                  className="bg-black hover:bg-zinc-800 text-white rounded-xl py-4 px-6 font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all h-10"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      Find Topics
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Section - List Layout */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Discovery Results ({results.length})</h4>
                {results.length > 0 && <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest animate-pulse">Scroll to explore</span>}
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                    {results.map((topic, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setSelectedTopic(topic)}
                        className="p-4 md:p-5 hover:bg-slate-50 transition-all group cursor-pointer flex items-center gap-4 md:gap-6"
                    >
                        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl md:text-2xl group-hover:scale-110 transition-transform">
                            {topic.emoji || '📘'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-sm md:text-base font-black text-zinc-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                                    {topic.title}
                                </h3>
                                {topic.is_from_db && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex-shrink-0">
                                        <Verified className="w-2.5 h-2.5" />
                                        <span className="text-[7px] font-black uppercase tracking-widest">Verified</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {topic.category || 'General Research'}
                                </span>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <div className="flex items-center gap-1.5">
                                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${(topic.feasibility || 7) * 10}%` }} />
                                    </div>
                                    <span className="text-[8px] font-black text-zinc-900">{topic.feasibility}/10</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    ))}

                    {results.length === 0 && !isProcessing && (
                    <div className="py-20 text-center px-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                            <Lightbulb className="w-6 h-6" />
                        </div>
                        <h2 className="text-sm font-black text-zinc-900 uppercase tracking-tight mb-1">Ready to Discover?</h2>
                        <p className="text-slate-500 font-bold uppercase text-[8px] tracking-widest max-w-xs mx-auto">
                            Enter a field of interest to explore topics
                        </p>
                    </div>
                    )}

                    {isProcessing && (
                    <div className="py-20 text-center px-6 animate-pulse">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-blue-600 font-black uppercase text-[8px] tracking-[0.3em]">
                            Analyzing Trends...
                        </p>
                    </div>
                    )}
                </div>
            </div>

            {results.length > 0 && !isProcessing && (
              <div className="flex justify-center pt-6">
                <Button 
                  onClick={() => handleSearch(true)}
                  disabled={isLoadingMore}
                  variant="outline"
                  className="border-slate-200 hover:border-black hover:bg-black hover:text-white rounded-xl px-6 py-4 font-black uppercase text-[9px] tracking-widest transition-all h-10 shadow-sm flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Initialising More...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3 h-3" />
                      Load More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Proposals Tab */
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Recent Proposals ({myProposals.length})</h4>
          </div>

          <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
            {myProposals.map((prop) => (
              <div 
                key={prop.id} 
                onClick={() => handleSelectProposal(prop)}
                className="py-4 flex items-center justify-between hover:bg-slate-50/50 px-4 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                    {prop.topic_data?.emoji || '📘'}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-tight truncate">{prop.topic_title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(prop.created_at).toLocaleDateString()}</span>
                      <Badge className={`border-none px-2 py-0 text-[8px] font-black uppercase ${
                          prop.status === 'generated' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {prop.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 group-hover:text-black group-hover:bg-slate-100"
                >
                  View
                </Button>
              </div>
            ))}

            {myProposals.length === 0 && !loadingProposals && (
              <div className="py-20 text-center space-y-4 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                <FileText className="w-12 h-12 text-slate-200 mx-auto" />
                <div>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No proposals generated yet</p>
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline"
                  >
                    Find a topic to start →
                  </button>
                </div>
              </div>
            )}
            
            {loadingProposals && (
              <div className="py-20 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-slate-400 font-black uppercase text-[8px] tracking-[0.3em]">Loading Proposals...</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ProposalDetailModal 
        isOpen={!!selectedTopic}
        onClose={() => {
          setSelectedTopic(null);
          fetchMyProposals();
        }}
        topic={selectedTopic}
        hasPaid={hasPaid}
        setHasPaid={setHasPaid}
        setShowPaymentDialog={setShowPaymentDialog}
        setCustomPrice={setCustomPrice}
        walletBalance={walletBalance}
        onDeductFunds={onDeductFunds}
        setShowFundingModal={setShowFundingModal}
      />

      {/* Info Card */}
      <div className="bg-zinc-900 rounded-[32px] p-6 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700" />
        <div className="relative flex items-center gap-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md flex-shrink-0">
            <Info className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight mb-1">Pro Tip</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Verified topics come from our elite research repository. Click any topic to see full technical details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
