// src/components/premium/modals/GenerationModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
  Target: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
};

export default function GenerationModal({ 
  isOpen, onClose, uploadedImages = [], researchPapers = [], dataFiles = [],
  activeChapter, projectId, userId, projectData, onGenerateSuccess,
  setIsGlobalLoading, setGlobalLoadingText,
  formData: stickyData, setFormData: setStickyData 
}) {
  const [localData, setLocalData] = useState({
    projectTitle: '', projectDescription: '', componentsUsed: '', researchBooks: '',
    userPrompt: '', selectedImages: [], selectedPapers: [], selectedContextFiles: [], skipReferences: false, targetWordCount: 2000,
    objectiveCount: 3 // Default for Chapter 1
  });

  const [activeTab, setActiveTab] = useState('details');
  const [generating, setGenerating] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [extractedPreview, setExtractedPreview] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const currentChapterNumber = activeChapter?.number || activeChapter?.id || 0;
  const isChapter1 = currentChapterNumber === 1;
  const isChapter4 = currentChapterNumber === 4;
  const isSubsequentChapter = currentChapterNumber > 1;

  useEffect(() => {
    if (isOpen && projectData) {
      setLocalData({
        projectTitle: projectData.title || '',
        projectDescription: projectData.description || '',
        componentsUsed: projectData.components_used || '',
        researchBooks: projectData.research_papers_context || '',
        userPrompt: '', selectedImages: [], selectedPapers: [], selectedContextFiles: [], skipReferences: false, targetWordCount: 2000,
        objectiveCount: 3
      });
      setActiveTab(isSubsequentChapter ? 'materials' : 'details');
    }
  }, [isOpen, projectData, currentChapterNumber, isSubsequentChapter]);

  const handlePreviewFile = async (file) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'test', userId: 'test', chapterNumber: 4, selectedContextFiles: [file], testOnly: true })
      });
      const data = await res.json();
      setExtractedPreview(data.debugExtractions || 'No text extracted.');
    } catch (e) { setExtractedPreview('Error loading data.'); }
    finally { setPreviewLoading(false); }
  };

  const toggleContextFile = (file) => {
    setLocalData(prev => ({
      ...prev,
      selectedContextFiles: prev.selectedContextFiles.find(f => f.id === file.id)
        ? prev.selectedContextFiles.filter(f => f.id !== file.id)
        : [...prev.selectedContextFiles, file]
    }));
    setPreviewFile(null);
  };

  const handleGenerate = async () => {
    if (!activeChapter) return;
    setGenerating(true);
    
    try {
      if (setIsGlobalLoading) {
        setGlobalLoadingText(`System Architect is designing Chapter ${currentChapterNumber}...`);
        setIsGlobalLoading(true);
      }

      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId, userId, chapterNumber: currentChapterNumber, chapterTitle: activeChapter?.title,
          ...localData,
          referenceStyle: stickyData.referenceStyle,
          maxReferences: stickyData.maxReferences,
          selectedImages: uploadedImages.filter(img => localData.selectedImages.includes(img.id)),
          selectedPapers: researchPapers.filter(p => localData.selectedPapers.includes(p.id))
        })
      });
      
      if (!response.ok) throw new Error('Generation failed');
      if (onGenerateSuccess) onGenerateSuccess();
      onClose();
    } catch (error) { 
      alert(error.message); 
    } finally { 
      setGenerating(false); 
      if (setIsGlobalLoading) setIsGlobalLoading(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxWidth: '800px', width: 'calc(100% - 32px)', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>{activeChapter ? `Generate ${activeChapter.title}` : 'Generate Chapter'}</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Configure content settings and research materials</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icons.X /></button>
        </div>

        {!activeChapter ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📂</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '800', color: '#111827' }}>No Chapter Selected</h3>
            <p style={{ color: '#6b7280', maxWidth: '360px', margin: '0 auto 32px', fontSize: '15px', lineHeight: '1.6' }}>Please select a chapter from the left sidebar before clicking generate.</p>
            <button onClick={onClose} style={{ padding: '12px 32px', background: '#111827', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700' }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button onClick={() => setActiveTab('details')} style={{ padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activeTab === 'details' ? '#111827' : '#6b7280', borderBottom: activeTab === 'details' ? '2px solid #111827' : '2px solid transparent' }}>Details & Context</button>
              <button onClick={() => setActiveTab('materials')} style={{ padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activeTab === 'materials' ? '#111827' : '#6b7280', borderBottom: activeTab === 'materials' ? '2px solid #111827' : '2px solid transparent' }}>Materials & References</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {activeTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {isChapter1 && (
                    <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe', marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: '#5b21b6', textTransform: 'uppercase', marginBottom: '12px' }}>
                        <Icons.Target /> Project Objectives
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <input 
                          type="range" min="1" max="8" step="1" 
                          value={localData.objectiveCount} 
                          onChange={(e) => setLocalData({...localData, objectiveCount: parseInt(e.target.value)})}
                          style={{ flex: 1, accentColor: '#7c3aed', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#7c3aed', background: 'white', padding: '4px 12px', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                          {localData.objectiveCount} Objectives
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#7c3aed' }}>Select how many specific research objectives the AI should generate for Chapter 1.</p>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Project Title</label>
                    <input type="text" value={localData.projectTitle} readOnly style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Project Description (Full Scope)</label>
                    <textarea value={localData.projectDescription} onChange={(e) => setLocalData({...localData, projectDescription: e.target.value})} placeholder="Describe the full scope of your project..." style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '100px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Components Used</label>
                      <textarea placeholder="e.g. Arduino, React, Tensile Tester" value={localData.componentsUsed} onChange={(e) => setLocalData({...localData, componentsUsed: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '80px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Research Context / Journals</label>
                      <textarea placeholder="e.g. IEEE Journal, Academic Journals" value={localData.researchBooks} onChange={(e) => setLocalData({...localData, researchBooks: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '80px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Custom Instructions</label>
                    <textarea value={localData.userPrompt} onChange={(e) => setLocalData({...localData, userPrompt: e.target.value})} placeholder="e.g. Focus on technical calculations..." style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '120px' }} />
                  </div>
                </div>
              )}

              {activeTab === 'materials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div onClick={() => setLocalData({...localData, skipReferences: !localData.skipReferences})} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', background: localData.skipReferences ? '#fef3c7' : 'white', border: `1px solid ${localData.skipReferences ? '#f59e0b' : '#d1d5db'}` }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${localData.skipReferences ? '#f59e0b' : '#d1d5db'}`, background: localData.skipReferences ? '#f59e0b' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{localData.skipReferences && <Icons.Check />}</div>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>No references for this chapter</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700' }}>Target Word Count</label>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#6366f1' }}>~{localData.targetWordCount.toLocaleString()} words</span>
                      </div>
                      <input type="range" min="1500" max="4000" step="100" value={localData.targetWordCount} onChange={(e) => setLocalData({...localData, targetWordCount: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer', accentColor: '#111827' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', opacity: localData.skipReferences ? 0.4 : 1, pointerEvents: localData.skipReferences ? 'none' : 'auto' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700' }}>Reference Style</label>
                        <select value={stickyData.referenceStyle} onChange={(e) => setStickyData({...stickyData, referenceStyle: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                          <option value="APA">APA</option><option value="IEEE">IEEE</option><option value="MLA">MLA</option><option value="Harvard">Harvard</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700' }}>Max References</label>
                        <input type="number" value={stickyData.maxReferences} onChange={(e) => setStickyData({...stickyData, maxReferences: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                      </div>
                    </div>
                  </div>

                  {isChapter4 && (
                    <div style={{ padding: '16px', background: '#111827', borderRadius: '12px', color: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Icons.Activity />
                        <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Experimental Data Analysis</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                        <Icons.Info style={{ color: '#6366f1' }} />
                        <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0, fontWeight: '700' }}>Note: Only DOCX and TXT files are supported for extraction.</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dataFiles.filter(f => {
                          const name = (f.name || f.original_name || "").toLowerCase();
                          return name.endsWith('.docx') || name.endsWith('.txt');
                        }).map(f => (
                          <div key={f.id} onClick={() => handlePreviewFile(f)} style={{ padding: '10px', borderRadius: '8px', background: localData.selectedContextFiles.find(sf => sf.id === f.id) ? '#374151' : '#1f2937', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px' }}>{f.name || f.original_name}</span>
                            {localData.selectedContextFiles.find(sf => sf.id === f.id) && <Icons.Check />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Select Saved References</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {researchPapers.map(paper => (
                        <div key={paper.id} onClick={() => setLocalData({...localData, selectedPapers: localData.selectedPapers.includes(paper.id) ? localData.selectedPapers.filter(id => id !== paper.id) : [...localData.selectedPapers, paper.id]})} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${localData.selectedPapers.includes(paper.id) ? '#111827' : '#e5e7eb'}`, background: localData.selectedPapers.includes(paper.id) ? '#f9fafb' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '18px', height: '18px', border: '1px solid #d1d5db', borderRadius: '4px', background: localData.selectedPapers.includes(paper.id) ? '#111827' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{localData.selectedPapers.includes(paper.id) && <Icons.Check />}</div>
                          <span style={{ fontSize: '13px' }}>{paper.title || paper.original_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Select Visuals</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      {uploadedImages.map(img => (
                        <div key={img.id} onClick={() => setLocalData({...localData, selectedImages: localData.selectedImages.includes(img.id) ? localData.selectedImages.filter(i => i !== img.id) : [...localData.selectedImages, img.id]})} style={{ position: 'relative', height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: localData.selectedImages.includes(img.id) ? '3px solid #111827' : '1px solid #e5e7eb' }}>
                          <img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {localData.selectedImages.includes(img.id) && <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#111827', color: 'white', borderRadius: '50%', padding: '2px' }}><Icons.Check /></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGenerate} disabled={generating || !localData.projectTitle} style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', fontWeight: '700', cursor: generating ? 'not-allowed' : 'pointer' }}>{generating ? 'System is Writing...' : 'Generate Chapter'}</button>
            </div>
          </>
        )}

        <AnimatePresence>
          {previewFile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 1100, display: 'flex', flexDirection: 'column', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Confirm Data Analysis (500 Words)</h3>
                <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.X /></button>
              </div>
              <div style={{ flex: 1, background: '#f9fafb', padding: '20px', borderRadius: '12px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                {previewLoading ? 'Reading file...' : <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>{extractedPreview}</pre>}
              </div>
              <button onClick={() => toggleContextFile(previewFile)} style={{ padding: '16px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                {localData.selectedContextFiles.find(f => f.id === previewFile.id) ? 'Deselect File' : 'Confirm & Use Data'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
