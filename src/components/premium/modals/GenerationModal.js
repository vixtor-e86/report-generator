// src/components/premium/modals/GenerationModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  X: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  File: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  Check: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Activity: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Zap: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Search: (props) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
};

export default function GenerationModal({ 
  isOpen, onClose, uploadedImages = [], researchPapers = [], 
  activeChapter, projectId, userId, projectData, onGenerateSuccess,
  setIsGlobalLoading, setGlobalLoadingText,
  formData, setFormData
}) {
  const [activeTab, setActiveTab] = useState('details');
  const [generating, setGenerating] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [extractedPreview, setExtractedPreview] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const currentChapterNumber = activeChapter?.number || activeChapter?.id || 0;
  const isChapter4 = currentChapterNumber === 4;

  useEffect(() => {
    if (isOpen && projectData && !formData.projectTitle) {
      setFormData(prev => ({
        ...prev,
        projectTitle: projectData.title || '',
        projectDescription: projectData.description || '',
        componentsUsed: projectData.components_used || '',
        researchBooks: projectData.research_papers_context || '',
      }));
    }
    if (isOpen) {
      setActiveTab(currentChapterNumber > 1 ? 'materials' : 'details');
    }
  }, [isOpen, projectData, currentChapterNumber]);

  const handlePreviewFile = async (file) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setExtractedPreview('');
    try {
      const res = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'test', userId: 'test', chapterNumber: 4, selectedContextFiles: [file], testOnly: true })
      });
      const data = await res.json();
      setExtractedPreview(data.debugExtractions || 'No text could be extracted.');
    } catch (e) {
      setExtractedPreview('Error loading preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleContextFile = (file) => {
    setFormData(prev => ({
      ...prev,
      selectedContextFiles: prev.selectedContextFiles.find(f => f.id === file.id)
        ? prev.selectedContextFiles.filter(f => f.id !== file.id)
        : [...prev.selectedContextFiles, file]
    }));
    setPreviewFile(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText(`AI Architect is designing Chapter ${currentChapterNumber}...`);
      setIsGlobalLoading(true);
    }
    try {
      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId, userId, chapterNumber: currentChapterNumber, chapterTitle: activeChapter?.title,
          ...formData,
          selectedImages: uploadedImages.filter(img => formData.selectedImages.includes(img.id)),
          selectedPapers: researchPapers.filter(p => formData.selectedPapers.includes(p.id))
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }
      if (onGenerateSuccess) onGenerateSuccess();
      onClose();
    } catch (error) { alert(error.message); }
    finally { setGenerating(false); if (setIsGlobalLoading) setIsGlobalLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col z-[1000] max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase">Chapter {currentChapterNumber}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeChapter?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
        </div>

        <div className="flex bg-slate-50 border-b p-1 gap-1">
          <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-xs font-black rounded-2xl transition-all ${activeTab === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>1. CONTEXT</button>
          <button onClick={() => setActiveTab('materials')} className={`flex-1 py-3 text-xs font-black rounded-2xl transition-all ${activeTab === 'materials' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>2. MATERIALS</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Project Title</label>
                <input type="text" value={formData.projectTitle} onChange={(e) => setFormData({...formData, projectTitle: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none transition-all font-bold text-slate-900" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">AI Prompt / Custom Details</label>
                <textarea value={formData.userPrompt} onChange={(e) => setFormData({...formData, userPrompt: e.target.value})} placeholder="e.g. Focus on technical calculations..." className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none transition-all font-medium text-slate-700 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Citation Style</label>
                  <select value={formData.referenceStyle} onChange={(e) => setFormData({...formData, referenceStyle: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-slate-900">
                    <option value="APA">APA</option>
                    <option value="IEEE">IEEE</option>
                    <option value="MLA">MLA</option>
                    <option value="Harvard">Harvard</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Target Words</label>
                  <input type="number" step="500" value={formData.targetWordCount} onChange={(e) => setFormData({...formData, targetWordCount: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-slate-900" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {isChapter4 && (
                <div className="p-6 bg-slate-900 rounded-[32px] text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center"><Icons.Activity /></div>
                    <h4 className="font-black text-sm uppercase tracking-widest">Experimental Data analysis</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">Select your test readings (PDF/DOCX). The AI will read the first 500 characters to perform technical evaluations.</p>
                  <div className="grid gap-2">
                    {researchPapers.filter(f => !f.file_type?.startsWith('image/')).map(f => {
                      const isSelected = formData.selectedContextFiles.find(sf => sf.id === f.id);
                      return (
                        <button key={f.id} onClick={() => handlePreviewFile(f)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-slate-800' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}>
                          <div className="flex items-center gap-3 truncate">
                            <Icons.File className="text-slate-500" />
                            <span className="text-xs font-bold truncate">{f.name || f.original_name}</span>
                          </div>
                          {isSelected && <Icons.Check className="text-indigo-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attach Visual Assets</h4>
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map(img => (
                    <div key={img.id} onClick={() => setFormData({...formData, selectedImages: formData.selectedImages.includes(img.id) ? formData.selectedImages.filter(i => i !== img.id) : [...formData.selectedImages, img.id]})} className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all cursor-pointer ${formData.selectedImages.includes(img.id) ? 'border-slate-900 shadow-lg scale-95' : 'border-slate-100'}`}>
                      <img src={img.src} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase">Limit: {formData.targetWordCount} Words</p>
          <button onClick={handleGenerate} disabled={generating || !formData.projectTitle} className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
            <Icons.Zap /> {generating ? 'AI IS WRITING...' : 'GENERATE CHAPTER'}
          </button>
        </div>

        <AnimatePresence>
          {previewFile && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 z-[1100] bg-white p-8 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase">Confirm Extraction</h3>
                <button onClick={() => setPreviewFile(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><Icons.X /></button>
              </div>
              <div className="flex-1 bg-slate-50 rounded-[32px] p-8 overflow-y-auto border-2 border-slate-100 mb-8">
                {previewLoading ? (
                  <div className="h-full flex items-center justify-center animate-pulse font-black text-slate-300">READING TECHNICAL DATA...</div>
                ) : (
                  <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">{extractedPreview}</pre>
                )}
              </div>
              <button onClick={() => toggleContextFile(previewFile)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-sm shadow-2xl transition-all flex items-center justify-center gap-3">
                {formData.selectedContextFiles.find(f => f.id === previewFile.id) ? 'REMOVE FROM ANALYSIS' : 'CONFIRM & USE DATA'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
