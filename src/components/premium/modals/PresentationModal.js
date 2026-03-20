// src/components/premium/modals/PresentationModal.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import pptxgen from "pptxgenjs";
import { SLIDE_TEMPLATES } from '@/lib/slideTemplates';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
const Icons = {
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Monitor: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  ChevronLeft: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ChevronRight: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Sparkles: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 01.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path></svg>,
  Image: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Bookmark: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>,
};

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
  } catch (e) { return null; }
};

async function exportSlidesToPPTX(slides, template, filename, selectedImages = []) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  
  const primaryColor = template.primaryColor.replace('#', '');
  const secondaryColor = template.secondaryColor.replace('#', '');
  const accentColor = template.accentColor.replace('#', '');

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
        pptSlide.addText(slide.title.toUpperCase(), { x: '10%', y: '30%', w: '80%', h: '20%', fontSize: 32, bold: true, color: 'FFFFFF', align: 'center' });
        if (slide.subtitle) pptSlide.addText(slide.subtitle, { x: '10%', y: '50%', w: '80%', h: '10%', fontSize: 18, color: accentColor, align: 'center', italic: true });
        pptSlide.addText(`By: ${slide.author}\n${slide.institution}`, { x: '10%', y: '70%', w: '80%', h: '15%', fontSize: 14, color: 'CCCCCC', align: 'center' });
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'section':
        pptSlide.background = { color: secondaryColor };
        pptSlide.addText(slide.title.toUpperCase(), { x: '10%', y: '40%', w: '80%', h: '20%', fontSize: 36, bold: true, color: 'FFFFFF', align: 'center' });
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'content':
        pptSlide.background = { color: 'FFFFFF' };
        pptSlide.addText(slide.title, { x: '8%', y: '8%', w: '84%', h: '12%', fontSize: 24, bold: true, color: primaryColor });
        
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletObjects = slide.bullets.map(text => ({
            text,
            options: { bullet: true, paraSpaceBefore: 8, indent: 20 }
          }));

          if (slide.imageDbId && bufferedImages[slide.imageDbId]) {
            // Split Layout
            pptSlide.addText(bulletObjects.slice(0, 4), { 
              x: '8%', y: '22%', w: '42%', h: '65%', 
              fontSize: 13, color: '334155', valign: 'top', lineSpacing: 20 
            });
            pptSlide.addImage({ data: bufferedImages[slide.imageDbId], x: '55%', y: '22%', w: '38%', h: '60%' });
          } else {
            // Full Width Layout
            pptSlide.addText(bulletObjects.slice(0, 6), { 
              x: '8%', y: '22%', w: '84%', h: '65%', 
              fontSize: 14, color: '334155', valign: 'top', lineSpacing: 22 
            });
          }
        }
        pptSlide.addShape('rect', { x: 0, y: '97%', w: '100%', h: '3%', fill: { color: accentColor } });
        break;

      case 'conclusion':
        pptSlide.background = { color: primaryColor };
        pptSlide.addText(slide.title, { x: '8%', y: '15%', w: '84%', h: '12%', fontSize: 28, bold: true, color: 'FFFFFF' });
        if (slide.bullets) {
          const concBullets = slide.bullets.map(text => ({
            text,
            options: { bullet: { type: 'star' }, paraSpaceBefore: 10, indent: 25 }
          }));
          pptSlide.addText(concBullets, { x: '10%', y: '32%', w: '80%', h: '55%', fontSize: 15, color: 'EEEEEE', valign: 'top', lineSpacing: 24 });
        }
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;
    }
  });

  await pptx.writeFile({ fileName: filename });
}

