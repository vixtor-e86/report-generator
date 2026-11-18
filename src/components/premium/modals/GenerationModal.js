// src/components/premium/modals/GenerationModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
};

export default function GenerationModal({ 
  isOpen, onClose, uploadedImages = [], researchPapers = [], dataFiles = [],
  activeChapter, projectId, userId, projectData, onGenerateSuccess,
  setIsGlobalLoading, setGlobalLoadingText,
  formData: stickyData, setFormData: setStickyData,
  showNotification, onGenerateClick, hasStartedGeneration
}) {
  const [localData, setLocalData] = useState({
    projectTitle: '', projectDescription: '', faculty: '', department: '',
    componentsUsed: '', researchBooks: '',
    userPrompt: '', selectedImages: [], selectedPapers: [], selectedContextFiles: [], skipReferences: false, targetWordCount: 2000,
    tableData: { headers: ['Parameter', 'Value'], rows: [['', '']] }
  });

  const [activeTab, setActiveTab] = useState('details');
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [capWarning, setCapWarning] = useState('');

  // Per-chapter AI Analysis Cap Limits
  const MAX_ANALYSIS_IMAGES = 3;
  const MAX_ANALYSIS_DOCS = 2;
  const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB
  const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5.0 MB
  const MAX_TOTAL_ANALYSIS_BYTES = 10 * 1024 * 1024; // 10.0 MB

  const isAnalysisImageFile = (file) => {
    const name = (file?.name || file?.original_name || '').toLowerCase();
    return file?.file_type?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name);
  };

  const currentChapterNumber = activeChapter?.number || activeChapter?.id || 0;
  const isSubsequentChapter = currentChapterNumber > 1;
  const isCustomTemplate = projectData?.custom_templates?.name === 'Custom Template';

  useEffect(() => {
    if (isOpen && projectData) {
      setLocalData({
        projectTitle: projectData.title || '',
        projectDescription: projectData.description || '',
        faculty: projectData.faculty || '',
        department: projectData.department || '',
        componentsUsed: projectData.components_used || '',
        researchBooks: projectData.research_papers_context || '',
        userPrompt: '', selectedImages: [], selectedPapers: [], selectedContextFiles: [], skipReferences: false, targetWordCount: 2000,
        tableData: { headers: ['Parameter', 'Value'], rows: [['', '']] }
      });
      setCapWarning('');
      setActiveTab(isSubsequentChapter ? 'materials' : 'details');
    }
  }, [isOpen, projectData, currentChapterNumber, isSubsequentChapter]);

  // --- Table Logic ---
  const updateHeader = (idx, val) => {
    const newHeaders = [...localData.tableData.headers];
    newHeaders[idx] = val;
    setLocalData({...localData, tableData: { ...localData.tableData, headers: newHeaders }});
  };

  const updateCell = (rowIdx, colIdx, val) => {
    const newRows = [...localData.tableData.rows];
    newRows[rowIdx][colIdx] = val;
    setLocalData({...localData, tableData: { ...localData.tableData, rows: newRows }});
  };

  const addRow = () => {
    const newRows = [...localData.tableData.rows, Array(localData.tableData.headers.length).fill('')];
    setLocalData({...localData, tableData: { ...localData.tableData, rows: newRows }});
  };

  const addColumn = () => {
    const newHeaders = [...localData.tableData.headers, `Column ${localData.tableData.headers.length + 1}`];
    const newRows = localData.tableData.rows.map(row => [...row, '']);
    setLocalData({...localData, tableData: { headers: newHeaders, rows: newRows }});
  };

  const removeRow = (idx) => {
    if (localData.tableData.rows.length <= 1) return;
    const newRows = localData.tableData.rows.filter((_, i) => i !== idx);
    setLocalData({...localData, tableData: { ...localData.tableData, rows: newRows }});
  };

  const removeColumn = (idx) => {
    if (localData.tableData.headers.length <= 1) return;
    const newHeaders = localData.tableData.headers.filter((_, i) => i !== idx);
    const newRows = localData.tableData.rows.map(row => row.filter((_, i) => i !== idx));
    setLocalData({...localData, tableData: { headers: newHeaders, rows: newRows }});
  };

  const toggleContextFile = (file) => {
    setCapWarning('');
    const alreadySelected = localData.selectedContextFiles.some(f => f.id === file.id);

    if (alreadySelected) {
      setLocalData(prev => ({
        ...prev,
        selectedContextFiles: prev.selectedContextFiles.filter(f => f.id !== file.id)
      }));
      return;
    }

    const isImg = isAnalysisImageFile(file);
    const fileSize = file.size_bytes || 0;

    // 1. Validate individual file size limit
    if (isImg && fileSize > MAX_IMAGE_BYTES) {
      setCapWarning(`"${file.name || file.original_name}" exceeds the 3.5 MB limit per analysis image.`);
      return;
    }
    if (!isImg && fileSize > MAX_DOC_BYTES) {
      setCapWarning(`"${file.name || file.original_name}" exceeds the 5.0 MB limit per analysis document.`);
      return;
    }

    // 2. Validate count limits
    const currentImagesCount = localData.selectedContextFiles.filter(isAnalysisImageFile).length;
    const currentDocsCount = localData.selectedContextFiles.filter(f => !isAnalysisImageFile(f)).length;

    if (isImg && currentImagesCount >= MAX_ANALYSIS_IMAGES) {
      setCapWarning(`Maximum of ${MAX_ANALYSIS_IMAGES} images can be selected for AI analysis per chapter.`);
      return;
    }
    if (!isImg && currentDocsCount >= MAX_ANALYSIS_DOCS) {
      setCapWarning(`Maximum of ${MAX_ANALYSIS_DOCS} documents can be selected for AI analysis per chapter.`);
      return;
    }

    // 3. Validate combined 10 MB payload limit
    const currentTotalBytes = localData.selectedContextFiles.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
    if (currentTotalBytes + fileSize > MAX_TOTAL_ANALYSIS_BYTES) {
      setCapWarning('Total selected files exceed the 10.0 MB per-chapter analysis limit.');
      return;
    }

    setLocalData(prev => ({
      ...prev,
      selectedContextFiles: [...prev.selectedContextFiles, file]
    }));
  };

  const handleGenerateInit = async () => {
    if (!activeChapter) return;
    
    // ✅ Persist Title/Description/Faculty/Dept changes if generation hasn't started
    if (!hasStartedGeneration) {
        try {
            const { error } = await supabase
                .from('premium_projects')
                .update({
                    title: localData.projectTitle,
                    description: localData.projectDescription,
                    faculty: localData.faculty,
                    department: localData.department
                })
                .eq('id', projectId);
            
            if (error) throw error;
        } catch (err) {
            console.error("Failed to update project details:", err);
            showNotification('Error', 'Failed to update project details. Please try again.', 'error');
            return;
        }
    }

    // Pass everything to the confirm structure modal
    onGenerateClick({
        ...localData,
        selectedImages: uploadedImages.filter(img => localData.selectedImages.includes(img.id)),
        selectedPapers: researchPapers.filter(p => localData.selectedPapers.includes(p.id))
    });
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
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Project Title</label>
                    {!hasStartedGeneration ? (
                        <input 
                            type="text" 
                            value={localData.projectTitle} 
                            onChange={(e) => setLocalData({...localData, projectTitle: e.target.value})}
                            placeholder="Enter project title"
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                        />
                    ) : (
                        <div style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', color: '#6b7280', fontWeight: '600', cursor: 'default' }}>
                            {localData.projectTitle}
                        </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Project Description (Full Scope)</label>
                    {!hasStartedGeneration ? (
                        <textarea 
                            value={localData.projectDescription} 
                            onChange={(e) => setLocalData({...localData, projectDescription: e.target.value})}
                            placeholder="Provide a detailed overview of your project"
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '100px', background: 'white' }}
                        />
                    ) : (
                        <div style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '100px', maxHeight: '200px', background: '#f9fafb', color: '#6b7280', cursor: 'default', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                            {localData.projectDescription}
                        </div>
                    )}
                  </div>

                  {!hasStartedGeneration && isCustomTemplate && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Faculty</label>
                            <input 
                                type="text" 
                                value={localData.faculty} 
                                onChange={(e) => setLocalData({...localData, faculty: e.target.value})}
                                placeholder="e.g. Engineering"
                                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>Department</label>
                            <input 
                                type="text" 
                                value={localData.department} 
                                onChange={(e) => setLocalData({...localData, department: e.target.value})}
                                placeholder="e.g. Civil Engineering"
                                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white' }}
                            />
                        </div>
                    </div>
                  )}

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

                  {/* ✅ Technical Data Table Builder */}
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111827' }}>Technical Data Table</h4>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Add structured data for the AI to analyze (Experimental results, params, etc.)</p>
                      </div>
                      <button 
                        onClick={() => setShowTableBuilder(!showTableBuilder)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {showTableBuilder ? 'Hide Table Builder' : 'Build Data Table'}
                      </button>
                    </div>

                    {showTableBuilder && (
                      <div style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr>
                              {localData.tableData.headers.map((h, i) => (
                                <th key={i} style={{ padding: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', textAlign: 'left' }}>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input 
                                      value={h} 
                                      onChange={(e) => updateHeader(i, e.target.value)}
                                      style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: '700', outline: 'none' }}
                                    />
                                    <button onClick={() => removeColumn(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                                  </div>
                                </th>
                              ))}
                              <th style={{ width: '40px', padding: '8px' }}>
                                <button onClick={addColumn} style={{ width: '100%', borderRadius: '4px', border: '1px dashed #d1d5db', background: 'white', cursor: 'pointer' }}>+</button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {localData.tableData.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                                    <input 
                                      value={cell} 
                                      onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                      style={{ width: '100%', border: 'none', outline: 'none' }}
                                    />
                                  </td>
                                ))}
                                <td style={{ textAlign: 'center' }}>
                                  <button onClick={() => removeRow(rIdx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button 
                          onClick={addRow}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px dashed #d1d5db', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          + Add Row
                        </button>
                      </div>
                    )}
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
                        <span style={{ fontSize: '14px', fontWeight: '800', color: localData.targetWordCount > 2000 ? '#ef4444' : '#6366f1' }}>~{localData.targetWordCount.toLocaleString()} words</span>
                      </div>
                      <input type="range" min="1500" max="4000" step="100" value={localData.targetWordCount} onChange={(e) => setLocalData({...localData, targetWordCount: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer', accentColor: localData.targetWordCount > 2000 ? '#ef4444' : '#111827' }} />
                      
                      {localData.targetWordCount > 2000 && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <Icons.Info style={{ color: '#ef4444', shrink: 0, marginTop: '2px' }} />
                          <p style={{ fontSize: '10px', color: '#991b1b', margin: 0, lineHeight: '1.4' }}>
                            <strong>Caution:</strong> High word counts significantly increase Humanizer usage. You may exceed your 10,000 word project limit quickly.
                          </p>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', opacity: localData.skipReferences ? 0.4 : 1, pointerEvents: localData.skipReferences ? 'none' : 'auto' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700' }}>Reference Style</label>
                        <select value={stickyData.referenceStyle} onChange={(e) => setStickyData({...stickyData, referenceStyle: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                          <option value="APA">APA Style (Social Sciences, Education 📘)</option>
                          <option value="Harvard">Harvard Style (Sciences, Business, Management 🎓)</option>
                          <option value="Chicago">Chicago Style (History, Humanities - Footnotes 🏛️)</option>
                          <option value="OSCOLA">OSCOLA Style (Law & Legal Studies - Footnotes ⚖️)</option>
                          <option value="Vancouver">Vancouver Style (Medicine, Health & Life Sciences 🩺)</option>
                          <option value="IEEE">IEEE Style (Engineering, Computer Science, IT ⚡)</option>
                          <option value="MLA">MLA Style (Humanities, Literature 📚)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ block: 'block', fontSize: '13px', fontWeight: '700' }}>Max References</label>
                        <input type="number" value={stickyData.maxReferences} onChange={(e) => setStickyData({...stickyData, maxReferences: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                      </div>
                    </div>
                  </div>

                  {/* ✅ AI Analysis Context Picker (Images & Documents from Right Sidebar) - Available for ALL chapters */}
                  {(() => {
                    const eligibleAnalysisFiles = dataFiles.filter(f => {
                      const name = (f.name || f.original_name || '').toLowerCase();
                      return /\.(pdf|docx|txt|xlsx|csv|png|jpe?g|webp)$/i.test(name) || f.file_type?.startsWith('image/');
                    });
                    const selectedImgCount = localData.selectedContextFiles.filter(isAnalysisImageFile).length;
                    const selectedDocCount = localData.selectedContextFiles.filter(f => !isAnalysisImageFile(f)).length;
                    const selectedTotalBytes = localData.selectedContextFiles.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
                    const totalMB = (selectedTotalBytes / (1024 * 1024)).toFixed(2);
                    const pctUsed = Math.min(Math.round((selectedTotalBytes / MAX_TOTAL_ANALYSIS_BYTES) * 100), 100);

                    return (
                      <div style={{ padding: '18px', background: '#111827', borderRadius: '14px', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Icons.Activity />
                              <span style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                AI Analysis Files &amp; Images (Context Only)
                              </span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                              Select images or documents from the Right Sidebar for the AI to inspect and analyze for this chapter. These will NOT be inserted as figure placeholders.
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', background: selectedImgCount >= MAX_ANALYSIS_IMAGES ? '#7f1d1d' : '#1f2937', color: '#e5e7eb', border: '1px solid #374151' }}>
                              Images: {selectedImgCount}/{MAX_ANALYSIS_IMAGES}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', background: selectedDocCount >= MAX_ANALYSIS_DOCS ? '#7f1d1d' : '#1f2937', color: '#e5e7eb', border: '1px solid #374151' }}>
                              Docs: {selectedDocCount}/{MAX_ANALYSIS_DOCS}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', background: '#1f2937', color: '#a5b4fc', border: '1px solid #374151' }}>
                              {totalMB} / 10.0 MB
                            </span>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div style={{ width: '100%', height: '6px', background: '#1f2937', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
                          <div style={{ width: `${pctUsed}%`, height: '100%', background: pctUsed > 85 ? '#ef4444' : '#6366f1', transition: 'width 0.2s ease' }} />
                        </div>

                        {capWarning && (
                          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '12px', fontSize: '11px', color: '#fca5a5', fontWeight: '600' }}>
                            ⚠️ {capWarning}
                          </div>
                        )}

                        {eligibleAnalysisFiles.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                            {eligibleAnalysisFiles.map(f => {
                              const isSelected = localData.selectedContextFiles.some(sf => sf.id === f.id);
                              const isImg = isAnalysisImageFile(f);
                              const sizeBytes = f.size_bytes || 0;
                              const isOversized = isImg ? sizeBytes > MAX_IMAGE_BYTES : sizeBytes > MAX_DOC_BYTES;
                              const sizeStr = sizeBytes >= 1024 * 1024
                                ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                                : `${(sizeBytes / 1024).toFixed(1)} KB`;
                              const ext = (f.name || f.original_name || '').split('.').pop().toUpperCase();

                              return (
                                <div
                                  key={f.id}
                                  onClick={() => toggleContextFile(f)}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    background: isSelected ? '#312e81' : '#1f2937',
                                    border: isSelected ? '1px solid #6366f1' : '1px solid #374151',
                                    cursor: isOversized ? 'not-allowed' : 'pointer',
                                    opacity: isOversized ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                    {isImg ? (
                                      <img
                                        src={f.file_url || f.src}
                                        alt={f.name || f.original_name}
                                        style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #4b5563', flexShrink: 0 }}
                                      />
                                    ) : (
                                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 6px', borderRadius: '6px', background: '#374151', color: '#e5e7eb', flexShrink: 0 }}>
                                        {ext || 'DOC'}
                                      </span>
                                    )}
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {f.name || f.original_name}
                                      </div>
                                      <div style={{ fontSize: '10px', color: isOversized ? '#fca5a5' : '#9ca3af' }}>
                                        {sizeStr} • {isImg ? 'Visual Analysis Image' : 'Analysis Document'}
                                        {isOversized ? ` (Exceeds ${isImg ? '3.5MB' : '5MB'} cap)` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: `1.5px solid ${isSelected ? '#818cf8' : '#4b5563'}`, background: isSelected ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isSelected && <Icons.Check />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                            No analysis files or images uploaded yet. Open the <strong>Right Sidebar → Files</strong> tab to upload images (PNG, JPG ≤ 3.5MB) or documents (PDF, DOCX, XLSX, CSV, TXT ≤ 5MB) for AI analysis.
                          </div>
                        )}
                      </div>
                    );
                  })()}

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
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Select Report Figures to Insert (Placeholders)</h4>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                        Uploaded via Left Sidebar → Assets. The AI will insert these images with their captions directly into the chapter text.
                      </p>
                    </div>
                    {uploadedImages.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                        {uploadedImages.map(img => (
                          <div key={img.id} onClick={() => setLocalData({...localData, selectedImages: localData.selectedImages.includes(img.id) ? localData.selectedImages.filter(i => i !== img.id) : [...localData.selectedImages, img.id]})} style={{ position: 'relative', height: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: localData.selectedImages.includes(img.id) ? '3px solid #111827' : '1px solid #e5e7eb' }}>
                            <img src={img.src} alt={img.caption || img.original_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {localData.selectedImages.includes(img.id) && <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#111827', color: 'white', borderRadius: '50%', padding: '2px' }}><Icons.Check /></div>}
                            {img.caption && (
                              <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(17,24,39,0.75)', color: 'white', fontSize: '10px', padding: '3px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {img.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>No captioned report figures uploaded in Left Sidebar → Assets yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGenerateInit} disabled={generating || !localData.projectTitle} style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', fontWeight: '700', cursor: generating ? 'not-allowed' : 'pointer' }}>{generating ? 'System is Writing...' : 'Generate Chapter'}</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
