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
  handlePrintFullReport: handlePrintFullReportProp,
  checkAccessAndPrint
}) {
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);

  const printFullFn = onPrintFullReport || handlePrintFullReportProp;
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
      checkAccessAndPrint(printFullFn);
    } else if (printFullFn) {
      printFullFn();
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
              className="bg-white border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2"
            >
              Edit
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* Print Current Chapter */}
            <button 
              onClick={handlePrintCurrent} 
              className="p-2 text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 px-2.5 py-2 rounded-xl hover:bg-slate-100" 
              title="Print Current Chapter as PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">Print Ch.</span>
            </button>

            {/* Primary Action: Export PDF */}
            <button
              onClick={handlePrintFull}
              disabled={isExportRestricted}
              className="bg-slate-900 text-white px-4 sm:px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isExportRestricted ? "Generate all chapters to export full PDF report" : "Export Full Report as PDF"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>{isExportRestricted ? 'Incomplete' : 'Export PDF'}</span>
            </button>
        </div>
      )}

      <ProjectDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        project={project}
        onSubmit={onUpdateProjectDetails}
        canChangeReferenceStyle={false}
      />
    </div>
  );
}