// --- Preview Components ---
const SlideRenderer = ({ slide, template }) => {
  if (!slide) return <div className="w-full h-full bg-slate-900" />;
  const commonStyles = { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif' };

  switch (slide.type) {
    case 'title':
      return (
        <div style={{ ...commonStyles, backgroundColor: template.primaryColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', marginBottom: '1rem' }}>{slide.title}</h1>
          <p style={{ fontSize: '1.2rem', color: template.accentColor, fontWeight: '600' }}>{slide.subtitle}</p>
          <div style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            <p>By: {slide.author}</p>
            <p>{slide.institution}</p>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4%', background: template.accentColor }} />
        </div>
      );
    case 'section':
      return (
        <div style={{ ...commonStyles, backgroundColor: template.secondaryColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10%', textAlign: 'center' }}>
          <Icons.Bookmark style={{ color: template.accentColor, width: '48px', height: '48px', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{slide.title}</h2>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4%', background: template.accentColor }} />
        </div>
      );
    default:
      return (
        <div style={{ ...commonStyles, backgroundColor: 'white', padding: '8%' }}>
          <div style={{ width: '40px', height: '4px', background: template.accentColor, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: template.primaryColor, marginBottom: '2rem' }}>{slide.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: slide.imageDbId ? '1fr 1fr' : '1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {slide.bullets?.slice(0, 5).map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>
                  <span style={{ color: template.accentColor }}>•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
            {slide.imageDbId && (
              <div style={{ background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', height: '200px' }}>
                <div className="text-center p-4">
                  <Icons.Image style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
                  <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>VISUAL ELEMENT PLACEHOLDER</p>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: template.accentColor }} />
        </div>
      );
  }
};

// --- Main Component ---
export default function PresentationModal({ isOpen, onClose, chapters, projectId, userId, setIsGlobalLoading, setGlobalLoadingText, showNotification, images = [] }) {
  const [step, setStep] = useState('selection'); 
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
      showNotification('Chapter Not Ready', `Chapter ${num} needs more content.`, 'warning');
      return;
    }
    setSelectedChapters(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a,b) => a-b));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGlobalLoadingText('AI Architect is analyzing technical depth...');
    setIsGlobalLoading(true);
    try {
      const response = await fetch('/api/premium/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId, selectedChapterNumbers: selectedChapters })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      const processed = processSlidesWithImages(data.data, selectedImageIds);
      setSlides(processed);
      setStep('preview');
      setCurrentIndex(0);
    } catch (err) { showNotification('Error', err.message, 'error'); }
    finally {
      setIsGenerating(false);
      setIsGlobalLoading(false);
    }
  };

  const processSlidesWithImages = (data, imageIds) => {
    const slideList = [];
    let counter = 1;
    let imagePointer = 0;

    slideList.push({ id: String(counter++), type: 'title', title: data.title, subtitle: data.subtitle, author: data.author, institution: data.institution });
    
    data.sections.forEach((sec) => {
      slideList.push({ id: String(counter++), type: 'section', title: sec.title });
      const chunkedBullets = [];
      for (let i = 0; i < sec.bullets.length; i += 5) chunkedBullets.push(sec.bullets.slice(i, i + 5));
      chunkedBullets.forEach((bullets, bIdx) => {
        const slide = { id: String(counter++), type: 'content', title: sec.title, bullets };
        if (bIdx === 0 && imagePointer < imageIds.length) {
          slide.imageDbId = imageIds[imagePointer];
          imagePointer++;
        }
        slideList.push(slide);
      });
    });

    if (data.conclusion) slideList.push({ id: String(counter++), type: 'conclusion', title: data.conclusion.title, bullets: data.conclusion.bullets });
    return slideList;
  };

  const handleDownload = () => {
    const currentImages = images.filter(img => selectedImageIds.includes(img.id));
    const filename = `${slides[0].title.replace(/\s+/g, '_')}_Presentation.pptx`;
    exportSlidesToPPTX(slides, selectedTemplate, filename, currentImages);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 lg:p-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl" onClick={onClose} />
      
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-none md:rounded-[48px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-full max-h-[900px]">
        <div className="p-6 md:p-10 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl"><Icons.Monitor /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Academic Slide Suite</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Presentation Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center">
              {step === 'selection' && (
                <div className="w-full max-w-xl space-y-8 my-auto">
                  <div className="text-center"><h3 className="text-3xl font-black text-slate-900 tracking-tight">Select Basis</h3><p className="text-slate-500 font-medium mt-2">Choose the chapters to be transformed into detailed technical slides.</p></div>
                  <div className="grid gap-4">{chapters.map(ch => { const hasContent = ch.content && ch.content.trim().length >= READY_THRESHOLD; const isSelected = selectedChapters.includes(ch.number); return (<button key={ch.id} disabled={!hasContent} onClick={() => toggleChapter(ch.number)} className={`flex items-center justify-between p-6 rounded-[32px] border-2 transition-all text-left ${isSelected ? 'border-slate-900 bg-white shadow-xl ring-4 md:ring-8 ring-slate-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}><div className="flex-1 pr-4"><span className={`text-[10px] font-black uppercase tracking-widest ${hasContent ? 'text-indigo-600' : 'text-slate-400'}`}>Chapter {ch.number}</span><h4 className={`text-base font-black truncate mt-1 ${hasContent ? 'text-slate-900' : 'text-slate-300'}`}>{ch.title}</h4></div>{isSelected && <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl"><Icons.Check /></div>}</button>); })}</div>
                  <button onClick={() => setStep('images')} disabled={selectedChapters.length === 0} className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">NEXT: TECHNICAL VISUALS <Icons.ChevronRight /></button>
                </div>
              )}
              {step === 'images' && (
                <div className="w-full max-w-3xl space-y-8 my-auto">
                  <div className="text-center"><h3 className="text-3xl font-black text-slate-900 tracking-tight">Technical Visuals</h3><p className="text-slate-500 font-medium mt-2">Select diagrams or figures to embed directly into your presentation.</p></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[45vh] overflow-y-auto p-4 custom-scrollbar">{images.map(img => (<button key={img.id} onClick={() => setSelectedImageIds(prev => prev.includes(img.id) ? prev.filter(i => i !== img.id) : [...prev, img.id])} className={`relative aspect-square rounded-[24px] overflow-hidden border-4 transition-all ${selectedImageIds.includes(img.id) ? 'border-slate-900 scale-95 shadow-2xl' : 'border-white shadow-lg opacity-60 hover:opacity-100'}`}><img src={img.src} alt={img.name} className="w-full h-full object-cover" />{selectedImageIds.includes(img.id) && <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white"><Icons.Check /></div>}</button>))}</div>
                  <div className="flex gap-4"><button onClick={() => setStep('selection')} className="flex-1 py-6 bg-white border-2 border-slate-100 rounded-[24px] font-black text-slate-400">BACK</button><button onClick={handleGenerate} className="flex-[2] py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm shadow-2xl flex items-center justify-center gap-3"><Icons.Sparkles /> BUILD DETAILED PREVIEW</button></div>
                </div>
              )}
              {step === 'preview' && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-full max-w-[850px] aspect-video rounded-[40px] shadow-2xl overflow-hidden relative group border-[12px] border-white bg-white"><SlideRenderer slide={slides[currentIndex]} template={selectedTemplate} /><button onClick={() => setCurrentIndex(p => Math.max(0, p-1))} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"><Icons.ChevronLeft /></button><button onClick={() => setCurrentIndex(p => Math.min(slides.length-1, p+1))} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"><Icons.ChevronRight /></button></div>
                  <div className="mt-12 flex flex-col items-center gap-8"><div className="flex gap-3">{slides.map((_, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 rounded-full transition-all ${i === currentIndex ? 'w-16 bg-slate-900' : 'w-2 bg-slate-200'}`} />))}</div><button onClick={() => setStep('images')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">← Back to Customization</button></div>
                </div>
              )}
            </div>
          </div>
          <div className="w-96 bg-white border-l border-slate-100 flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-10"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Presentation Theme</h4><div className="space-y-4">{SLIDE_TEMPLATES.map(t => (<button key={t.id} onClick={() => setSelectedTemplate(t)} className={`w-full relative p-6 rounded-[28px] border-2 transition-all text-left overflow-hidden ${selectedTemplate.id === t.id ? 'border-slate-900 shadow-2xl ring-8 ring-slate-50' : 'border-slate-50 hover:border-slate-100'}`}><div className="absolute inset-0 opacity-10" style={{ backgroundColor: t.primaryColor }} /><div className="relative z-10"><div className="font-black text-slate-900 text-sm uppercase">{t.name}</div><div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{t.theme} Style</div></div></button>))}</div></div>
            <div className="p-10 bg-slate-50 border-t border-slate-100"><button onClick={handleDownload} disabled={step !== 'preview'} className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm shadow-2xl flex items-center justify-center gap-3 disabled:opacity-40"><Icons.Download /> DOWNLOAD PPTX</button></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
