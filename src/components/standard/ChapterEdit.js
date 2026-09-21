"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChapterEdit({ chapter, onSave, onCancel }) {
  const [content, setContent] = useState(chapter.content || '');
  const [saving, setSaving] = useState(false);
  const [showTablePrompt, setShowTablePrompt] = useState(false);
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
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
      <div className="bg-slate-50 border-x border-b border-slate-200 px-6 sm:px-12 py-3 sticky top-[136px] z-20 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Markdown Guide:</span>
          <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold"># Header</code>
          <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">**Bold**</code>
          <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">- List</code>
          <code className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">| Table |</code>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTablePrompt(true)}
            className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Insert Table
          </button>
          <button 
            onClick={() => setShowMarkdownGuide(true)}
            className="text-[10px] bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-900 px-3 py-1 rounded-lg font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            View Full Guide
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

      {/* Markdown Comparison Guide Modal */}
      {showMarkdownGuide && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Markdown Comparison Guide
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  See how your markdown syntax translates into the rendered academic report.
                </p>
              </div>
              <button
                onClick={() => setShowMarkdownGuide(false)}
                className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-900 transition-colors"
                title="Close Guide"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 border-b border-slate-100">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Markdown Syntax
                </div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:block">
                  Rendered Preview
                </div>
              </div>

              <div className="space-y-6">
                {[
                  {
                    title: "Headings & Section Hierarchy",
                    markdown: "# Chapter 1: Introduction\n## 1.1 Technical Background\n### 1.1.1 Problem Scope"
                  },
                  {
                    title: "Text Emphasis",
                    markdown: "**Bold technical parameter**\n*Italicized publication or concept*\n~~Deprecated specification~~"
                  },
                  {
                    title: "Bullet & Numbered Lists",
                    markdown: "- Core system requirement\n- Environmental constraint\n  - Secondary tolerance spec\n\n1. Initial baseline audit\n2. Experimental synthesis\n3. Empirical evaluation"
                  },
                  {
                    title: "Academic Tables & Data",
                    markdown: "| Metric | Target Spec | Empirical Result |\n| :--- | :--- | :--- |\n| Voltage Supply | 5.0 V | 4.98 V |\n| Efficiency Rate | > 85% | 89.2% |"
                  },
                  {
                    title: "Blockquotes & Key Findings",
                    markdown: "> Core Engineering Insight: System impedance must remain matched to 50 ohms across all high-frequency traces."
                  },
                  {
                    title: "Inline Code & Mathematical Snippets",
                    markdown: "Execute build command `npm run build` or evaluate impedance: `Z = sqrt(R^2 + (wL - 1/wC)^2)`."
                  },
                  {
                    title: "In-Text Citations & Academic References",
                    markdown: "According to modern IEEE research standards [1], distributed microgrids enhance resilience.\n\n[1] J. Smith and R. Taylor, \"Low-latency protocols in modern grids,\" *IEEE Trans. Smart Grid*, 2024."
                  }
                ].map((ex, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-6 border-b border-slate-100 last:border-b-0">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-2">
                        {ex.title}
                      </span>
                      <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {ex.markdown}
                      </pre>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                      <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:tracking-tight prose-table:text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {ex.markdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Manual edits in this editor are free and do not consume your AI token limit.
              </p>
              <button
                onClick={() => setShowMarkdownGuide(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
