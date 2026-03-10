"use client";
import { useState, useEffect } from 'react'; // Added useEffect

export default function PreviewModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  chapter,
  loading = false 
}) {
  const [outline, setOutline] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);

  // ✅ FIX 1: Define the function FIRST (before using it)
  const fetchPreview = async () => {
    setPreviewLoading(true);
    setError('');

    try {
      const response = await fetch('/api/standard/preview-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: chapter.project_id,
          chapterNumber: chapter.chapter_number,
          userId: chapter.user_id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setOutline(data.outline);
      setTokensUsed(data.tokensUsed);
      setEstimatedTokens(data.estimatedFullGeneration);

    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ✅ FIX 2: Use useEffect (not useState) for side effects
  useEffect(() => {
    if (isOpen && chapter && !outline && !previewLoading) {
      fetchPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Runs whenever the modal opens

  const handleProceed = () => {
    setOutline('');
    setError('');
    onProceed();
  };

  const handleCancel = () => {
    setOutline('');
    setError('');
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
              Structural Preview
            </h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Chapter {chapter?.chapter_number} • Architectural Blueprint
          </p>
        </div>

        {/* Body */}
        <div className="p-8 sm:p-10">
          {/* Loading State */}
          {previewLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent mx-auto mb-6"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Drafting outline...</p>
              <p className="text-[10px] text-slate-400 mt-2 italic">Minimal token impact</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                  <p className="text-xs font-black text-red-900 uppercase tracking-widest">Preview Failed</p>
                  <p className="text-[11px] text-red-700 mt-1 font-medium leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Content */}
          {outline && !previewLoading && (
            <>
              {/* Token Savings Badge */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                  Preview Generated: <span className="font-black text-emerald-900">{tokensUsed} tokens used</span>
                </p>
              </div>

              {/* Outline Display */}
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 mb-8 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  Structural Map
                </h4>
                <div className="text-xs sm:text-sm text-slate-900 whitespace-pre-wrap font-medium leading-relaxed">
                  {outline}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-slate-900 rounded-[32px] p-6 sm:p-8 mb-10 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Architectural Notes:</p>
                  <ul className="text-[11px] space-y-3 font-bold text-slate-300">
                    <li className="flex items-start gap-3"><span className="text-slate-500">•</span> If this structure aligns with your goals, proceed to full generation.</li>
                    <li className="flex items-start gap-3"><span className="text-slate-500">•</span> Full generation will require ~{estimatedTokens.toLocaleString()} tokens.</li>
                    <li className="flex items-start gap-3"><span className="text-slate-500">•</span> You can refine project details to adjust this outline.</li>
                  </ul>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                >
                  Discard Outline
                </button>
                <button
                  onClick={handleProceed}
                  disabled={loading}
                  className="flex-[2] bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-40 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  )}
                  Initialize Full Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}