// src/components/premium/modals/PresentationModal.js
'use client';

import { useState } from 'react';
import pptxgen from "pptxgenjs";

const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Monitor: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function PresentationModal({ isOpen, onClose, chapters, projectId, userId, setIsGlobalLoading, setGlobalLoadingText }) {
  const [selectedChapters, setSelectedChapters] = useState([1, 2, 3]); // Default 1-3
  const [generating, setGenerating] = useState(false);

  const toggleChapter = (num) => {
    setSelectedChapters(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a,b) => a-b)
    );
  };

  const handleDownload = async () => {
    if (selectedChapters.length === 0) {
      alert('Please select at least one chapter.');
      return;
    }

    setGenerating(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText('AI is summarizing your chapters for slides...');
      setIsGlobalLoading(true);
    }

    try {
      const response = await fetch('/api/premium/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          selectedChapterNumbers: selectedChapters
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate slide content');

      // --- pptxgenjs Logic ---
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      // 1. Title Slide
      let slide = pres.addSlide();
      slide.background = { fill: "F8FAFC" };
      
      // Branding Bar
      slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: "6366F1" } });

      slide.addText(data.metadata.title.toUpperCase(), {
        x: 0.5, y: 1.5, w: 9, h: 1.5,
        fontSize: 32, bold: true, color: "0F172A", align: "center", fontFace: "Arial"
      });

      slide.addText(`By: ${data.metadata.author}
${data.metadata.department}
${data.metadata.university}`, {
        x: 0.5, y: 3.5, w: 9, h: 1.5,
        fontSize: 18, color: "64748B", align: "center"
      });

      // 2. Content Slides
      data.slides.forEach(s => {
        let contentSlide = pres.addSlide();
        
        // Header
        contentSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.8, fill: { color: "0F172A" } });
        contentSlide.addText(s.title.toUpperCase(), {
          x: 0.5, y: 0.1, w: 9, h: 0.6,
          fontSize: 24, bold: true, color: "FFFFFF", align: "left"
        });

        // Bullet Points
        contentSlide.addText(
          s.bullets.map(b => ({ text: b, options: { bullet: true, indent: 20 } })),
          { x: 0.5, y: 1.2, w: 9, h: 4, fontSize: 18, color: "334155", lineSpacing: 28 }
        );

        // Footer
        contentSlide.addText("W3 WRITELAB ACADEMIC SUITE", {
          x: 0.5, y: 5.2, w: 9, h: 0.3, fontSize: 10, color: "CBD5E1", align: "right"
        });
      });

      // 3. Final Slide
      let finalSlide = pres.addSlide();
      finalSlide.addText("THANK YOU", {
        x: 0.5, y: 2.5, w: 9, h: 1, fontSize: 44, bold: true, color: "6366F1", align: "center"
      });
      finalSlide.addText("Questions & Feedback", {
        x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 18, color: "64748B", align: "center"
      });

      // Export
      await pres.writeFile({ fileName: `${data.metadata.title}_Presentation.pptx` });
      onClose();

    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
      if (setIsGlobalLoading) setIsGlobalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', zIndex: 1000, maxWidth: '500px', width: 'calc(100% - 32px)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#eff6ff', p: '10px', borderRadius: '12px', color: '#2563eb' }}>
              <Icons.Monitor />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Presentation Generator</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Icons.X /></button>
        </div>

        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: '1.6' }}>
          Select the chapters you want to include in your defense slides. AI will summarize them into technical bullet points.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {chapters.map(ch => (
            <div 
              key={ch.id} 
              onClick={() => toggleChapter(ch.number)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${selectedChapters.includes(ch.number) ? '#6366f1' : '#f1f5f9'}`,
                background: selectedChapters.includes(ch.number) ? '#f5f3ff' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Chapter {ch.number}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{ch.title}</span>
              </div>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                background: selectedChapters.includes(ch.number) ? '#6366f1' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>
                {selectedChapters.includes(ch.number) && <Icons.Check />}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleDownload}
          disabled={generating}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: '#0f172a', color: 'white', fontSize: '15px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            opacity: generating ? 0.7 : 1
          }}
        >
          {generating ? 'Summarizing...' : 'Generate Slides (.pptx)'}
        </button>
      </div>
    </>
  );
}
