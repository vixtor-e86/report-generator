// src/components/premium/modals/ExportModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Grip: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 01.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
};

function SortableItem({ id, file }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm mb-2 group active:scale-[0.98] transition-all">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500"><Icons.Grip /></div>
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Icons.File /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900 truncate">{file.name || file.original_name}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF Attachment</p>
      </div>
    </div>
  );
}

export default function ExportModal({ isOpen, onClose, type, projectDocs, chapters, projectId, userId, setIsGlobalLoading, setGlobalLoadingText, onSaved }) {
  const [orderedDocs, setOrderedDocs] = useState([]);
  const [options, setFormData] = useState({ includeAbstract: true, includeTOC: true, includePageNumbers: true });
  const [exportState, setExportState] = useState('idle'); // idle | processing | ready
  const [exportUrl, setExportUrl] = useState(null);
  const [exportSize, setExportSize] = useState(0);
  const [isSavingToFiles, setIsSavingToFiles] = useState(false);

  const isDocx = type === 'docx';

  useEffect(() => {
    if (isOpen) {
      setOrderedDocs(projectDocs || []);
      setExportState('idle');
      setExportUrl(null);
    }
  }, [isOpen, projectDocs]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setOrderedDocs((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleStartExport = async () => {
    setExportState('processing');
    setIsGlobalLoading(true);
    setGlobalLoadingText(`Architecting your professional ${type.toUpperCase()}...`);
    try {
      const response = await fetch('/api/premium/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId, type, orderedDocIds: isDocx ? [] : orderedDocs.map(d => d.id), options })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Export failed');
      setExportUrl(data.fileUrl);
      setExportSize(data.fileSize); // Added state for size
      setExportState('ready');
    } catch (err) { alert(err.message); setExportState('idle'); }
    finally { setIsGlobalLoading(false); }
  };

  const handleSaveToAssets = async () => {
    setIsSavingToFiles(true);
    try {
      const response = await fetch('/api/premium/save-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: exportUrl,
          projectId,
          userId,
          name: `Full_Project_${type.toUpperCase()}_${new Date().toLocaleDateString().replace(/\//g, '-')}.${isDocx ? 'docx' : 'pdf'}`,
          type: 'general', // Changed from project_component
          sizeBytes: exportSize // Pass the real size for the meter
        })
      });
      if (!response.ok) throw new Error('Failed to add to files');
      if (onSaved) onSaved();
      alert('Project export added to your files tab!');
    } catch (err) { alert(err.message); }
    finally { setIsSavingToFiles(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={onClose} />
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
        className={`relative bg-white md:rounded-[40px] shadow-2xl w-full ${isDocx ? 'max-w-xl' : 'max-w-7xl'} overflow-hidden flex flex-col h-full md:h-auto md:max-h-[850px]`}>
        
        <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><Icons.Download /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Export {type.toUpperCase()}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure project formatting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* File Ordering (Only for PDF) */}
          {!isDocx && (
            <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white/50 shrink-0">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Step 1: Order PDF Attachments</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Arrange your uploaded PDF components before the chapters.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {orderedDocs.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedDocs.map(d => d.id)} strategy={verticalListSortingStrategy}>
                      {orderedDocs.map(doc => <SortableItem key={doc.id} id={doc.id} file={doc} />)}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-sm font-bold text-slate-900">No PDF attachments found</p>
                    <p className="text-xs max-w-[200px] mt-1">Upload PDF files in the sidebar to order them here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Options & Settings */}
          <div className={`${isDocx ? 'w-full' : 'w-full md:w-96'} p-8 flex flex-col bg-white overflow-y-auto`}>
            <div className="space-y-10">
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Configuration</h4>
                <div className="space-y-4">
                  <ToggleItem active={options.includeAbstract} onClick={() => setFormData(p => ({ ...p, includeAbstract: !p.includeAbstract }))} title="Generate Abstract" desc="AI will write a technical summary of your research." />
                  <ToggleItem active={options.includeTOC} onClick={() => setFormData(p => ({ ...p, includeTOC: !p.includeTOC }))} title="Table of Contents" desc="Include an automated TOC page with numbering." />
                  <ToggleItem active={options.includePageNumbers} onClick={() => setFormData(p => ({ ...p, includePageNumbers: !p.includePageNumbers }))} title="Page Numbering" desc="Add academic numbering to the document footer." />
                </div>
                
                {isDocx && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <div className="text-slate-400 shrink-0 mt-0.5"><Icons.Info /></div>
                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
                      Tip: Use <span className="text-slate-900">Export PDF</span> if you want to merge cover pages or certifications with your report.
                    </p>
                  </div>
                )}
              </section>

              <section className="bg-slate-50 rounded-3xl p-6 border-2 border-dashed border-slate-200">
                {exportState === 'idle' && (
                  <div className="text-center">
                    <button onClick={handleStartExport} className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                      <Icons.Sparkles /> {isDocx ? 'BUILD DOCX FILE' : 'PREPARE PROJECT FILE'}
                    </button>
                  </div>
                )}
                {exportState === 'processing' && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">Building {type.toUpperCase()}...</p>
                  </div>
                )}
                {exportState === 'ready' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-4"><Icons.Check /> {type.toUpperCase()} ready</div>
                    <button onClick={handleSaveToAssets} disabled={isSavingToFiles} className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all">
                      {isSavingToFiles ? "SAVING..." : <><Icons.Plus /> ADD TO FILES TAB</>}
                    </button>
                    <a href={exportUrl} download className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-xs flex items-center justify-center gap-2 no-underline transition-all hover:bg-slate-50">
                      <Icons.Download /> DOWNLOAD NOW
                    </a>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ToggleItem({ active, onClick, title, desc }) {
  return (
    <button onClick={onClick} className={`w-full p-5 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${active ? 'border-slate-900 bg-white shadow-lg' : 'border-slate-50 bg-slate-50/50 opacity-60'}`}>
      <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${active ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}>{active && <Icons.Check />}</div>
      <div><p className="text-sm font-black text-slate-900 leading-none">{title}</p><p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-2 uppercase tracking-wide">{desc}</p></div>
    </button>
  );
}
