// src/components/premium/modals/ModifyModal.js
'use client';

import { useState, useEffect } from 'react';

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
  onGenerateSuccess,
  setIsGlobalLoading,
  setGlobalLoadingText
}) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState(['all']);

  useEffect(() => {
    if (isOpen && activeChapter?.content) {
      const parsed = parseChapterIntoSections(activeChapter.content);
      setSections(parsed);
      setSelectedSectionIds(['all']); // Default to all
    }
  }, [isOpen, activeChapter]);

  const parseChapterIntoSections = (content) => {
    if (!content) return [];
    
    // Normalize line endings and trim
    const normalized = content.replace(/\r\n/g, '\n');
    
    // Identify the top-level heading style used in this chapter
    // AI is instructed to use ## for Sections and ### for Sub-sections
    const hasH2 = /^## /m.test(normalized);
    const headingRegex = hasH2 ? /^## (.*)/gm : /^### (.*)/gm;
    
    const parsedSections = [];
    let match;
    let lastIndex = 0;
    
    while ((match = headingRegex.exec(normalized)) !== null) {
      // If there is text before the very first heading, capture it as Introduction
      if (parsedSections.length === 0 && match.index > 0) {
        const introContent = normalized.substring(0, match.index).trim();
        if (introContent) {
          parsedSections.push({
            id: "intro",
            title: "Introduction / Overview",
            content: introContent
          });
        }
      }
      
      // If we already have a section, update its content with everything up to this match
      if (parsedSections.length > 0 && parsedSections[parsedSections.length - 1].id !== "intro") {
        const prevSection = parsedSections[parsedSections.length - 1];
        prevSection.content = normalized.substring(lastIndex, match.index).trim();
      } else if (parsedSections.length > 0 && parsedSections[parsedSections.length - 1].id === "intro") {
        // If we just had an intro, we don't need to fill it, just move on
      }
      
      parsedSections.push({
        id: `sec-${parsedSections.length}`,
        title: match[1].trim(),
        content: "" // To be filled by next match or end of string
      });
      
      lastIndex = match.index;
    }
    
    // Fill the content for the very last section found
    if (parsedSections.length > 0) {
      const lastSection = parsedSections[parsedSections.length - 1];
      lastSection.content = normalized.substring(lastIndex).trim();
    } else {
      // No headings found at all, treat entire block as one
      parsedSections.push({
        id: "whole",
        title: "Entire Chapter Content",
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

  const handleModify = async () => {
    if (!instruction.trim()) {
      alert('Please enter modification instructions.');
      return;
    }

    setLoading(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText(`Surgically modifying selected sections...`);
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
          userPrompt: `MODIFICATION REQUEST: ${instruction}`,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Modification failed');

      if (onGenerateSuccess) onGenerateSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
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

          <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>2. Instructions for AI</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Expand on the technical details here. Make this section more formal. Correct the calculations."
            style={{ width: '100%', minHeight: '150px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
            autoFocus
          />
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
