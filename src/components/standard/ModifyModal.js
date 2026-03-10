"use client";
import { useState } from 'react';

export default function ModifyModal({ isOpen, onClose, onSubmit, chapter }) {
  const [instruction, setInstruction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxChars = 500;
  const remaining = maxChars - instruction.length;

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      alert('Please enter an instruction');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(instruction.trim());
      setInstruction('');
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setInstruction('');
    onClose();
  };

  // Quick suggestions
  const suggestions = [
    "Make it more technical with equations and formulas",
    "Add more detail to the methodology section",
    "Simplify the language for better readability",
    "Include more practical examples",
    "Expand the analysis with deeper insights",
    "Make it more concise and to the point"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-slate-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">
              Surgical Modification
            </h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Chapter {chapter?.chapter_number} • Direct AI Instruction
          </p>
        </div>

        {/* Body */}
        <div className="p-8 sm:p-10">
          {/* Info Box */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-900 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Process Logic</p>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Your requirements will be added to the AI architect's context. The chapter will be rewritten to match your specific instructions.
                </p>
              </div>
            </div>
          </div>

          {/* Instruction Input */}
          <div className="mb-6">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
              Custom Requirements
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value.slice(0, maxChars))}
              rows="4"
              placeholder="e.g., Include more technical calculations, focus on Nigerian engineering standards..."
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all resize-none font-medium"
              autoFocus
            />
            <div className="flex justify-between items-center mt-3 px-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Be technically specific
              </p>
              <p className={`text-[10px] font-black tracking-widest ${remaining < 50 ? 'text-red-500' : 'text-slate-400'}`}>
                {remaining} / {maxChars}
              </p>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Templates:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInstruction(suggestion)}
                  className="text-[10px] font-bold px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-10">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <p className="text-[10px] font-bold text-amber-700 leading-none">
                Previous AI draft will be overwritten. Manual edits are not preserved.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!instruction.trim() || submitting}
              className="flex-[2] bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              )}
              Apply & Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}