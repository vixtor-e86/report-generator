"use client";
import { useState, useEffect } from 'react';
import { 
  X, Sparkles, RefreshCw, FileText, Download, 
  Send, AlertCircle, CheckCircle2, ChevronRight, 
  MessageSquare, Zap, Wallet, ArrowLeft, Edit3
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function ProposalDetailModal({ 
  isOpen, 
  onClose, 
  topic, 
  userId, 
  walletBalance,
  onDeductFunds,
  setShowFundingModal
}) {
  const [step, setStep] = useState(1); // 1: Topic Info, 2: Payment, 3: Generation/Result
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsProcessing] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [proposalId, setProposalId] = useState(null);
  const [canModify, setCanModify] = useState(true);
  const [isModifying, setIsModifying] = useState(false);

  const PROPOSAL_FEE = 1000;

  // Check for existing proposal for this topic and user
  useEffect(() => {
    if (isOpen && topic && userId) {
      checkExistingProposal();
    }
  }, [isOpen, topic, userId]);

  const checkExistingProposal = async () => {
    try {
      const { data, error } = await supabase
        .from('topic_proposals')
        .select('*')
        .eq('user_id', userId)
        .eq('topic_title', topic.title)
        .single();

      if (data) {
        setProposalId(data.id);
        if (data.status === 'generated') {
          setProposal(data.proposal_content);
          setCanModify(data.modification_count === 0);
          setStep(3);
        } else if (data.status === 'paid') {
          setStep(3); // Go to generation step but without content yet
        }
      }
    } catch (err) {
      console.error('Check existing error:', err);
    }
  };

  const handleStartProcess = () => {
    if (!userId) {
        toast.error('Please login to generate a proposal');
        return;
    }
    if (proposal) {
        setStep(3);
    } else {
        setStep(2);
    }
  };

  const handlePayAndInitialize = async () => {
    if (walletBalance < PROPOSAL_FEE) {
      toast.error('Insufficient balance');
      setShowFundingModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const success = await onDeductFunds(PROPOSAL_FEE, `Proposal Generation: ${topic.title}`);
      if (!success) throw new Error('Payment failed');

      // Create record in DB
      const { data, error } = await supabase
        .from('topic_proposals')
        .insert({
          user_id: userId,
          topic_title: topic.title,
          topic_data: topic,
          status: 'paid'
        })
        .select()
        .single();

      if (error) throw error;

      setProposalId(data.id);
      setStep(3);
      toast.success('Payment authorized! Ready to generate.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateProposal = async (isModification = false) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/marketplace/tools/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          topic,
          instructions,
          isModification
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setProposal(data.content);
      if (isModification) {
        setCanModify(false);
        setIsModifying(false);
      }
      toast.success(isModification ? 'Proposal updated!' : 'Proposal generated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (format) => {
    toast.info(`Preparing ${format.toUpperCase()} export...`);
    try {
        const response = await fetch('/api/marketplace/tools/generate-proposal/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                proposalId,
                format
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        const byteCharacters = atob(data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.mimeType });
  
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Downloaded successfully!');
    } catch (err) {
        toast.error('Export failed: ' + err.message);
    }
  };

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#f8fafc] rounded-[40px] max-w-4xl w-full h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col relative border border-white/20">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
              {topic.emoji || '📘'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{topic.title}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{topic.category || 'Academic Research'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 ml-4 text-slate-400 hover:text-black transition-colors bg-slate-50 rounded-full shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="mb-6">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Project Objective / Problem Gap</span>
                  <p className="text-slate-600 leading-relaxed font-medium italic">"{topic.problem_gap}"</p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Feasibility</span>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(topic.feasibility || 7) * 10}%` }} />
                        </div>
                        <span className="text-xs font-black text-slate-900">{topic.feasibility}/10</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Suggested Tools</span>
                    <div className="flex flex-wrap gap-2">
                        {topic.tools?.map((tool, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-600 border-none font-bold text-[9px]">{tool}</Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/50 flex items-center gap-6">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <FileText className="w-8 h-8" />
                 </div>
                 <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Generate Technical Proposal</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Get a professionally structured academic proposal including introduction, objectives, methodology, and expected outcomes.
                    </p>
                 </div>
                 <Button onClick={handleStartProcess} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200 shrink-0">
                    {proposal ? 'View Proposal' : 'Start Generation'}
                 </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto py-10 animate-in zoom-in-95 duration-300">
               <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-zinc-900 text-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <Zap className="w-10 h-10 text-yellow-400" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Authorize Payment</h2>
                  <p className="text-slate-500 font-medium">To proceed with the generation of this project proposal.</p>
               </div>

               <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Fee</span>
                    <span className="text-xl font-black text-slate-900">{formatCurrency(PROPOSAL_FEE)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100"><Wallet className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Your Balance</p>
                            <p className="text-sm font-black text-slate-900">{formatCurrency(walletBalance)}</p>
                        </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePayAndInitialize}
                    disabled={isGenerating}
                    className="w-full bg-black hover:bg-zinc-800 text-white py-8 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                  >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Confirm & Generate'}
                  </Button>
                  
                  <button 
                    onClick={() => setStep(1)}
                    className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-2 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
               {!proposal ? (
                 <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Payment Verified</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Personalize Your Proposal</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">Add any specific instructions or requirements you'd like the AI to include in your technical proposal.</p>
                    </div>

                    <div className="relative">
                        <textarea 
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="e.g. Focus on IoT integration, include a block diagram description, use a quantitative research methodology..."
                            className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-3xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-inner"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <MessageSquare className="w-3.5 h-3.5" /> AI Ready
                        </div>
                    </div>

                    <Button 
                        onClick={() => handleGenerateProposal(false)}
                        disabled={isGenerating}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-100"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin mr-3" />
                                Engineering your proposal...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-3" />
                                Generate Proposal Now
                            </>
                        )}
                    </Button>
                 </div>
               ) : (
                 <div className="space-y-8">
                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 bg-[#f8fafc] py-4">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-3 py-1 font-black text-[10px] uppercase">Generated</Badge>
                            {!canModify && <Badge className="bg-slate-100 text-slate-400 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">Limit Reached</Badge>}
                        </div>
                        <div className="flex items-center gap-3">
                            {canModify && !isModifying && (
                                <button 
                                    onClick={() => setIsModifying(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                                >
                                    <Edit3 className="w-3.5 h-3.5" /> Modify once
                                </button>
                            )}
                            <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1">
                                <button onClick={() => handleExport('pdf')} className="px-4 py-2 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 transition-all"><Download className="w-3.5 h-3.5" /> PDF</button>
                                <div className="w-px h-4 bg-slate-100 mx-1" />
                                <button onClick={() => handleExport('docx')} className="px-4 py-2 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 transition-all"><Download className="w-3.5 h-3.5" /> DOCX</button>
                            </div>
                        </div>
                    </div>

                    {isModifying && (
                        <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Surgical Modification</h4>
                                <button onClick={() => setIsModifying(false)} className="text-slate-400 hover:text-black">×</button>
                            </div>
                            <textarea 
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="What would you like to change? (Only one modification allowed)"
                                className="w-full h-32 p-5 bg-white border border-blue-100 rounded-2xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-sm"
                            />
                            <Button 
                                onClick={() => handleGenerateProposal(true)}
                                disabled={isGenerating}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : 'Update Proposal'}
                            </Button>
                        </div>
                    )}

                    {/* Document View */}
                    <div className="bg-white rounded-[40px] p-10 md:p-16 shadow-sm border border-slate-100 prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium">
                        <ReactMarkdown>{proposal}</ReactMarkdown>
                    </div>

                    {/* Ads / Upsell Card */}
                    <div className="bg-zinc-900 rounded-[48px] p-10 md:p-12 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full group-hover:bg-indigo-600/30 transition-all duration-700" />
                        <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                            <div>
                                <Badge className="bg-indigo-500 text-white border-none px-3 py-1 font-black text-[9px] uppercase tracking-[0.2em] mb-4">Upgrade Now</Badge>
                                <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight mb-4">Generate the Full Project Documentation</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                                    Love your proposal? Take the next step and generate the complete 5-chapter project report with technical analysis, diagrams, and citations.
                                </p>
                                <div className="flex gap-4">
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/5 text-center flex-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Standard</p>
                                        <p className="text-lg font-black text-white">₦5,000</p>
                                    </div>
                                    <div className="bg-indigo-600 p-4 rounded-3xl text-center flex-1">
                                        <p className="text-[8px] font-black text-indigo-200 uppercase mb-1">Premium</p>
                                        <p className="text-lg font-black text-white">₦20,000</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <a href="/dashboard" className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest text-center shadow-2xl hover:scale-105 transition-transform active:scale-95">Go to Dashboard</a>
                                <button onClick={onClose} className="w-full py-5 bg-transparent border border-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest text-center hover:bg-white/5 transition-all">Keep Browsing Tools</button>
                            </div>
                        </div>
                    </div>
                 </div>
               )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
