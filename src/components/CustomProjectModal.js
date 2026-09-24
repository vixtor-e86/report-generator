"use client";
import React, { useState } from 'react';
import { 
  Layers, Check, Sparkles, Shield, ArrowRight, X, 
  HelpCircle, Zap, FileText, CheckCircle2
} from 'lucide-react';
import { PRICING, INTERNATIONAL_PRICING } from '@/lib/pricing';

const CHAPTERS_LIST = [
  { id: 1, number: 1, name: 'Chapter 1: Introduction & Background', defaultTitle: 'Introduction & Problem Statement' },
  { id: 2, number: 2, name: 'Chapter 2: Literature Review', defaultTitle: 'Literature Review & Theoretical Framework' },
  { id: 3, number: 3, name: 'Chapter 3: Research Methodology', defaultTitle: 'Methodology, Design & Analysis Architecture' },
  { id: 4, number: 4, name: 'Chapter 4: Implementation & Results', defaultTitle: 'Implementation, Testing & Result Presentation' },
  { id: 5, number: 5, name: 'Chapter 5: Conclusion & Summary', defaultTitle: 'Conclusion, Summary & Recommendations' }
];

export default function CustomProjectModal({
  isOpen,
  onClose,
  onProceedToPayment,
  isInternational = false
}) {
  // Selected chapters that the AI will GENERATE (default: chapters 4 and 5)
  const [selectedChapters, setSelectedChapters] = useState([4, 5]);
  // Chosen workspace quality: 'standard' or 'premium'
  const [workspaceType, setWorkspaceType] = useState('standard');

  if (!isOpen) return null;

  const toggleChapter = (chapterNum) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapterNum)) {
        // Prevent deselecting all chapters (minimum 1)
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== chapterNum).sort((a, b) => a - b);
      } else {
        return [...prev, chapterNum].sort((a, b) => a - b);
      }
    });
  };

  const selectAll = () => setSelectedChapters([1, 2, 3, 4, 5]);

  const count = selectedChapters.length;
  const unselectedCount = 5 - count;

  // Rates
  const rateNgn = workspaceType === 'premium' 
    ? PRICING.CUSTOM_PREMIUM_PER_CHAPTER 
    : PRICING.CUSTOM_STANDARD_PER_CHAPTER;

  const rateUsd = workspaceType === 'premium' 
    ? INTERNATIONAL_PRICING.CUSTOM_PREMIUM_PER_CHAPTER 
    : INTERNATIONAL_PRICING.CUSTOM_STANDARD_PER_CHAPTER;

  const totalNgn = count * rateNgn;
  const totalUsd = count * rateUsd;

  // Quotas
  const tokensLimit = workspaceType === 'premium' ? count * 80000 : count * 24000;
  const humanizerLimit = workspaceType === 'premium' ? count * 2500 : 0;
  const plagiarismLimit = workspaceType === 'premium' ? count * 2500 : 0;

  const handleContinue = () => {
    onProceedToPayment({
      tier: 'custom',
      workspaceType,
      selectedChapters,
      amountNgn: totalNgn,
      amountUsd: totalUsd,
      customRatePerChapter: rateNgn,
      customDetails: {
        workspaceType,
        selectedChapters,
        ngnAmount: totalNgn,
        usdAmount: totalUsd,
        customRatePerChapter: rateNgn
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-3xl sm:rounded-[36px] max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative border border-slate-100 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-7 bg-gradient-to-b from-indigo-50/70 via-purple-50/40 to-white border-b border-slate-100 flex items-start justify-between relative">
          <div className="pr-4 sm:pr-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2 border border-indigo-200">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Dynamic Chapter Continuation
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Custom Project Builder
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
              Already started your project? Select only the chapters you want to generate. Paste your existing chapters upon workspace entry to ensure flawless continuity.
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors shrink-0 shadow-sm"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {/* STEP 1: Select Workspace Quality */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                1. Select Workspace Environment
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                Determines AI Engine & Toolset
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Standard */}
              <button
                type="button"
                onClick={() => setWorkspaceType('standard')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                  workspaceType === 'standard'
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-sm text-slate-900">Standard Workspace</span>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {isInternational ? `$${INTERNATIONAL_PRICING.CUSTOM_STANDARD_PER_CHAPTER}/ch` : `₦${PRICING.CUSTOM_STANDARD_PER_CHAPTER.toLocaleString()}/ch`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Precision academic engine with standard references, tables, and full Word/PDF compilation.
                </p>
                <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  • 24,000 Tokens / chapter
                </div>
              </button>

              {/* Option B: Premium */}
              <button
                type="button"
                onClick={() => setWorkspaceType('premium')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                  workspaceType === 'premium'
                    ? 'border-purple-600 bg-purple-50/60 shadow-md ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-black text-sm text-slate-900">Premium Suite</span>
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {isInternational ? `$${INTERNATIONAL_PRICING.CUSTOM_PREMIUM_PER_CHAPTER}/ch` : `₦${PRICING.CUSTOM_PREMIUM_PER_CHAPTER.toLocaleString()}/ch`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Elite AI models, built-in Humanizer, Plagiarism checking, DeepSearch, and Visual tools.
                </p>
                <div className="mt-2 text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                  • 80,000 Tokens & 2,500 Humanizer words / ch
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Interactive Chapter Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                2. Which Chapters Do You Want Us to Generate?
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Select All 5
              </button>
            </div>

            <div className="space-y-2">
              {CHAPTERS_LIST.map((ch) => {
                const isSelected = selectedChapters.includes(ch.number);
                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChapter(ch.number)}
                    className={`p-3 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-indigo-600 text-white font-bold' 
                          : 'border-2 border-slate-300 bg-white text-transparent'
                      }`}>
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <p className={`text-xs sm:text-sm font-bold leading-tight ${isSelected ? 'text-slate-900 font-black' : 'text-slate-600'}`}>
                          {ch.name}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                          {isSelected ? 'To be generated by AI' : 'Existing chapter (you will paste this)'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isSelected ? 'Generate' : 'I Have This'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Mandatory Workspace Step:</strong> For any chapter tagged as <em>&quot;I Have This&quot;</em> ({unselectedCount} chapters), you will be prompted to paste its text as soon as you enter the workspace before generation begins.
              </span>
            </div>
          </div>

          {/* STEP 3: Summary Breakdown Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Configuration Summary
                </span>
                <span className="text-sm font-black text-white">
                  {count} Chapter{count > 1 ? 's' : ''} to Generate ({workspaceType === 'premium' ? 'Premium Suite' : 'Standard Blueprint'})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-white">
                  {isInternational ? `$${totalUsd.toFixed(2)}` : `₦${totalNgn.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Quota Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] sm:text-[11px] font-medium text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{tokensLimit.toLocaleString()} Tokens</span>
              </div>
              {workspaceType === 'premium' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{humanizerLimit.toLocaleString()} Humanizer words</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{plagiarismLimit.toLocaleString()} Plagiarism words</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Existing References supported</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            <span>Charged per selected chapter ({isInternational ? `$${rateUsd}/ch` : `₦${rateNgn.toLocaleString()}/ch`})</span>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Continue to Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
