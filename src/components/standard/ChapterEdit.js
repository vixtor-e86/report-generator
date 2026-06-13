"use client";
import { useState, useEffect } from 'react';

export default function ChapterEdit({ chapter, onSave, onCancel }) {
  const [content, setContent] = useState(chapter.content || '');
  const [saving, setSaving] = useState(false);
  const [showTablePrompt, setShowTablePrompt] = useState(false);
  const [tableConfig, setTablePromptConfig] = useState({ rows: 3, cols: 2 });
  const [tableData, setTableData] = useState([]);

  // Initialize/Resize table data grid ONLY when modal opens or dimensions change
  useEffect(() => {
    if (showTablePrompt) {
      setTableData(prev => {
        const newData = Array(tableConfig.rows).fill(0).map((_, r) => 
          Array(tableConfig.cols).fill(0).map((_, c) => prev[r]?.[c] || "")
        );
        return newData;
      });
    }
  }, [tableConfig.rows, tableConfig.cols, showTablePrompt]);

  const handleCellChange = (r, c, val) => {
    const newData = [...tableData];
    newData[r][c] = val;
    setTableData(newData);
  };

  const insertTable = () => {
    let table = "\n";
    // Headers (using first row as header)
    table += "| " + tableData[0].map(h => h || "Header").join(" | ") + " |\n";
    // Separator
    table += "| " + Array(tableConfig.cols).fill("---").join(" | ") + " |\n";
    // Data Rows
    for (let i = 1; i < tableData.length; i++) {
      table += "| " + tableData[i].map(d => d || "").join(" | ") + " |\n";
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
          <div className="bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Interactive Table Builder</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure and enter data before inserting</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Rows</span>
                  <input type="number" min="2" max="15" value={tableConfig.rows} onChange={e => setTablePromptConfig({...tableConfig, rows: Math.max(2, parseInt(e.target.value) || 2)})} className="w-8 bg-transparent text-xs font-black text-slate-900 outline-none" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Cols</span>
                  <input type="number" min="1" max="8" value={tableConfig.cols} onChange={e => setTablePromptConfig({...tableConfig, cols: Math.max(1, parseInt(e.target.value) || 1)})} className="w-8 bg-transparent text-xs font-black text-slate-900 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-8">
              <div className="max-h-[400px] overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Array(tableConfig.cols).fill(0).map((_, c) => (
                        <th key={c} className="p-3 bg-white border-b border-r border-slate-200 last:border-r-0">
                          <input 
                            placeholder={`Header ${c+1}`}
                            value={tableData[0]?.[c] || ""}
                            onChange={(e) => handleCellChange(0, c, e.target.value)}
                            className="w-full text-[11px] font-black uppercase text-blue-600 outline-none placeholder:text-slate-300"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array(tableConfig.rows - 1).fill(0).map((_, r) => (
                      <tr key={r}>
                        {Array(tableConfig.cols).fill(0).map((_, c) => (
                          <td key={c} className="p-3 border-b border-r border-slate-100 last:border-r-0 bg-white/50">
                            <input 
                              value={tableData[r+1]?.[c] || ""}
                              onChange={(e) => handleCellChange(r+1, c, e.target.value)}
                              className="w-full text-xs font-medium text-slate-600 outline-none"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowTablePrompt(false)}
                className="flex-1 py-4 text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={insertTable}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                Insert Completed Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
