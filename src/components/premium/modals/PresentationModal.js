// src/components/premium/modals/PresentationModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import pptxgen from "pptxgenjs";
import { SLIDE_TEMPLATES } from '@/lib/slideTemplates';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Monitor: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  ChevronLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 01.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  GraduationCap: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>,
  User: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Bookmark: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>,
  Star: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
};

// --- PPTX Helper with Image Buffering ---
const fetchImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Image buffering failed:", e);
    return null;
  }
};

async function exportSlidesToPPTX(slides, template, filename, selectedImages = []) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  
  const primaryColor = template.primaryColor.replace('#', '');
  const secondaryColor = template.secondaryColor.replace('#', '');
  const accentColor = template.accentColor.replace('#', '');

  // Prepare images
  const bufferedImages = {};
  for (const img of selectedImages) {
    const b64 = await fetchImageAsBase64(img.file_url || img.src);
    if (b64) bufferedImages[img.id] = b64;
  }

  slides.forEach((slide) => {
    const pptSlide = pptx.addSlide();

    switch (slide.type) {
      case 'title':
        pptSlide.background = { color: primaryColor };
        pptSlide.addText(slide.title.toUpperCase(), { x: '10%', y: '35%', w: '80%', h: '15%', fontSize: 36, bold: true, color: 'FFFFFF', align: 'center' });
        if (slide.subtitle) pptSlide.addText(slide.subtitle, { x: '10%', y: '50%', w: '80%', h: '8%', fontSize: 20, color: accentColor, align: 'center' });
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'section':
        pptSlide.background = { color: secondaryColor };
        pptSlide.addText(slide.title, { x: '10%', y: '42%', w: '80%', h: '15%', fontSize: 40, bold: true, color: 'FFFFFF', align: 'center' });
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'content':
        pptSlide.background = { color: 'FFFFFF' };
        pptSlide.addText(slide.title, { x: '8%', y: '10%', w: '84%', h: '10%', fontSize: 28, bold: true, color: primaryColor });
        
        // Check if this slide has an assigned image
        if (slide.imageId && bufferedImages[slide.imageDbId]) {
          // Slide with Image (Split Layout)
          if (slide.bullets) {
            slide.bullets.slice(0, 4).forEach((bullet, idx) => {
              const y = 25 + (idx * 12);
              pptSlide.addText('• ' + bullet, { x: '8%', y: `${y}%`, w: '40%', h: '10%', fontSize: 14, color: '334155' });
            });
          }
          pptSlide.addImage({ data: bufferedImages[slide.imageDbId], x: '55%', y: '25%', w: '35%', h: '50%' });
        } else {
          // Standard Bullet Slide
          if (slide.bullets) {
            slide.bullets.slice(0, 6).forEach((bullet, idx) => {
              const y = 25 + (idx * 10);
              pptSlide.addText('• ' + bullet, { x: '8%', y: `${y}%`, w: '84%', h: '8%', fontSize: 16, color: '334155' });
            });
          }
        }
        pptSlide.addShape('rect', { x: 0, y: '97%', w: '100%', h: '3%', fill: { color: accentColor } });
        break;

      default:
        pptSlide.background = { color: 'FFFFFF' };
        pptSlide.addText(slide.title, { x: '8%', y: '10%', w: '84%', h: '10%', fontSize: 28, bold: true, color: primaryColor });
        pptSlide.addShape('rect', { x: 0, y: '97%', w: '100%', h: '3%', fill: { color: accentColor } });
        break;
    }
  });

  await pptx.writeFile({ fileName: filename });
}

