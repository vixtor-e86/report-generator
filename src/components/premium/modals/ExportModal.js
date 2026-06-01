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
import { Badge } from '@/components/marketplace/ui/badge';
import { Button } from '@/components/marketplace/ui/button';
import { toast } from 'sonner';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Grip: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 01.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
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

export default function ExportModal({ isOpen, onClose, type, projectDocs, chapters, projectId, userId, setIsGlobalLoading, setGlobalLoadingText, onSaved, showNotification, projectData }) {
  const [orderedDocs, setOrderedDocs] = useState([]);
  const [options, setOptions] = useState({ 
    includeAbstract: true, 
    includeTOC: true, 
    includePageNumbers: true,
    coverConfig: {
      type: 'none', // none | form | upload | asset
      assetId: null,
      assetUrl: null,
      uploadUrl: null,
      includeDeclaration: false,
      includeCertification: false,
      includeDedication: false,
      includeAcknowledgement: false
    },
    metadata: {
      university: '',
      projectTitle: projectData?.title || '',
      studentName: '',
      matricNo: '',
      faculty: projectData?.faculty || '',
      department: projectData?.department || '',
      supervisor: '',
      hod: '',
      externalExaminer: '',
      session: '2023/2024',
      date: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      dedication: '',
      acknowledgement: ''
    }
  });

  const [activeStep, setActiveStep] = useState(0); // 0: Cover, 1: Attachments (PDF only), 2: Final Options
  const [exportState, setExportState] = useState('idle');
  const [exportUrl, setExportUrl] = useState(null);
  const [exportSize, setExportSize] = useState(0);
  const [isSavingToFiles, setIsSavingToFiles] = useState(false);

  const isDocx = type === 'docx';

  useEffect(() => {
    if (isOpen) {
      setOrderedDocs(projectDocs?.filter(d => d.file_type === 'application/pdf') || []);
      setExportState('idle');
      setExportUrl(null);
      setActiveStep(0);
      
      // Pre-fill metadata from project data if available
      setOptions(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          projectTitle: projectData?.title || prev.metadata.projectTitle,
          faculty: projectData?.faculty || prev.metadata.faculty,
          department: projectData?.department || prev.metadata.department
        }
      }));
    }
  }, [isOpen, projectDocs, projectData]);

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
        body: JSON.stringify({ 
          projectId, 
          userId, 
          type, 
          orderedDocIds: isDocx ? [] : orderedDocs.map(d => d.id), 
          options 
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Export failed');
      
      setExportUrl(data.fileUrl);
      setExportSize(data.fileSize);
      setExportState('ready');
    } catch (err) { 
      if (showNotification) showNotification('Export Failed', err.message, 'error');
      setExportState('idle'); 
    }
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
          type: 'general',
          sizeBytes: exportSize
        })
      });
      if (!response.ok) throw new Error('Failed to add to files');
      if (onSaved) onSaved();
      if (showNotification) showNotification('Saved Successfully', 'Project export added to your files tab!', 'success');
    } catch (err) { 
      if (showNotification) showNotification('Error Saving', err.message, 'error');
    }
    finally { setIsSavingToFiles(false); }
  };

  if (!isOpen) return null;

  const projectImages = projectDocs?.filter(d => d.file_type?.startsWith('image/')) || [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={onClose} />
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
        className="relative bg-white md:rounded-[40px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-full md:h-[90vh]">
        
        {/* Header */}
        <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><Icons.Download /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">Export {type.toUpperCase()}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step {activeStep + 1}: {activeStep === 0 ? 'Cover Configuration' : activeStep === 1 && !isDocx ? 'Attachments' : 'Final Review'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
        </div>

        {/* Multi-Step Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* LEFT SIDE: CONFIGURATION */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50 border-r border-slate-100 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <motion.div key="step-cover" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 pb-10">
                  <header>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Project Cover Page</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">Select how you want your cover page to look.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ChoiceCard active={options.coverConfig.type === 'none'} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, type: 'none' } }))} icon="❌" title="No Cover" desc="Start directly with the content." />
                    <ChoiceCard active={options.coverConfig.type === 'form'} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, type: 'form' } }))} icon={<Icons.Sparkles />} title="Build Cover" desc="Manually build a professional academic cover." />
                    <ChoiceCard active={options.coverConfig.type === 'asset'} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, type: 'asset' } }))} icon={<Icons.Image />} title="From Assets" desc="Use an image already in your project." />
                    <ChoiceCard active={options.coverConfig.type === 'upload'} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, type: 'upload' } }))} icon={<Icons.Upload />} title="Upload Custom" desc="Upload a custom cover image from your PC." />
                  </div>

                  {options.coverConfig.type === 'form' && (
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm animate-in zoom-in-95 duration-300 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="University / Institution" value={options.metadata.university} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, university: v } }))} placeholder="e.g. University of Ilorin" />
                        <InputGroup label="Project Title" value={options.metadata.projectTitle} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, projectTitle: v } }))} />
                        <InputGroup label="Student Full Name" value={options.metadata.studentName} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, studentName: v } }))} placeholder="e.g. Wale Shedrack" />
                        <InputGroup label="Matric / Reg Number" value={options.metadata.matricNo} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, matricNo: v } }))} placeholder="e.g. 20/0512" />
                        <InputGroup label="Faculty" value={options.metadata.faculty} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, faculty: v } }))} placeholder="e.g. Engineering" />
                        <InputGroup label="Department" value={options.metadata.department} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, department: v } }))} placeholder="e.g. Civil Engineering" />
                        <InputGroup label="Supervisor" value={options.metadata.supervisor} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, supervisor: v } }))} placeholder="e.g. Dr. A. B. Mustapha" />
                        <InputGroup label="HOD Name" value={options.metadata.hod} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, hod: v } }))} placeholder="e.g. Prof. I. A. Odun-Ayo" />
                        <InputGroup label="External Examiner" value={options.metadata.externalExaminer} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, externalExaminer: v } }))} />
                        <InputGroup label="Academic Session" value={options.metadata.session} onChange={v => setOptions(p => ({ ...p, metadata: { ...p.metadata, session: v } }))} placeholder="e.g. 2023/2024" />
                      </div>

                      <div className="pt-8 border-t border-slate-100 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Technical Pages</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ToggleMini active={options.coverConfig.includeDeclaration} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, includeDeclaration: !p.coverConfig.includeDeclaration } }))} title="Declaration Page" />
                            <ToggleMini active={options.coverConfig.includeCertification} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, includeCertification: !p.coverConfig.includeCertification } }))} title="Certification Page" />
                            <ToggleMini active={options.coverConfig.includeDedication} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, includeDedication: !p.coverConfig.includeDedication } }))} title="Dedication Page" />
                            <ToggleMini active={options.coverConfig.includeAcknowledgement} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, includeAcknowledgement: !p.coverConfig.includeAcknowledgement } }))} title="Acknowledgement Page" />
                        </div>
                      </div>

                      {(options.coverConfig.includeDedication || options.coverConfig.includeAcknowledgement) && (
                        <div className="pt-8 border-t border-slate-100 space-y-6">
                            {options.coverConfig.includeDedication && (
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dedication Text</label>
                                    <textarea 
                                        value={options.metadata.dedication}
                                        onChange={e => setOptions(p => ({ ...p, metadata: { ...p.metadata, dedication: e.target.value } }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-medium text-xs text-slate-900 min-h-[80px] focus:bg-white focus:border-slate-900 transition-all outline-none"
                                        placeholder="Dedicated to..."
                                    />
                                </div>
                            )}
                            {options.coverConfig.includeAcknowledgement && (
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Acknowledgement Text</label>
                                    <textarea 
                                        value={options.metadata.acknowledgement}
                                        onChange={e => setOptions(p => ({ ...p, metadata: { ...p.metadata, acknowledgement: e.target.value } }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-medium text-xs text-slate-900 min-h-[100px] focus:bg-white focus:border-slate-900 transition-all outline-none"
                                        placeholder="I wish to express my gratitude to..."
                                    />
                                </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {options.coverConfig.type === 'asset' && (
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm min-h-[300px]">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {projectImages.map(img => (
                          <button key={img.id} onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, assetId: img.id, assetUrl: img.file_url } }))} className={`aspect-[3/4] rounded-2xl overflow-hidden border-4 transition-all ${options.coverConfig.assetId === img.id ? 'border-indigo-600' : 'border-slate-100 hover:border-slate-300'}`}>
                            <img src={img.file_url} className="w-full h-full object-cover" alt="" />
                          </button>
                        ))}
                      </div>
                      {projectImages.length === 0 && <p className="text-center text-slate-400 py-20 font-bold italic uppercase text-xs tracking-widest">No images found in your project assets</p>}
                    </div>
                  )}

                  {options.coverConfig.type === 'upload' && (
                    <div className="bg-white rounded-[32px] p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4"><Icons.Upload /></div>
                        {options.coverConfig.uploadUrl ? (
                            <div className="text-center">
                                <div className="w-32 h-40 rounded-xl overflow-hidden border-4 border-emerald-500 mx-auto mb-4 shadow-xl">
                                    <img src={options.coverConfig.uploadUrl} className="w-full h-full object-cover" alt="Uploaded cover" />
                                </div>
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Cover Uploaded Successfully</p>
                                <button onClick={() => setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, uploadUrl: null } }))} className="mt-4 text-[10px] font-black text-red-500 uppercase hover:underline">Remove and Re-upload</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-black text-slate-900 uppercase">Upload Custom Cover</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Recommended: 1240 x 1754 px (A4)</p>
                                <input type="file" className="mt-6 text-xs" accept="image/*" onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                    setOptions(p => ({ ...p, coverConfig: { ...p.coverConfig, uploadUrl: reader.result } }));
                                    };
                                    reader.readAsDataURL(file);
                                }
                                }} />
                            </>
                        )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeStep === 1 && !isDocx && (
                <motion.div key="step-attachments" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 pb-10">
                  <header>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Order PDF Attachments</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">Drag and drop to arrange your PDF components.</p>
                  </header>
                  <div className="max-w-2xl">
                    {orderedDocs.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={orderedDocs.map(d => d.id)} strategy={verticalListSortingStrategy}>
                            {orderedDocs.map(doc => <SortableItem key={doc.id} id={doc.id} file={doc} />)}
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="py-32 text-center opacity-40">
                        <div className="text-4xl mb-4">📄</div>
                        <p className="text-sm font-bold text-slate-900">No PDF attachments found</p>
                        <p className="text-xs max-w-[200px] mt-1 mx-auto uppercase font-black tracking-widest leading-loose">Upload PDF files in the sidebar to order them here.</p>
                        </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeStep === (isDocx ? 1 : 2) && (
                 <motion.div key="step-final" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 pb-10">
                    <header>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Final Configuration</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">Final review of document settings.</p>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                        <ToggleItem active={options.includeAbstract} onClick={() => setOptions(p => ({ ...p, includeAbstract: !p.includeAbstract }))} title="Generate Abstract" desc="AI will write a technical summary of your research." />
                        <ToggleItem active={options.includeTOC} onClick={() => setOptions(p => ({ ...p, includeTOC: !p.includeTOC }))} title="Table of Contents" desc="Include an automated TOC page with numbering." />
                        <ToggleItem active={options.includePageNumbers} onClick={() => setOptions(p => ({ ...p, includePageNumbers: !p.includePageNumbers }))} title="Page Numbering" desc="Add academic numbering to the document footer." />
                    </div>

                    <div className="bg-slate-900 rounded-[32px] p-8 text-white max-w-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                        <div className="flex items-center justify-between gap-8 relative z-10">
                            <div>
                                <h4 className="text-lg font-black uppercase tracking-tight leading-tight">Ready to build?</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 leading-loose">Your professional {type.toUpperCase()} is one click away from being architected.</p>
                            </div>
                            {exportState === 'idle' && (
                                <button onClick={handleStartExport} className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 whitespace-nowrap">
                                    Start Build
                                </button>
                            )}
                        </div>
                    </div>

                    {exportState === 'processing' && (
                        <div className="flex flex-col items-center py-10">
                            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest animate-pulse">Building your document...</p>
                        </div>
                    )}

                    {exportState === 'ready' && (
                        <div className="p-10 bg-emerald-50 rounded-[40px] border border-emerald-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 max-w-3xl mx-auto shadow-sm">
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-200 animate-bounce"><Icons.Check /></div>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Your Document is Ready</h4>
                            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Total Size: {(exportSize / 1024 / 1024).toFixed(2)} MB</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-10">
                                <button onClick={handleSaveToAssets} disabled={isSavingToFiles} className="py-5 bg-zinc-900 hover:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                                    {isSavingToFiles ? "Saving..." : <><Icons.Plus /> Add to Files</>}
                                </button>
                                <a href={exportUrl} download className="py-5 bg-white border-2 border-slate-200 hover:border-black text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-sm flex items-center justify-center gap-3 no-underline transition-all active:scale-95">
                                    <Icons.Download /> Download
                                </a>
                            </div>
                        </div>
                    )}
                 </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT SIDE: NAVIGATION/SUMMARY */}
          <div className="w-full md:w-80 bg-white p-8 flex flex-col shrink-0 border-t md:border-t-0 border-slate-100">
            <div className="flex-1 space-y-10">
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Build Progress</h4>
                <div className="space-y-4">
                  <StepIndicator active={activeStep === 0} completed={activeStep > 0} onClick={() => setActiveStep(0)} title="Cover Page" sub="Visual entry" />
                  {!isDocx && <StepIndicator active={activeStep === 1} completed={activeStep > 1} onClick={() => setActiveStep(1)} title="Attachments" sub="Merge PDFs" />}
                  <StepIndicator active={activeStep === (isDocx ? 1 : 2)} completed={exportState === 'ready'} onClick={() => setActiveStep(isDocx ? 1 : 2)} title="Finalize" sub="Review & Export" />
                </div>
              </section>

              <section className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Export Summary</h4>
                 <ul className="space-y-3">
                    <li className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Format</span><span className="text-[10px] font-black text-slate-900 uppercase">{type.toUpperCase()}</span></li>
                    <li className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Chapters</span><span className="text-[10px] font-black text-slate-900 uppercase">{chapters?.length || 0} Pages</span></li>
                    <li className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cover Mode</span><span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{options.coverConfig.type}</span></li>
                 </ul>
              </section>
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-3">
               <div className="flex gap-3">
                    {activeStep > 0 && (
                        <button onClick={() => setActiveStep(p => p - 1)} className="flex-1 py-4 border border-slate-200 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors">Back</button>
                    )}
                    {activeStep < (isDocx ? 1 : 2) && (
                        <button onClick={() => setActiveStep(p => p + 1)} className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2">
                            Next Step <Icons.ChevronRight />
                        </button>
                    )}
               </div>
               <button onClick={onClose} className="w-full py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors mt-2">Close Modal</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ChoiceCard({ active, onClick, icon, title, desc }) {
  return (
    <button onClick={onClick} className={`p-5 rounded-3xl border-2 transition-all text-center flex flex-col items-center gap-3 group relative ${active ? 'border-slate-900 bg-white shadow-xl scale-[1.02]' : 'border-slate-50 bg-slate-50/50 opacity-60 hover:opacity-100 hover:border-slate-200'}`}>
        {active && <div className="absolute top-3 right-3 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center scale-90"><Icons.Check /></div>}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 group-hover:bg-slate-100'}`}>{icon}</div>
        <div>
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{title}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">{desc}</p>
        </div>
    </button>
  );
}

function InputGroup({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white focus:border-slate-900 transition-all outline-none"
      />
    </div>
  );
}

function ToggleItem({ active, onClick, title, desc }) {
  return (
    <button onClick={onClick} className={`w-full p-6 rounded-[32px] border-2 transition-all text-left flex items-start gap-4 ${active ? 'border-slate-900 bg-white shadow-xl' : 'border-slate-100 bg-slate-50/30 opacity-60 hover:opacity-100 hover:border-slate-200'}`}>
      <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${active ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200'}`}>{active && <Icons.Check />}</div>
      <div><p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{title}</p><p className="text-[9px] text-slate-400 font-bold leading-relaxed mt-2 uppercase tracking-widest">{desc}</p></div>
    </button>
  );
}

function ToggleMini({ active, onClick, title }) {
    return (
      <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${active ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
        <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>{active && <Icons.Check />}</div>
        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{title}</span>
      </button>
    );
}

function StepIndicator({ active, completed, onClick, title, sub }) {
    return (
      <button onClick={onClick} className="flex items-center gap-4 w-full group text-left outline-none">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${active ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : completed ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-300'}`}>
            {completed ? <Icons.Check /> : <span className="font-black text-xs">{active ? '●' : ''}</span>}
        </div>
        <div>
            <p className={`text-[10px] font-black uppercase tracking-tight transition-colors ${active ? 'text-slate-900' : 'text-slate-400'}`}>{title}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sub}</p>
        </div>
      </button>
    );
}
