"use client";
import { useState } from 'react';

export default function ChapterEdit({ chapter, onSave, onCancel }) {
  const [content, setContent] = useState(chapter.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Chapter content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await onSave(content);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-t-3xl border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Edit Technical Draft
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Chapter {chapter.chapter_number} • Precise Manual Control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-slate-900 font-black text-[11px] uppercase tracking-widest transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white"></div>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Words</span>
            <span className="text-xs font-black text-slate-900">{wordCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Chars</span>
            <span className="text-xs font-black text-slate-900">{charCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white border-x border-slate-200">
        <div className="px-8 sm:px-12 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editor Guide:</span>
          <div className="flex gap-3">
            <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold"># Header 1</code>
            <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">## Header 2</code>
            <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">**Bold**</code>
            <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">- List</code>
            <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">1. Numbered</code>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[600px] sm:h-[750px] p-8 sm:p-12 outline-none text-slate-900 text-base sm:text-lg leading-relaxed transition-all resize-none font-sans"
          placeholder="Start typing your technical content here..."
          spellCheck="true"
          style={{ border: 'none' }}
        />
      </div>

      {/* Footer Tips */}
      <div className="bg-slate-50 rounded-b-3xl border border-slate-200 p-6">
        <p className="text-[10px] font-bold text-slate-400 italic text-center">Manual edits are tracked but do not consume your AI token limit.</p>
      </div>
    </div>
  );
}