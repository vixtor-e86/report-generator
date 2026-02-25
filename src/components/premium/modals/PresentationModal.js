// src/components/premium/modals/PresentationModal.js
'use client';

import { useState } from 'react';
import pptxgen from "pptxgenjs";
import { SLIDE_TEMPLATES } from '@/lib/slideTemplates';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Monitor: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  ChevronLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path></svg>
};

export default function PresentationModal({ isOpen, onClose, chapters, projectId, userId, setIsGlobalLoading, setGlobalLoadingText }) {
  const [step, setStep] = useState('selection'); // selection | preview
  const [selectedChapters, setSelectedChapters] = useState([1, 2, 3]);
  const [generatedSlides, setGeneratedSlides] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(SLIDE_TEMPLATES[0]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleChapter = (num) => {
    setSelectedChapters(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a,b) => a-b)
    );
  };

  const handleGenerateContent = async () => {
    if (selectedChapters.length === 0) {
      alert('Please select at least one chapter.');
      return;
    }

    setIsGenerating(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText('AI is architecting your presentation slides...');
      setIsGlobalLoading(true);
    }

    try {
      const response = await fetch('/api/premium/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId, selectedChapterNumbers: selectedChapters })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate slide content');

      setGeneratedSlides(data.slides);
      setMetadata(data.metadata);
      setStep('preview');
      setCurrentSlideIndex(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
      if (setIsGlobalLoading) setIsGlobalLoading(false);
    }
  };

  const handleDownload = async () => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    const t = selectedTemplate;

    // 1. Title Slide
    let titleSlide = pres.addSlide();
    titleSlide.background = { fill: t.primaryColor.replace('#', '') };
    
    titleSlide.addText(metadata.title.toUpperCase(), {
      x: 0.5, y: 1.5, w: 9, h: 1.5,
      fontSize: 32, bold: true, color: "FFFFFF", align: "center", fontFace: "Arial"
    });

    titleSlide.addText(`By: ${metadata.author}\n${metadata.department}`, {
      x: 0.5, y: 3.5, w: 9, h: 1.5,
      fontSize: 18, color: t.accentColor.replace('#', ''), align: "center"
    });

    // 2. Content Slides
    generatedSlides.forEach(s => {
      let contentSlide = pres.addSlide();
      contentSlide.background = { fill: "FFFFFF" };
      
      // Header Bar
      contentSlide.addShape(pres.ShapeType.rect, { 
        x: 0, y: 0, w: '100%', h: 0.8, 
        fill: { color: t.primaryColor.replace('#', '') } 
      });

      contentSlide.addText(s.title.toUpperCase(), {
        x: 0.5, y: 0.1, w: 9, h: 0.6,
        fontSize: 22, bold: true, color: "FFFFFF", align: "left"
      });

      // Bullets
      contentSlide.addText(
        s.bullets.map(b => ({ text: b, options: { bullet: true, indent: 20 } })),
        { x: 0.5, y: 1.2, w: 9, h: 4, fontSize: 18, color: "334155", lineSpacing: 28 }
      );

      // Footer
      contentSlide.addText("GENERATED BY W3 WRITELAB", {
        x: 0.5, y: 5.2, w: 9, h: 0.3, fontSize: 10, color: "CBD5E1", align: "right"
      });
    });

    await pres.writeFile({ fileName: `${metadata.title}_Slides.pptx` });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[700px]"
      >
        {/* Left Panel: Preview & Content */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-100">
          <div className="p-6 flex justify-between items-center bg-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Icons.Monitor />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Presentation Builder</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {step === 'selection' ? 'Step 1: Select Content' : 'Step 2: Preview & Style'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
            {step === 'selection' ? (
              <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-extrabold text-slate-900">Pick your chapters</h3>
                  <p className="text-sm text-slate-500 mt-1">We'll summarize these into professional slides.</p>
                </div>
                
                <div className="grid gap-3">
                  {chapters.map(ch => {
                    const hasContent = ch.content && ch.content.length > 50;
                    const isSelected = selectedChapters.includes(ch.number);
                    return (
                      <button 
                        key={ch.id}
                        disabled={!hasContent}
                        onClick={() => toggleChapter(ch.number)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                          isSelected ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50' : 'border-slate-100 bg-white hover:border-slate-200'
                        } ${!hasContent ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">Chapter {ch.number}</span>
                            {!hasContent && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">EMPTY</span>}
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{ch.title}</p>
                        </div>
                        {isSelected && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Icons.Check /></div>}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={handleGenerateContent}
                  disabled={isGenerating || selectedChapters.length === 0}
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isGenerating ? 'Summarizing...' : <><Icons.Sparkles /> Generate Preview</>}
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center">
                {/* Slide Canvas */}
                <div className="w-full max-w-[600px] aspect-video rounded-3xl shadow-2xl overflow-hidden relative group">
                  <div 
                    className="w-full h-full p-10 flex flex-col transition-all duration-500"
                    style={{ 
                      backgroundColor: currentSlideIndex === 0 ? selectedTemplate.primaryColor : 'white',
                      fontFamily: selectedTemplate.fontFamily
                    }}
                  >
                    {currentSlideIndex === 0 ? (
                      /* Title Slide Preview */
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-1 w-16 mb-8 rounded-full" style={{ backgroundColor: selectedTemplate.accentColor }} />
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-tight">
                          {metadata.title}
                        </h1>
                        <div className="mt-8 space-y-1">
                          <p className="text-sm font-bold opacity-80" style={{ color: selectedTemplate.accentColor }}>{metadata.author}</p>
                          <p className="text-xs text-white/60 font-medium">{metadata.department}</p>
                        </div>
                      </div>
                    ) : (
                      /* Content Slide Preview */
                      <div className="h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: selectedTemplate.primaryColor }} />
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {generatedSlides[currentSlideIndex-1]?.title}
                          </h2>
                        </div>
                        <ul className="space-y-3">
                          {generatedSlides[currentSlideIndex-1]?.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: selectedTemplate.accentColor }} />
                              <span className="text-sm font-medium text-slate-600 leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-50">
                          <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">W3 Writelab Academic</span>
                          <span className="text-[10px] font-bold text-slate-400">Slide {currentSlideIndex + 1}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  <button 
                    onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                  ><Icons.ChevronLeft /></button>
                  <button 
                    onClick={() => setCurrentSlideIndex(prev => Math.min(generatedSlides.length, prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                  ><Icons.ChevronRight /></button>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button onClick={() => setStep('selection')} className="px-6 py-2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Back to Selection</button>
                  <div className="flex gap-1">
                    {[...Array(generatedSlides.length + 1)].map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all ${i === currentSlideIndex ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Template Selection & Action */}
        <div className="w-full md:w-80 p-6 flex flex-col bg-white overflow-y-auto">
          <div className="mb-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Choose Template</h4>
            <div className="grid gap-3">
              {SLIDE_TEMPLATES.map(t => {
                const isSelected = selectedTemplate.id === t.id;
                return (
                  <button 
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`group relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                      isSelected ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10" style={{ backgroundColor: t.primaryColor }} />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-8 h-8 rounded-lg shadow-inner flex items-center justify-center text-white" style={{ background: t.primaryColor }}>
                        <div className="w-3 h-0.5 bg-white/40 rounded-full mb-1" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t.id}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-6 border-t border-slate-50">
            <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed px-4">
              Your slides will be exported as high-quality PowerPoint (.pptx) using the selected theme.
            </p>
            <button 
              onClick={handleDownload}
              disabled={step === 'selection'}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Icons.Download /> Download PPTX
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
