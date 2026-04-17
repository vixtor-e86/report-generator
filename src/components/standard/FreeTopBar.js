"use client";
import { useState } from 'react';
import ProjectDetailsModal from './ProjectDetailsModal';

export default function FreeTopBar({
  chapter,
  isEditing,
  generating,
  project,
  onEdit,
  onSave,
  onGenerate,
  onPrintCurrentChapter,
  onUpdateProjectDetails,
  allChaptersGenerated,
  onPrintFullReport,
  checkAccessAndPrint
}) {
  const [exporting, setExporting] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);

  const isGenerated = chapter && (chapter.status === 'draft' || chapter.status === 'edited' || chapter.status === 'approved');
  
  // Rule: Export/Full Print is locked until all chapters are finished
  const isExportRestricted = !allChaptersGenerated;

  const handlePrintCurrent = () => {
    if (checkAccessAndPrint) {
      checkAccessAndPrint(onPrintCurrentChapter || (() => window.print()));
    } else if (onPrintCurrentChapter) {
      onPrintCurrentChapter();
    }
  };

  const handlePrintFull = () => {
    if (isExportRestricted) return;
    if (checkAccessAndPrint) {
      checkAccessAndPrint(onPrintFullReport);
    } else if (onPrintFullReport) {
      onPrintFullReport();
    }
  };

  const handleExportDOCX = async () => {
    if (isExportRestricted) return;
    setExporting(true);

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
    } catch (error) {
      console.error('Export error:', error);
      alert(error.message || 'Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      {!chapter ? (
         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">Select Chapter</div>
      ) : isEditing ? (
        <>
          <button onClick={onSave} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Save Edits</button>
        </>
      ) : !isGenerated ? (
        <>
          <button
            onClick={() => setShowEditDetailsModal(true)}
            disabled={generating}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <span className="hidden sm:inline">Edit Details</span>
            <span className="sm:hidden">Edit</span>
          </button>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2"
          >
            {generating ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
            Generate
          </button>
        </>
      ) : (
        <div className="flex items-center gap-1 sm:gap-2">
            {/* Manual Edit */}
            <button
              onClick={onEdit}
              className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2"
            >
              Edit
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <button onClick={handlePrintCurrent} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Print Chapter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            </button>

            <button
              onClick={handlePrintFull}
              disabled={isExportRestricted}
              className={`p-2 transition-colors ${!isExportRestricted ? 'text-emerald-500 hover:text-emerald-700' : 'text-slate-200'}`}
              title={!isExportRestricted ? "Print Full Report" : "Complete all chapters to unlock"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </button>

            <button
              onClick={handleExportDOCX}
              disabled={exporting || isExportRestricted}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-30"
            >
              {exporting ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
              <span className="hidden xs:inline">{isExportRestricted ? 'Incomplete' : 'Export'}</span>
            </button>
        </div>
      )}

      <ProjectDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        project={project}
        onSubmit={onUpdateProjectDetails}
      />
    </div>
  );
}
