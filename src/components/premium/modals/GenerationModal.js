// src/components/premium/modals/GenerationModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
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
      setExtractedPreview(data.debugExtractions || 'No text extracted.');
    } catch (e) {
      setExtractedPreview('Error loading data.');
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
    if (!activeChapter) return;
    setGenerating(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText(`Generating Chapter ${currentChapterNumber}...`);
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
      if (!response.ok) throw new Error('Generation failed');
      if (onGenerateSuccess) onGenerateSuccess();
      onClose();
    } catch (error) { alert(error.message); }
    finally { setGenerating(false); if (setIsGlobalLoading) setIsGlobalLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col z-[1000] max-h-[95vh]">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              {activeChapter ? `Generate ${activeChapter.title}` : 'Generate Chapter'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Configure content settings and research materials</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icons.X /></button>
        </div>

        {!activeChapter ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📂</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '800', color: '#111827' }}>No Chapter Selected</h3>
            <p style={{ color: '#6b7280', maxWidth: '360px', margin: '0 auto 32px', fontSize: '15px', lineHeight: '1.6' }}>
              Please select a specific chapter from the left sidebar before you can generate content.
            </p>
            <button 
              onClick={onClose}
              style={{ padding: '12px 32px', background: '#111827', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
            >
              Got it, close
            </button>
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
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Project Title</label>
                    <input type="text" value={formData.projectTitle} onChange={(e) => setFormData({...formData, projectTitle: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Instructions</label>
                    <textarea value={formData.userPrompt} onChange={(e) => setFormData({...formData, userPrompt: e.target.value})} placeholder="e.g. Focus on calculations..." style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '120px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Reference Style</label>
                      <select value={formData.referenceStyle} onChange={(e) => setFormData({...formData, referenceStyle: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                        <option value="APA">APA</option><option value="IEEE">IEEE</option><option value="MLA">MLA</option><option value="Harvard">Harvard</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Target Word Count</label>
                      <input type="number" step="500" value={formData.targetWordCount} onChange={(e) => setFormData({...formData, targetWordCount: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'materials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {isChapter4 && (
                    <div style={{ padding: '16px', background: '#111827', borderRadius: '12px', color: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Icons.Activity />
                        <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>Data Analysis (DOCX/TXT Only)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {researchPapers.filter(f => !f.file_type?.startsWith('image/')).map(f => (
                          <div key={f.id} onClick={() => handlePreviewFile(f)} style={{ padding: '10px', borderRadius: '8px', background: formData.selectedContextFiles.find(sf => sf.id === f.id) ? '#374151' : '#1f2937', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px' }}>{f.name || f.original_name}</span>
                            {formData.selectedContextFiles.find(sf => sf.id === f.id) && <Icons.Check />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Select References</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {researchPapers.filter(f => !f.file_type?.startsWith('image/')).map(paper => (
                        <div key={paper.id} onClick={() => setFormData({...formData, selectedPapers: formData.selectedPapers.includes(paper.id) ? formData.selectedPapers.filter(id => id !== paper.id) : [...formData.selectedPapers, paper.id]})} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${formData.selectedPapers.includes(paper.id) ? '#111827' : '#e5e7eb'}`, background: formData.selectedPapers.includes(paper.id) ? '#f9fafb' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '18px', height: '18px', border: '1px solid #d1d5db', borderRadius: '4px', background: formData.selectedPapers.includes(paper.id) ? '#111827' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{formData.selectedPapers.includes(paper.id) && <Icons.Check />}</div>
                          <span style={{ fontSize: '13px' }}>{paper.title || paper.original_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Select Visuals</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      {uploadedImages.map(img => (
                        <div key={img.id} onClick={() => setFormData({...formData, selectedImages: formData.selectedImages.includes(img.id) ? formData.selectedImages.filter(i => i !== img.id) : [...formData.selectedImages, img.id]})} style={{ position: 'relative', height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: formData.selectedImages.includes(img.id) ? '3px solid #111827' : '1px solid #e5e7eb' }}>
                          <img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {formData.selectedImages.includes(img.id) && <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#111827', color: 'white', borderRadius: '50%', padding: '2px' }}><Icons.Check /></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGenerate} disabled={generating || !formData.projectTitle} style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', fontWeight: '700', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
                {generating ? 'AI is Writing...' : 'Generate Chapter'}
              </button>
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
                {formData.selectedContextFiles.find(f => f.id === previewFile.id) ? 'Deselect File' : 'Confirm & Use Data'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
