"use client";
import { useState } from 'react';

export default function TopBar({
  chapter,
  isEditing,
  generating,
  project,
  chapters,
  onEdit,
  onSave,
  onGenerate,
  onRegenerate,
  onModifyRegenerate,
  onToggleSidebar,
  onPrintCurrentChapter,
  onPreviewBeforeGenerate,
  onSuggestImprovements
}) {
  const [exporting, setExporting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isGenerated = chapter && (chapter.status === 'draft' || chapter.status === 'edited' || chapter.status === 'approved');
  const canRegenerate = isGenerated && project.tokens_used < project.tokens_limit;

  const handlePrintCurrentChapter = () => {
    if (onPrintCurrentChapter) {
      onPrintCurrentChapter();
    } else {
      window.print();
    }
    setShowMobileMenu(false);
  };

  const handleExportDOCX = async () => {
    setExporting(true);
    setShowMobileMenu(false);

    try {
      const response = await fetch('/api/standard/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          userId: project.user_id,
          format: 'docx'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

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

      alert('Document exported successfully!');

    } catch (error) {
      console.error('Export error:', error);
      alert(error.message || 'Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 print:hidden">
      <div className="flex justify-between items-center gap-4">
        {/* Left: Chapter Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            onClick={onToggleSidebar}
            className="text-slate-400 hover:text-slate-900 transition-colors flex-shrink-0"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate tracking-tight">
                {chapter ? (
                  <>
                    <span className="hidden sm:inline">{chapter.title || `Chapter ${chapter.chapter_number}`}</span>
                    <span className="sm:hidden">Chapter {chapter.chapter_number}</span>
                  </>
                ) : (
                  'Technical Workspace'
                )}
              </h1>
              {chapter && (
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">
                  v{chapter.version}
                </span>
              )}
            </div>
            {chapter && isGenerated && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 hidden sm:block">
                Academic Report Draft • {chapter.edit_count || 0} Edits
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!chapter ? (
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">Initialization Required</div>
          ) : isEditing ? (
            // EDITING MODE
            <>
              <button
                onClick={onSave}
                className="text-slate-400 hover:text-slate-900 px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
              >
                Discard
              </button>
              <button
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
              >
                Save Draft
              </button>
            </>
          ) : !isGenerated ? (
            // NOT GENERATED
            <>
              <button
                onClick={onGenerate}
                disabled={generating}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white"></div>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                )}
                Generate Content
              </button>

              <button
                onClick={onPreviewBeforeGenerate}
                disabled={generating}
                className="bg-white border-2 border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all hidden lg:flex items-center gap-2"
              >
                Preview Structure
              </button>
            </>
          ) : (
            // GENERATED
            <>
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={onEdit}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  Manual Edit
                </button>

                <button
                  onClick={onSuggestImprovements}
                  disabled={generating}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  Analyze
                </button>

                <button
                  onClick={onRegenerate}
                  disabled={!canRegenerate || generating}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  Regen
                </button>

                <button
                  onClick={onModifyRegenerate}
                  disabled={!canRegenerate || generating}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  Modify
                </button>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                <button
                  onClick={handlePrintCurrentChapter}
                  className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                  title="Print Report"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                </button>

                <button
                  onClick={handleExportDOCX}
                  disabled={exporting}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {exporting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white"></div>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  )}
                  Export Report
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="relative lg:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 bg-slate-100 rounded-lg text-slate-600 active:bg-slate-200 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>

                {showMobileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMobileMenu(false)}></div>
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <button onClick={() => { onEdit(); setShowMobileMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        Edit
                      </button>
                      <button onClick={() => { onSuggestImprovements(); setShowMobileMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900">
                        Analyze
                      </button>
                      <button onClick={() => { handleExportDOCX(); setShowMobileMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-900">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Export
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Token Limit Warning */}
      {chapter && isGenerated && !canRegenerate && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Token limit reached</p>
            <p className="text-xs text-red-700 mt-1">
              You've used all {project.tokens_limit.toLocaleString()} tokens. You can still edit manually or upgrade to Premium for unlimited regenerations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}