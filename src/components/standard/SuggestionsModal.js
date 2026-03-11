"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SuggestionsModal({ 
  isOpen, 
  onClose, 
  onApplyAndRegenerate,
  chapter,
  projectId,
  userId
}) {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (isOpen && chapter && !suggestions && !loading) {
      fetchSuggestions();
    }
  }, [isOpen, chapter]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/standard/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          chapterNumber: chapter.chapter_number,
          userId: userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      setSuggestions(data.suggestions);
      setTokensUsed(data.tokensUsed);

    } catch (err) {
      console.error('Suggestions error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEdit = () => {
    handleClose();
  };

  const handleApplyAndRegenerate = async () => {
    setRegenerating(true);
    const instruction = `Apply these improvements:\n${suggestions}`;
    try {
      await onApplyAndRegenerate(instruction);
      handleClose();
    } catch (err) {
      console.error('Regeneration error:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleClose = () => {
    setSuggestions('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-slate-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">
              AI Analysis
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Chapter {chapter?.chapter_number} • Technical Improvements
          </p>
        </div>

        {/* Body */}
        <div className="p-8 sm:p-10">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent mx-auto mb-6"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Architect is scanning content...</p>
              <p className="text-[10px] text-slate-400 mt-2 italic">Minimal token impact</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                  <p className="text-xs font-black text-red-900 uppercase tracking-widest">Analysis Failed</p>
                  <p className="text-[11px] text-red-700 mt-1 font-medium leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions Content */}
          {suggestions && !loading && (
            <>
              {/* Token Savings Badge */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                  Analysis Complete: <span className="font-black text-emerald-900">{tokensUsed} tokens used</span>
                </p>
              </div>

              {/* Suggestions Display */}
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 mb-8 border border-slate-100 prose prose-slate max-w-none prose-sm sm:prose-base">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 not-prose">
                  Recommended Technical Fixes
                </h4>
                <div className="text-slate-900 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {suggestions}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleManualEdit}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                >
                  Manual Correction
                </button>
                <button
                  onClick={handleApplyAndRegenerate}
                  disabled={regenerating}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-40 flex items-center justify-center gap-3"
                >
                  {regenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  )}
                  Auto-Apply
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
