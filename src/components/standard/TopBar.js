"use client";
import { useState } from 'react';
import ProjectDetailsModal from './ProjectDetailsModal';

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
  onSuggestImprovements,
  showNotification,
  onUpdateProjectDetails,
  onPrintFullReport
}) {
  const [exporting, setExporting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);

  const isGenerated = chapter && (chapter.status === 'draft' || chapter.status === 'edited' || chapter.status === 'approved');
  const canRegenerate = isGenerated && project.tokens_used < project.tokens_limit;

  const handlePrintCurrent = () => {
    if (onPrintCurrentChapter) onPrintCurrentChapter();
    else window.print();
    setShowMobileMenu(false);
  };

  const handlePrintFull = () => {
    if (onPrintFullReport) onPrintFullReport();
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
      if (!response.ok) throw new Error(data.error || 'Export failed');

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

      if (showNotification) showNotification('Success', 'Document exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      if (showNotification) showNotification('Export Error', error.message || 'Failed to export document', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 print:hidden">
      <div className="flex justify-between items-center gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button onClick={onToggleSidebar} className="text-slate-400 hover:text-slate-900 transition-colors flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate tracking-tight">
                {chapter ? chapter.title : 'Technical Workspace'}
              </h1>
              <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                STANDARD
              </span>
            </div>
            {chapter && isGenerated && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 hidden sm:block">
                Project Architect • Chapter {chapter.chapter_number} • Draft
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!chapter ? (
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">Initialization Required</div>
          ) : isEditing ? (
            <>
              <button onClick={onSave} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Save Changes</button>
            </>
          ) : !isGenerated ? (
            <>
              <button
                onClick={() => setShowEditDetailsModal(true)}
                disabled={generating}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                Edit Details
              </button>
              <button
                onClick={onGenerate}
                disabled={generating}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2"
              >
                {generating ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
                Generate
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2">
                    <button onClick={onEdit} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all">Manual Edit</button>
                    <button onClick={onSuggestImprovements} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Analyze</button>
                    <button onClick={onRegenerate} disabled={!canRegenerate} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 disabled:opacity-40">Regen</button>
                    <button onClick={onModifyRegenerate} disabled={!canRegenerate} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 disabled:opacity-40">Modify</button>
                </div>

                <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block"></div>

                <button onClick={handlePrintCurrent} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Print Chapter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                </button>

                <button onClick={handlePrintFull} className="p-2 text-emerald-500 hover:text-emerald-700 transition-colors" title="Print Full Report">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </button>

                <button onClick={handleExportDOCX} disabled={exporting} className="hidden sm:flex bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg items-center gap-2">
                  {exporting ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                  Export
                </button>

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
                          Manual Edit
                        </button>
                        <button onClick={() => { onSuggestImprovements(); setShowMobileMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          Analyze Content
                        </button>
                        <button 
                          onClick={() => { onRegenerate(); setShowMobileMenu(false); }} 
                          disabled={!canRegenerate}
                          className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 disabled:opacity-40"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                          Regenerate
                        </button>
                        <button 
                          onClick={() => { onModifyRegenerate(); setShowMobileMenu(false); }} 
                          disabled={!canRegenerate}
                          className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 disabled:opacity-40"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          Modify Content
                        </button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={handlePrintCurrent} className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          Print Chapter
                        </button>
                        <button onClick={handlePrintFull} className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          Full Report
                        </button>
                        <button onClick={handleExportDOCX} disabled={exporting} className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-900">
                          {exporting ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-200 border-t-slate-900" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                          Export DOCX
                        </button>
                      </div>
                    </>
                  )}
                </div>
            </div>
          )}
        </div>
      </div>

      <ProjectDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        project={project}
        onSubmit={onUpdateProjectDetails}
      />

      {/* Token Warning */}
      {project?.tier === 'standard' && chapter && isGenerated && !canRegenerate && (
        <div className="mt-3 mx-8 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <p className="text-sm font-semibold text-red-900">Token limit reached</p>
            <p className="text-xs text-red-700">You've used all {project?.tokens_limit?.toLocaleString()} tokens. Upgrade for unlimited access.</p>
          </div>
        </div>
      )}
    </div>
  );
}