// --- Main Component ---
export default function PresentationModal({ isOpen, onClose, chapters, projectId, userId, setIsGlobalLoading, setGlobalLoadingText, showNotification, images = [] }) {
  const [step, setStep] = useState('selection'); // selection | images | preview
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [slides, setSlides] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(SLIDE_TEMPLATES[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const READY_THRESHOLD = 300;

  useEffect(() => {
    if (isOpen) {
      setStep('selection');
      setSlides([]);
      setSelectedChapters([]);
      setSelectedImageIds([]);
    }
  }, [isOpen]);

  const toggleChapter = (num) => {
    const chapter = chapters.find(ch => ch.number === num);
    if (!chapter || !chapter.content || chapter.content.trim().length < READY_THRESHOLD) {
      if (showNotification) showNotification('Chapter Not Ready', `Chapter ${num} needs more content.`, 'warning');
      return;
    }
    setSelectedChapters(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a,b) => a-b));
  };

  const toggleImage = (id) => {
    setSelectedImageIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText('AI is architecting your visual presentation...');
      setIsGlobalLoading(true);
    }
    try {
      const response = await fetch('/api/premium/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, userId, 
          selectedChapterNumbers: selectedChapters,
          includeImages: selectedImageIds.length > 0
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Process and inject images into data
      const processedSlides = processSlidesWithImages(data.data, selectedImageIds);
      setSlides(processedSlides);
      setStep('preview');
      setCurrentIndex(0);
    } catch (err) { alert(err.message); }
    finally {
      setIsGenerating(false);
      if (setIsGlobalLoading) setIsGlobalLoading(false);
    }
  };

  const processSlidesWithImages = (data, imageIds) => {
    const slideList = [];
    let counter = 1;
    let imagePointer = 0;

    slideList.push({ id: String(counter++), type: 'title', title: data.title, subtitle: data.subtitle, author: data.author, institution: data.institution });
    
    data.sections.forEach((sec, idx) => {
      slideList.push({ id: String(counter++), type: 'section', title: sec.title });
      
      const chunkedBullets = [];
      for (let i = 0; i < sec.bullets.length; i += 5) chunkedBullets.push(sec.bullets.slice(i, i + 5));
      
      chunkedBullets.forEach((bullets, bIdx) => {
        const slide = { id: String(counter++), type: 'content', title: sec.title, bullets };
        
        // Attach an image if available and it's the first slide of a section
        if (bIdx === 0 && imagePointer < imageIds.length) {
          slide.imageDbId = imageIds[imagePointer];
          slide.imageId = true; // Flag for layout
          imagePointer++;
        }
        slideList.push(slide);
      });
    });

    if (data.conclusion) slideList.push({ id: String(counter++), type: 'conclusion', title: data.conclusion.title, bullets: data.conclusion.bullets });
    return slideList;
  };

  const handleDownload = () => {
    if (slides.length === 0) return;
    const currentImages = images.filter(img => selectedImageIds.includes(img.id));
    const filename = `${slides[0].title.replace(/\s+/g, '_')}_Presentation.pptx`;
    exportSlidesToPPTX(slides, selectedTemplate, filename, currentImages);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
        className="relative bg-white md:rounded-[40px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col md:flex-row h-full md:h-[90vh] md:max-h-[850px]">
        
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-100 overflow-hidden">
          <div className="p-5 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Icons.Monitor /></div>
              <div>
                <h2 className="text-base md:text-xl font-black text-slate-900 leading-tight">Academic Slide Suite</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step === 'selection' ? 'Select Chapters' : step === 'images' ? 'Select Visuals' : 'Slide Preview'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center">
            {step === 'selection' && (
              <div className="w-full max-w-lg space-y-6 my-auto">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase">Step 1: Research Basis</h3>
                  <p className="text-sm text-slate-500 font-medium mt-2">Select completed chapters to feed the Slide Architect.</p>
                </div>
                <div className="grid gap-3">
                  {chapters.map(ch => {
                    const hasContent = ch.content && ch.content.trim().length >= READY_THRESHOLD;
                    const isSelected = selectedChapters.includes(ch.number);
                    return (
                      <button key={ch.id} disabled={!hasContent} onClick={() => toggleChapter(ch.number)}
                        className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all text-left ${isSelected ? 'border-slate-900 bg-white shadow-xl' : 'border-slate-100 bg-white'}`}>
                        <div className="flex-1 pr-4">
                          <span className={`font-black ${hasContent ? 'text-slate-900' : 'text-slate-400'}`}>Chapter {ch.number}</span>
                          <p className="text-xs font-bold truncate text-slate-400">{ch.title}</p>
                        </div>
                        {isSelected && <Icons.Check />}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setStep('images')} disabled={selectedChapters.length === 0}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl flex items-center justify-center gap-3">
                  NEXT: ADD VISUALS <Icons.ChevronRight />
                </button>
              </div>
            )}

            {step === 'images' && (
              <div className="w-full max-w-2xl space-y-6 my-auto">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase">Step 2: Technical Visuals</h3>
                  <p className="text-sm text-slate-500 font-medium mt-2">Select diagrams or images to include in your presentation.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2">
                  {images.map(img => (
                    <button key={img.id} onClick={() => toggleImage(img.id)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${selectedImageIds.includes(img.id) ? 'border-slate-900 scale-95' : 'border-white shadow-md'}`}>
                      <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                      {selectedImageIds.includes(img.id) && <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white"><Icons.Check /></div>}
                    </button>
                  ))}
                  {images.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 italic">No project images found. Upload some in the sidebar first.</div>}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep('selection')} className="flex-1 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black">BACK</button>
                  <button onClick={handleGenerate} className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl flex items-center justify-center gap-3">
                    <Icons.Sparkles /> BUILD PRESENTATION
                  </button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="w-full h-full flex flex-col items-center justify-center py-4">
                <div className="w-full max-w-[850px] aspect-video rounded-[32px] shadow-2xl overflow-hidden relative group border-8 border-white bg-white">
                  <div className="w-full h-full p-8 flex items-center justify-center bg-slate-100">
                    <div className="text-center">
                      <h4 className="font-black text-slate-900 text-xl">{slides[currentIndex].title}</h4>
                      <p className="text-slate-500 mt-2">Slide {currentIndex + 1} - {slides[currentIndex].type.toUpperCase()}</p>
                      {slides[currentIndex].imageDbId && <div className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-black text-xs">VISUAL ELEMENT INCLUDED</div>}
                    </div>
                  </div>
                  <button onClick={() => setCurrentIndex(p => Math.max(0, p-1))} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/10 hover:bg-black/20 rounded-full"><Icons.ChevronLeft /></button>
                  <button onClick={() => setCurrentIndex(p => Math.min(slides.length-1, p+1))} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/10 hover:bg-black/20 rounded-full"><Icons.ChevronRight /></button>
                </div>
                <div className="mt-10 flex flex-col items-center gap-6">
                  <div className="flex gap-2">
                    {slides.map((_, i) => (
                      <button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 rounded-full transition-all ${i === currentIndex ? 'w-12 bg-slate-900' : 'w-2 bg-slate-200'}`} />
                    ))}
                  </div>
                  <button onClick={() => setStep('images')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">← Back to Visuals</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Visual Theme</h4>
            <div className="space-y-4">
              {SLIDE_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setSelectedTemplate(t)}
                  className={`w-full relative p-5 rounded-[24px] border-2 transition-all text-left overflow-hidden ${selectedTemplate.id === t.id ? 'border-slate-900 shadow-xl' : 'border-slate-50'}`}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundColor: t.primaryColor }} />
                  <div className="relative z-10 font-black text-slate-900 text-sm">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <button onClick={handleDownload} disabled={step !== 'preview'}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl flex items-center justify-center gap-3 disabled:opacity-40">
              <Icons.Download /> DOWNLOAD PPTX
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
