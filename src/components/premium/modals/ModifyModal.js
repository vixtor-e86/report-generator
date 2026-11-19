// src/components/premium/modals/ModifyModal.js
'use client';

import { useState, useEffect, useRef } from 'react';

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function ModifyModal({ 
  isOpen, 
  onClose, 
  activeChapter, 
  projectId, 
  userId, 
  dataFiles = [],
  onGenerateSuccess,
  setIsGlobalLoading,
  setGlobalLoadingText,
  showNotification
}) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState(['all']);
  const [selectedContextFiles, setSelectedContextFiles] = useState([]);
  const [capWarning, setCapWarning] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const instructionInputRef = useRef(null);

  // Pure Size-Based Cap Limits: 10MB Images + 10MB Docs/PDFs = 20MB Total
  const MAX_IMAGE_BUCKET_BYTES = 10 * 1024 * 1024;
  const MAX_DOC_BUCKET_BYTES = 10 * 1024 * 1024;
  const MAX_TOTAL_ANALYSIS_BYTES = 20 * 1024 * 1024;

  const isAnalysisImageFile = (file) => {
    const name = (file?.name || file?.original_name || '').toLowerCase();
    return file?.file_type?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name);
  };

  const eligibleAnalysisFiles = dataFiles.filter(f => {
    const name = (f.name || f.original_name || '').toLowerCase();
    return /\.(pdf|docx|txt|xlsx|csv|png|jpe?g|webp)$/i.test(name) || f.file_type?.startsWith('image/');
  });

  useEffect(() => {
    if (isOpen && activeChapter?.content) {
      const parsed = parseChapterIntoSections(activeChapter.content);
      setSections(parsed);
      setSelectedSectionIds(['all']); // Default to all
      setSelectedContextFiles([]);
      setCapWarning('');
      setMentionQuery(null);
    }
  }, [isOpen, activeChapter]);

  const parseChapterIntoSections = (content) => {
    if (!content) return [];
    
    // Normalize line endings and trim
    const normalized = content.replace(/\r\n/g, '\n');
    
    // Match both ## and ### headings (as well as #### if numbered like #### 3.1.1) so chapters where
    // the Chapter Title is ## and sections are ### 3.1, ### 3.2 are always broken down into all their sections!
    let headingRegex = /^#{1,4}\s+(.+)$/gm;
    let matches = [...normalized.matchAll(headingRegex)];

    // Fallback: if the chapter used bold numbered headings like **3.1 System Design** without # hashes
    if (matches.length <= 1) {
      headingRegex = /^(?:#{1,4}\s+|\*\*)(\d+\.\d+[^*\n]+|\b(?:Introduction|References|Bibliography)[^*\n]*)(?:\*\*)?$/gim;
      matches = [...normalized.matchAll(headingRegex)];
    }

    const parsedSections = [];

    if (matches.length > 0) {
      // Check if there is intro text before the first heading
      if (matches[0].index > 0) {
        const introContent = normalized.substring(0, matches[0].index).trim();
        if (introContent) {
          parsedSections.push({
            id: 'intro',
            title: 'Introduction / Overview',
            content: introContent
          });
        }
      }

      for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextMatch = matches[i + 1];
        const startIdx = currentMatch.index;
        const endIdx = nextMatch ? nextMatch.index : normalized.length;
        const sectionChunk = normalized.substring(startIdx, endIdx).trim();
        const rawTitle = (currentMatch[1] || '').replace(/\*\*/g, '').trim();

        // If this heading is just the top-level "## CHAPTER X: TITLE" line with no body text before the first ### 3.1 subsection, skip it as a separate empty section
        const bodyWithoutHeader = sectionChunk.replace(/^[^\n]+/, '').trim();
        const isBareChapterHeader = /^chapter\s+\d+/i.test(rawTitle) && bodyWithoutHeader.length === 0 && matches.length > 1;
        if (isBareChapterHeader) {
          continue;
        }

        if (sectionChunk.length > 0) {
          parsedSections.push({
            id: `sec-${parsedSections.length}`,
            title: rawTitle || `Section ${parsedSections.length + 1}`,
            content: sectionChunk
          });
        }
      }
    }

    if (parsedSections.length === 0) {
      parsedSections.push({
        id: 'whole',
        title: 'Entire Chapter Content',
        content: normalized
      });
    }

    return parsedSections.filter(s => s.content.length > 0);
  };

  const toggleSection = (id) => {
    if (id === 'all') {
      setSelectedSectionIds(['all']);
      return;
    }

    setSelectedSectionIds(prev => {
      const filtered = prev.filter(i => i !== 'all');
      if (filtered.includes(id)) {
        const next = filtered.filter(i => i !== id);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...filtered, id];
      }
    });
  };

  const handleInsertFileTag = (file, replaceActiveMention = false) => {
    setCapWarning('');
    const fileName = file.name || file.original_name || 'File';
    const tagToken = `@[${fileName}]`;
    const alreadySelected = selectedContextFiles.some(f => f.id === file.id);

    if (!alreadySelected) {
      const isImg = isAnalysisImageFile(file);
      const fileSize = file.size_bytes || 0;
      const currentImageBytes = selectedContextFiles
        .filter(isAnalysisImageFile)
        .reduce((acc, f) => acc + (f.size_bytes || 0), 0);
      const currentDocBytes = selectedContextFiles
        .filter(f => !isAnalysisImageFile(f))
        .reduce((acc, f) => acc + (f.size_bytes || 0), 0);
      const currentTotalBytes = currentImageBytes + currentDocBytes;

      if (isImg && (currentImageBytes + fileSize) > MAX_IMAGE_BUCKET_BYTES) {
        setCapWarning(`Adding "${fileName}" exceeds the 10.0 MB total image analysis limit.`);
        return;
      }
      if (!isImg && (currentDocBytes + fileSize) > MAX_DOC_BUCKET_BYTES) {
        setCapWarning(`Adding "${fileName}" exceeds the 10.0 MB total document/PDF analysis limit.`);
        return;
      }
      if ((currentTotalBytes + fileSize) > MAX_TOTAL_ANALYSIS_BYTES) {
        setCapWarning('Total attached files exceed the 20.0 MB combined analysis limit.');
        return;
      }
      setSelectedContextFiles(prev => [...prev, file]);
    }

    let nextInstruction = instruction || '';
    const el = instructionInputRef.current;

    if (replaceActiveMention && el) {
      const cursorPos = el.selectionStart || nextInstruction.length;
      const beforeCursor = nextInstruction.slice(0, cursorPos);
      const afterCursor = nextInstruction.slice(cursorPos);
      const replacedBefore = beforeCursor.replace(/@([^\s@\]]*)$/, `${tagToken} `);
      nextInstruction = replacedBefore + afterCursor;
    } else if (el) {
      const start = el.selectionStart ?? nextInstruction.length;
      const end = el.selectionEnd ?? nextInstruction.length;
      const prefix = start > 0 && !/\s$/.test(nextInstruction.slice(0, start)) ? ' ' : '';
      nextInstruction = nextInstruction.slice(0, start) + `${prefix}${tagToken} ` + nextInstruction.slice(end);
    } else {
      nextInstruction = `${nextInstruction}${nextInstruction && !/\s$/.test(nextInstruction) ? ' ' : ''}${tagToken} `;
    }

    setInstruction(nextInstruction);
    setMentionQuery(null);

    setTimeout(() => {
      if (instructionInputRef.current) {
        instructionInputRef.current.focus();
      }
    }, 20);
  };

  const handleInstructionChange = (e) => {
    const val = e.target.value;
    setInstruction(val);

    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s@\]]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const handleModify = async () => {
    if (!instruction.trim()) {
      if (showNotification) showNotification('Missing Input', 'Please enter modification instructions.', 'warning');
      else alert('Please enter modification instructions.');
      return;
    }

    setLoading(true);
    if (setIsGlobalLoading) {
      const hasAnalysisFiles = selectedContextFiles && selectedContextFiles.length > 0;
      setGlobalLoadingText(
        hasAnalysisFiles
          ? `Analyzing ${selectedContextFiles.length} attached file(s)/image(s) & modifying chapter... This will take a little extra time.`
          : `Surgically modifying selected sections...`
      );
      setIsGlobalLoading(true);
    }

    try {
      let contentToModify = "";
      let modificationType = "whole_chapter";

      if (selectedSectionIds.includes('all')) {
        contentToModify = activeChapter.content;
      } else {
        modificationType = "partial";
        contentToModify = sections
          .filter(s => selectedSectionIds.includes(s.id))
          .map(s => s.content)
          .join("\n\n");
      }

      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          chapterNumber: activeChapter.number || activeChapter.id,
          chapterTitle: activeChapter.title,
          isModification: true,
          modificationType,
          selectedSections: sections.filter(s => selectedSectionIds.includes(s.id)).map(s => s.title),
          fullContent: activeChapter.content,
          targetContent: contentToModify,
          selectedContextFiles,
          userPrompt: `MODIFICATION REQUEST: ${instruction}`,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Modification failed');

      if (onGenerateSuccess) onGenerateSuccess();
      onClose();
    } catch (err) {
      if (showNotification) showNotification('Error', err.message, 'error');
      else alert(err.message);
    } finally {
      setLoading(false);
      if (setIsGlobalLoading) setIsGlobalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', zIndex: 1000, maxWidth: '600px', width: 'calc(100% - 32px)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>Surgical Modification</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Select specific sections to fix or modify</p>
          </div>
          <button onClick={onClose} style={{ background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '12px' }}><Icons.X /></button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>1. Select Sections to Touch</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('all')}
              style={{ padding: '12px 16px', borderRadius: '12px', border: `2px solid ${selectedSectionIds.includes('all') ? '#111827' : '#f1f5f9'}`, background: selectedSectionIds.includes('all') ? '#f8fafc' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
            >
              <span style={{ fontSize: '14px', fontWeight: '700', color: selectedSectionIds.includes('all') ? '#111827' : '#64748b' }}>Apply to Whole Chapter</span>
              {selectedSectionIds.includes('all') && <div style={{ color: '#111827' }}><Icons.Check /></div>}
            </div>
            
            {sections.map(section => (
              <div 
                key={section.id}
                onClick={() => toggleSection(section.id)}
                style={{ padding: '12px 16px', borderRadius: '12px', border: `2px solid ${selectedSectionIds.includes(section.id) ? '#6366f1' : '#f1f5f9'}`, background: selectedSectionIds.includes(section.id) ? '#f5f3ff' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
              >
                <span style={{ fontSize: '14px', fontWeight: '600', color: selectedSectionIds.includes(section.id) ? '#4338ca' : '#64748b' }}>{section.title}</span>
                {selectedSectionIds.includes(section.id) && <div style={{ color: '#6366f1' }}><Icons.Check /></div>}
              </div>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                2. Instructions for AI
              </label>
              {eligibleAnalysisFiles.length > 0 && (
                <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700' }}>
                  Type <strong>@</strong> or click a file below to tag &amp; analyze
                </span>
              )}
            </div>

            {eligibleAnalysisFiles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px', padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Tag File/Image:</span>
                {eligibleAnalysisFiles.map(f => {
                  const isImg = isAnalysisImageFile(f);
                  const isSelected = selectedContextFiles.some(sf => sf.id === f.id);
                  const fName = f.name || f.original_name;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleInsertFileTag(f, false)}
                      title={`Click to tag @[${fName}] in instructions`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: isSelected ? '1px solid #6366f1' : '1px solid #cbd5e1',
                        background: isSelected ? '#eef2ff' : 'white',
                        color: isSelected ? '#4338ca' : '#334155'
                      }}
                    >
                      <span>{isImg ? '🖼️' : '📄'}</span>
                      <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{fName}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {capWarning && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '8px', fontSize: '11px', color: '#b91c1c', fontWeight: '600' }}>
                ⚠️ {capWarning}
              </div>
            )}

            <textarea
              ref={instructionInputRef}
              value={instruction}
              onChange={handleInstructionChange}
              placeholder="e.g. Expand on the technical details here using @[circuit_diagram.png], or update the table values from @[results.xlsx]."
              style={{ width: '100%', minHeight: '150px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
              autoFocus
            />

            {mentionQuery !== null && eligibleAnalysisFiles.length > 0 && (() => {
              const matches = eligibleAnalysisFiles.filter(f =>
                (f.name || f.original_name || '').toLowerCase().includes(mentionQuery)
              );
              if (matches.length === 0) return null;
              return (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: '100%',
                  marginBottom: '6px',
                  background: '#111827',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                  zIndex: 50,
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid #374151'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Select Image or Document to Tag (@)
                  </div>
                  {matches.map(f => {
                    const isImg = isAnalysisImageFile(f);
                    const fName = f.name || f.original_name;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleInsertFileTag(f, true)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <span>{isImg ? '🖼️' : '📄'}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@[{fName}]</span>
                        <span style={{ fontSize: '10px', color: '#a5b4fc' }}>{isImg ? 'AI Image' : 'AI Doc'}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: 'white' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Cancel</button>
          <button 
            onClick={handleModify} 
            disabled={loading}
            style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: '#111827', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            {loading ? 'Surgical Processing...' : <><Icons.Zap style={{ color: '#fbbf24' }} /> Apply to {selectedSectionIds.includes('all') ? 'All' : selectedSectionIds.length} Selection</>}
          </button>
        </div>
      </div>
    </>
  );
}
