'use client';

import { useState, useEffect } from 'react';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function GenerationModal({ 
  isOpen, 
  onClose, 
  uploadedImages = [], 
  researchPapers = [], 
  activeChapter, 
  projectId, 
  userId,
  projectData, 
  onGenerateSuccess,
  setIsGlobalLoading,
  setGlobalLoadingText
}) {
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDescription: '',
    componentsUsed: '',
    researchBooks: '',
    userPrompt: '',
    selectedImages: [],
    selectedPapers: [],
    selectedContextFiles: [], // NEW: for data analysis
    referenceStyle: 'APA',
    maxReferences: 10,
    skipReferences: false,
    targetWordCount: 2000 
  });

  // Safe chapter checks
  const currentChapterNumber = activeChapter?.number || activeChapter?.id || 0;
  const isSubsequentChapter = currentChapterNumber > 1;
  const [activeTab, setActiveTab] = useState('details');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isSubsequentChapter) {
        setActiveTab('materials');
      } else {
        setActiveTab('details');
      }
      
      if (projectData) {
        setFormData(prev => ({
          ...prev,
          projectTitle: projectData.title || '',
          projectDescription: projectData.description || '',
          componentsUsed: projectData.components_used || '',
          researchBooks: projectData.research_papers_context || '',
          userPrompt: '',
          selectedImages: [],
          selectedPapers: [],
          selectedContextFiles: [],
          targetWordCount: 2000 
        }));
      }
      setGenerating(false);
    }
  }, [isOpen, projectData, isSubsequentChapter]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleImageSelection = (imageId) => {
    setFormData(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.includes(imageId)
        ? prev.selectedImages.filter(id => id !== imageId)
        : [...prev.selectedImages, imageId]
    }));
  };

  const togglePaperSelection = (paperId) => {
    setFormData(prev => ({
      ...prev,
      selectedPapers: prev.selectedPapers.includes(paperId)
        ? prev.selectedPapers.filter(id => id !== paperId)
        : [...prev.selectedPapers, paperId]
    }));
  };

  const toggleContextFileSelection = (fileId) => {
    setFormData(prev => ({
      ...prev,
      selectedContextFiles: prev.selectedContextFiles.includes(fileId)
        ? prev.selectedContextFiles.filter(id => id !== fileId)
        : [...prev.selectedContextFiles, fileId]
    }));
  };

  const handleGenerate = async () => {
    if (!activeChapter) {
      alert('Please select a chapter first.');
      return;
    }

    if (!formData.projectTitle.trim()) {
      alert('Please enter a project title');
      return;
    }

    setGenerating(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText(`Generating Chapter ${currentChapterNumber}...`);
      setIsGlobalLoading(true);
    }

    try {
      const selectedImagesData = uploadedImages.filter(img => formData.selectedImages.includes(img.id));
      const selectedPapersData = researchPapers.filter(p => formData.selectedPapers.includes(p.id));
      const selectedContextFilesData = researchPapers.filter(f => formData.selectedContextFiles.includes(f.id));

      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          chapterNumber: currentChapterNumber,
          chapterTitle: activeChapter?.title,
          
          projectTitle: formData.projectTitle,
          projectDescription: formData.projectDescription,
          componentsUsed: formData.componentsUsed,
          researchBooks: formData.researchBooks,
          userPrompt: formData.userPrompt,
          referenceStyle: formData.referenceStyle,
          maxReferences: formData.maxReferences,
          targetWordCount: formData.targetWordCount,
          
          selectedImages: selectedImagesData,
          selectedPapers: selectedPapersData,
          selectedContextFiles: selectedContextFilesData, // Pass to API
          skipReferences: formData.skipReferences
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');

      if (onGenerateSuccess) onGenerateSuccess();
      onClose();

    } catch (error) {
      alert(error.message);
    } finally {
      setGenerating(false);
      if (setIsGlobalLoading) setIsGlobalLoading(false);
    }
  };

  const referenceStyles = ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard'];

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }} onClick={onClose} />
      
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxWidth: '800px', width: 'calc(100% - 32px)', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              {activeChapter ? `Generate ${activeChapter.title}` : 'Generate Chapter'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              {activeChapter ? 'Configure content settings and research materials' : 'Please select a chapter from the sidebar to begin.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icons.X /></button>
        </div>

        {activeChapter ? (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button onClick={() => setActiveTab('details')} style={{ padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activeTab === 'details' ? '#111827' : '#6b7280', borderBottom: activeTab === 'details' ? '2px solid #111827' : '2px solid transparent' }}>Details & Context</button>
              <button onClick={() => setActiveTab('materials')} style={{ padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activeTab === 'materials' ? '#111827' : '#6b7280', borderBottom: activeTab === 'materials' ? '2px solid #111827' : '2px solid transparent' }}>Materials & References ({formData.selectedImages.length + formData.selectedPapers.length})</button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {activeTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {!isSubsequentChapter ? (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Project Title</label>
                        <input type="text" value={formData.projectTitle} onChange={(e) => handleInputChange('projectTitle', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Project Description</label>
                        <textarea value={formData.projectDescription} onChange={(e) => handleInputChange('projectDescription', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '100px', resize: 'vertical' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Components Used (Optional)</label>
                          <textarea placeholder="e.g. Arduino, React, Tensile Tester" value={formData.componentsUsed} onChange={(e) => handleInputChange('componentsUsed', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '80px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Research Papers/Journals (Optional)</label>
                          <textarea placeholder="e.g. IEEE Journal, Nature, Specific Author Work" value={formData.researchBooks} onChange={(e) => handleInputChange('researchBooks', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '80px' }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', marginBottom: '8px' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                        Context Inherited from Project
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#3b82f6' }}>
                        Using details from your first generation. You can still add custom instructions below.
                      </p>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Custom Instructions (Optional)</label>
                    <textarea placeholder="e.g. Focus more on the methodology. Use technical terms. Make it very detailed." value={formData.userPrompt} onChange={(e) => handleInputChange('userPrompt', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '120px' }} />
                  </div>
                </div>
              )}

              {activeTab === 'materials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Skip references toggle */}
                    <div
                      onClick={() => handleInputChange('skipReferences', !formData.skipReferences)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', background: formData.skipReferences ? '#fef3c7' : 'white', border: `1px solid ${formData.skipReferences ? '#f59e0b' : '#d1d5db'}`, transition: 'all 0.15s' }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${formData.skipReferences ? '#f59e0b' : '#d1d5db'}`, background: formData.skipReferences ? '#f59e0b' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {formData.skipReferences && <Icons.Check />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: formData.skipReferences ? '#92400e' : '#374151' }}>No references for this chapter</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: formData.skipReferences ? '#b45309' : '#6b7280' }}>The AI will skip all citations and the References section, even if papers are selected above.</p>
                      </div>
                    </div>

                    {/* Word Count Slider */}
                    <div style={{ marginTop: '8px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Target Word Count</label>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#6366f1', background: '#eff6ff', padding: '2px 10px', borderRadius: '100px' }}>
                          ~{formData.targetWordCount.toLocaleString()} words
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="1500" 
                        max="4000" 
                        step="100" 
                        value={formData.targetWordCount} 
                        onChange={(e) => handleInputChange('targetWordCount', parseInt(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#6366f1' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', marginTop: '4px', fontWeight: '600' }}>
                        <span>Standard (1,500)</span>
                        <span>Comprehensive (4,000)</span>
                      </div>
                      <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#f59e0b' }}>⚠️</span> 
                        Note: Higher word counts will use more AI tokens.
                      </p>
                    </div>

                    {/* Reference style + max references (dimmed when skip is on) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', opacity: formData.skipReferences ? 0.4 : 1, pointerEvents: formData.skipReferences ? 'none' : 'auto', transition: 'opacity 0.15s' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Reference Style</label>
                        <select value={formData.referenceStyle} onChange={(e) => handleInputChange('referenceStyle', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                          {referenceStyles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Max References to Use</label>
                        <input type="number" value={formData.maxReferences} onChange={(e) => handleInputChange('maxReferences', parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>Select Project Images</h4>
                    {uploadedImages.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                        {uploadedImages.map(img => (
                          <div key={img.id} onClick={() => toggleImageSelection(img.id)} style={{ position: 'relative', height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: formData.selectedImages.includes(img.id) ? '3px solid #3b82f6' : '1px solid #e5e7eb' }}>
                            <img src={img.src} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', textAlign: 'center' }}>{img.caption || img.name}</div>
                            {formData.selectedImages.includes(img.id) && <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#3b82f6', color: 'white', borderRadius: '50%', padding: '2px' }}><Icons.Check /></div>}
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ fontSize: '13px', color: '#9ca3af' }}>No images uploaded yet.</p>}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>Analyze Data Files (Tests/Readings)</h4>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Select files containing your experimental data, readings, or analyses. The AI will extract and use this data for Chapter 4.</p>
                    {researchPapers.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                        {researchPapers.map(file => (
                          <div key={file.id} onClick={() => toggleContextFileSelection(file.id)} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${formData.selectedContextFiles.includes(file.id) ? '#111827' : '#e5e7eb'}`, background: formData.selectedContextFiles.includes(file.id) ? '#f9fafb' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '18px', height: '18px', border: '1px solid #d1d5db', borderRadius: '4px', background: formData.selectedContextFiles.includes(file.id) ? '#111827' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{formData.selectedContextFiles.includes(file.id) && <Icons.Check />}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '700' }}>{file.name || file.original_name}</span>
                              <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>{file.file_type || 'Unknown Type'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>No data files uploaded yet.</p>}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>Select Saved References</h4>
                    {researchPapers.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {researchPapers.map(paper => (
                          <div key={paper.id} onClick={() => togglePaperSelection(paper.id)} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${formData.selectedPapers.includes(paper.id) ? '#3b82f6' : '#e5e7eb'}`, background: formData.selectedPapers.includes(paper.id) ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '18px', height: '18px', border: '1px solid #d1d5db', borderRadius: '4px', background: formData.selectedPapers.includes(paper.id) ? '#3b82f6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{formData.selectedPapers.includes(paper.id) && <Icons.Check />}</div>
                            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{paper.title || paper.original_name}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ fontSize: '13px', color: '#9ca3af' }}>No saved references. AI will search the web for sources.</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGenerate} disabled={generating} style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', fontWeight: '700', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>{generating ? 'AI is Writing...' : 'Generate Chapter'}</button>
            </div>
          </>
        ) : (
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📂</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#111827' }}>No Chapter Selected</h3>
            <p style={{ color: '#6b7280', maxWidth: '300px', margin: '0 auto 24px' }}>Please select a specific chapter from the sidebar before clicking generate.</p>
            <button 
              onClick={onClose}
              style={{ padding: '10px 24px', background: '#111827', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
