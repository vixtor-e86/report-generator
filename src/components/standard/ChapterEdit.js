"use client";
import { useState } from 'react';

export default function ChapterEdit({ chapter, onSave, onCancel }) {
  const [content, setContent] = useState(chapter.content || '');
  const [saving, setSaving] = useState(false);
  const [showTablePrompt, setShowTablePrompt] = useState(false);
  const [tableConfig, setTablePromptConfig] = useState({ rows: 3, cols: 3 });

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

  const insertTable = () => {
    const { rows, cols } = tableConfig;
    let table = "\n";
    // Headers
    table += "| " + Array(cols).fill("Header").join(" | ") + " |\n";
    // Separator
    table += "| " + Array(cols).fill("---").join(" | ") + " |\n";
    // Rows
    for (let i = 0; i < rows; i++) {
      table += "| " + Array(cols).fill("Data").join(" | ") + " |\n";
    }
    table += "\n";

    const textarea = document.querySelector('textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setContent(before + table + after);
    setShowTablePrompt(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + table.length;
    }, 10);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="max-w-5xl mx-auto print:hidden relative">
      {/* Header - Sticky */}
      <div className="bg-white rounded-t-3xl border border-slate-200 p-6 sm:p-8 sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Edit Technical Draft
            </h2>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Chapter {chapter.chapter_number} • Precise Manual Control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-slate-900 font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
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

      {/* Editor Guide - Sticky below main header */}
      <div className="bg-slate-50 border-x border-b border-slate-200 px-8 sm:px-12 py-3 sticky top-[136px] z-20 flex flex-wrap gap-4 items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editor Guide:</span>
        <div className="flex flex-wrap gap-3">
          <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold"># Header</code>
          <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">**Bold**</code>
          <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">- List</code>
          <button 
            onClick={() => setShowTablePrompt(true)}
            className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Insert Table
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="bg-white border-x border-slate-200">
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

      {/* Table Configuration Prompt Modal */}
      {showTablePrompt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[280px] border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Table Dimensions</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rows</label>
                <input 
                  type="number" min="1" max="20"
                  value={tableConfig.rows}
                  onChange={(e) => setTablePromptConfig({...tableConfig, rows: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Columns</label>
                <input 
                  type="number" min="1" max="10"
                  value={tableConfig.cols}
                  onChange={(e) => setTablePromptConfig({...tableConfig, cols: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowTablePrompt(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={insertTable}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
