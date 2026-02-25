// src/components/premium/modals/PresentationModal.js
'use client';

import { useState } from 'react';
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
  GraduationCap: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>,
  User: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Calendar: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Bookmark: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>,
  ArrowRight: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14M12 5l7 7-7 7"></path></svg>,
  CheckCircle2: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>,
  Lightbulb: (props) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>,
  Star: (props) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
};

// --- PPTX Export Helper ---
async function exportSlidesToPPTX(slides, template, filename) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  
  const primaryColor = template.primaryColor.replace('#', '');
  const secondaryColor = template.secondaryColor.replace('#', '');
  const accentColor = template.accentColor.replace('#', '');

  slides.forEach((slide) => {
    const pptSlide = pptx.addSlide();

    switch (slide.type) {
      case 'title':
        pptSlide.background = { color: primaryColor };
        pptSlide.addText(slide.title.toUpperCase(), {
          x: '10%', y: '35%', w: '80%', h: '15%',
          fontSize: 36, bold: true, color: 'FFFFFF', align: 'center'
        });
        if (slide.subtitle) {
          pptSlide.addText(slide.subtitle, {
            x: '10%', y: '50%', w: '80%', h: '8%',
            fontSize: 20, color: accentColor, align: 'center'
          });
        }
        let yPos = 62;
        if (slide.author) {
          pptSlide.addText(`By: ${slide.author}`, { x: '10%', y: `${yPos}%`, w: '80%', h: '6%', fontSize: 16, color: 'DDDDDD', align: 'center' });
          yPos += 6;
        }
        if (slide.institution) {
          pptSlide.addText(slide.institution, { x: '10%', y: `${yPos}%`, w: '80%', h: '5%', fontSize: 14, color: 'AAAAAA', align: 'center' });
        }
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'section':
        pptSlide.background = { color: secondaryColor };
        if (slide.sectionTitle) {
          pptSlide.addText(slide.sectionTitle.toUpperCase(), { x: '10%', y: '35%', w: '80%', h: '6%', fontSize: 14, color: accentColor, align: 'center', charSpacing: 3 });
        }
        pptSlide.addText(slide.title, { x: '10%', y: '42%', w: '80%', h: '15%', fontSize: 40, bold: true, color: 'FFFFFF', align: 'center' });
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'conclusion':
        pptSlide.background = { color: primaryColor };
        pptSlide.addText(slide.title, { x: '8%', y: '22%', w: '84%', h: '12%', fontSize: 32, bold: true, color: 'FFFFFF' });
        if (slide.bullets) {
          slide.bullets.slice(0, 5).forEach((bullet, idx) => {
            const y = 38 + (idx * 10);
            pptSlide.addShape('rect', { x: '8%', y: `${y}%`, w: '84%', h: '8%', fill: { color: secondaryColor, transparency: 50 }, line: { color: accentColor, width: 2 } });
            pptSlide.addText('★ ' + bullet, { x: '10%', y: `${y + 1}%`, w: '80%', h: '6%', fontSize: 14, color: 'EEEEEE' });
          });
        }
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      default: // content/bullets
        pptSlide.background = { color: 'FFFFFF' };
        pptSlide.addShape('rect', { x: '8%', y: '12%', w: '12%', h: '1%', fill: { color: accentColor } });
        pptSlide.addText(slide.title, { x: '8%', y: '15%', w: '84%', h: '10%', fontSize: 28, bold: true, color: primaryColor });
        if (slide.bullets) {
          slide.bullets.slice(0, 6).forEach((bullet, idx) => {
            const y = 30 + (idx * 9);
            pptSlide.addShape('rect', { x: '6%', y: `${y}%`, w: '88%', h: '8%', fill: { color: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } });
            pptSlide.addShape('rect', { x: '6%', y: `${y}%`, w: '0.8%', h: '8%', fill: { color: accentColor } });
            pptSlide.addText('✓ ' + bullet, { x: '8%', y: `${y}%`, w: '84%', h: '8%', fontSize: 14, color: '1F2937', valign: 'middle' });
          });
        }
        pptSlide.addShape('rect', { x: 0, y: '97%', w: '100%', h: '3%', fill: { color: accentColor } });
        break;
    }
  });

  await pptx.writeFile({ fileName: filename });
}

// --- Preview Components ---
const SlideRenderer = ({ slide, template }) => {
  const commonStyles = {
    width: '100%', height: '100%', position: 'relative', overflow: 'hidden', transition: 'all 0.5s ease', fontFamily: template.fontFamily
  };

  switch (slide.type) {
    case 'title':
      return (
        <div style={{ ...commonStyles, backgroundColor: template.primaryColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', borderRadius: '50%', background: template.accentColor, opacity: 0.1, transform: 'translate(30%, -30%)' }} />
          <div style={{ padding: '16px', background: `${template.accentColor}20`, borderRadius: '16px', marginBottom: '24px' }}>
            <Icons.GraduationCap style={{ color: template.accentColor, width: '48px', height: '48px' }} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', textTransform: 'uppercase', marginBottom: '16px', lineHeight: '1.2' }}>{slide.title}</h1>
          <p style={{ fontSize: '18px', color: template.accentColor, marginBottom: '32px' }}>{slide.subtitle}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)' }}>
              <Icons.User style={{ width: '16px', height: '16px' }} /> <span style={{ fontSize: '14px', fontWeight: '600' }}>{slide.author}</span>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{slide.institution}</p>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: template.accentColor }} />
        </div>
      );
    case 'section':
      return (
        <div style={{ ...commonStyles, backgroundColor: template.secondaryColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center' }}>
          <Icons.Bookmark style={{ color: template.accentColor, width: '40px', height: '40px', marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', fontWeight: '800', color: template.accentColor, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '16px' }}>{slide.sectionTitle}</p>
          <h2 style={{ fontSize: '40px', fontWeight: '900', color: 'white', lineHeight: '1.1' }}>{slide.title}</h2>
          <Icons.ArrowRight style={{ color: template.accentColor, marginTop: '32px' }} className="animate-pulse" />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: template.accentColor }} />
        </div>
      );
    case 'conclusion':
      return (
        <div style={{ ...commonStyles, backgroundColor: template.primaryColor, padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Icons.Lightbulb style={{ color: template.accentColor, width: '32px', height: '32px' }} />
            <div style={{ width: '48px', height: '4px', background: template.accentColor, borderRadius: '2px' }} />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '32px' }}>{slide.title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {slide.bullets?.map((b, i) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${template.accentColor}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.Star style={{ color: template.accentColor, width: '16px', height: '16px' }} />
                <span style={{ color: '#eee', fontSize: '16px', fontWeight: '500' }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '32px', right: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: '700' }}>THANK YOU</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: template.accentColor }} />
        </div>
      );
    default:
      return (
        <div style={{ ...commonStyles, backgroundColor: 'white', padding: '40px' }}>
          <div style={{ width: '60px', height: '4px', background: template.accentColor, borderRadius: '2px', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: template.primaryColor, marginBottom: '8px', textTransform: 'uppercase' }}>{slide.title}</h2>
          {slide.subtitle && <p style={{ fontSize: '16px', color: template.secondaryColor, marginBottom: '24px' }}>{slide.subtitle}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            {slide.bullets?.map((b, i) => (
              <div key={i} style={{ padding: '12px 16px', background: i % 2 === 0 ? '#f8fafc' : 'white', borderLeft: `4px solid ${template.accentColor}`, display: 'flex', alignItems: 'start', gap: '12px', borderRadius: '4px' }}>
                <Icons.CheckCircle2 style={{ color: template.accentColor, width: '18px', height: '18px', marginTop: '2px' }} />
                <span style={{ color: '#334155', fontSize: '15px', fontWeight: '500', lineHeight: '1.4' }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '24px', right: '24px', color: '#cbd5e1', fontSize: '12px', fontWeight: '800' }}>{slide.id}</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: template.accentColor }} />
        </div>
      );
  }
};

// --- Main Component ---
export default function PresentationModal({ isOpen, onClose, chapters, projectId, userId, setIsGlobalLoading, setGlobalLoadingText }) {
  const [step, setStep] = useState('selection');
  const [selectedChapters, setSelectedChapters] = useState([1, 2, 3]);
  const [slides, setSlides] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(SLIDE_TEMPLATES[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleChapter = (num) => {
    setSelectedChapters(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a,b) => a-b));
  };

  const processData = (data) => {
    const slideList = [];
    let counter = 1;

    // 1. Title Slide
    slideList.push({ id: String(counter++), type: 'title', title: data.title, subtitle: data.subtitle, author: data.author, institution: data.institution });

    // 2. Section & Content Slides
    data.sections.forEach((sec, idx) => {
      slideList.push({ id: String(counter++), type: 'section', title: sec.title, sectionTitle: `Section ${idx + 1}` });
      
      const chunkedBullets = [];
      for (let i = 0; i < sec.bullets.length; i += 5) {
        chunkedBullets.push(sec.bullets.slice(i, i + 5));
      }

      chunkedBullets.forEach((bullets, bIdx) => {
        slideList.push({ id: String(counter++), type: 'content', title: sec.title + (chunkedBullets.length > 1 ? ` (${bIdx + 1})` : ''), bullets });
      });
    });

    // 3. Conclusion
    if (data.conclusion) {
      slideList.push({ id: String(counter++), type: 'conclusion', title: data.conclusion.title, bullets: data.conclusion.bullets });
    }

    return slideList;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    if (setIsGlobalLoading) {
      setGlobalLoadingText('AI is summarizing content for academic slides...');
      setIsGlobalLoading(true);
    }

    try {
      const response = await fetch('/api/premium/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId, selectedChapterNumbers: selectedChapters })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const processed = processData(data.data);
      setSlides(processed);
      setStep('preview');
      setCurrentIndex(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
      if (setIsGlobalLoading) setIsGlobalLoading(false);
    }
  };

  const handleDownload = () => {
    const filename = `${slides[0].title.replace(/\s+/g, '_')}_Presentation.pptx`;
    exportSlidesToPPTX(slides, selectedTemplate, filename);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
        className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col md:flex-row h-[95vh] md:h-[850px]">
        
        {/* Main Workspace */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><Icons.Monitor /></div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Presentation Builder</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{step === 'selection' ? 'Select Chapters' : 'Slide Preview & Customization'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><Icons.X /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center">
            {step === 'selection' ? (
              <div className="w-full max-w-lg space-y-8 my-auto">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-slate-900">Choose Presentation Content</h3>
                  <p className="text-slate-500 font-medium mt-2">Select the chapters you've completed to build your defense slides.</p>
                </div>
                <div className="grid gap-4">
                  {chapters.map(ch => {
                    const hasContent = ch.content && ch.content.length > 50;
                    const isSelected = selectedChapters.includes(ch.number);
                    return (
                      <button key={ch.id} disabled={!hasContent} onClick={() => toggleChapter(ch.number)}
                        className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left ${isSelected ? 'border-slate-900 bg-white shadow-xl ring-8 ring-slate-100' : 'border-slate-100 bg-white opacity-60'}`}>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-lg text-slate-900">Chapter {ch.number}</span>
                            {!hasContent && <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full">NOT READY</span>}
                          </div>
                          <p className="text-sm text-slate-400 font-bold truncate max-w-[300px] mt-1">{ch.title}</p>
                        </div>
                        {isSelected && <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg"><Icons.Check /></div>}
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleGenerate} disabled={isGenerating || selectedChapters.length === 0}
                  className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                  <Icons.Sparkles /> {isGenerating ? 'SUMMARIZING...' : 'BUILD PRESENTATION PREVIEW'}
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center py-4">
                <div className="w-full max-w-[850px] aspect-video rounded-[32px] shadow-[0_48px_80px_-12px_rgba(0,0,0,0.3)] overflow-hidden relative group border-[12px] border-white transition-all duration-500">
                  <SlideRenderer slide={slides[currentIndex]} template={selectedTemplate} />
                  
                  <button onClick={() => setCurrentIndex(p => Math.max(0, p-1))}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20 z-10"><Icons.ChevronLeft /></button>
                  <button onClick={() => setCurrentIndex(p => Math.min(slides.length-1, p+1))}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20 z-10"><Icons.ChevronRight /></button>
                </div>

                <div className="mt-10 flex flex-col items-center gap-6">
                  <div className="flex gap-2.5">
                    {slides.map((_, i) => (
                      <button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 rounded-full transition-all ${i === currentIndex ? 'w-12 bg-slate-900' : 'w-2 bg-slate-200 hover:bg-slate-300'}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-8">
                    <button onClick={() => setStep('selection')} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">← Back to selection</button>
                    <span className="text-[10px] font-black text-slate-900 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 uppercase tracking-widest">Slide {currentIndex + 1} / {slides.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-96 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mb-10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Visual Theme</h4>
              <div className="grid gap-4">
                {SLIDE_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t)}
                    className={`group relative p-5 rounded-[24px] border-2 transition-all text-left overflow-hidden ${selectedTemplate.id === t.id ? 'border-slate-900 shadow-xl ring-4 ring-slate-50' : 'border-slate-50 hover:border-slate-200'}`}>
                    <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundColor: t.primaryColor }} />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-white" style={{ background: t.primaryColor }}>
                        <div className="w-4 h-1 bg-white/40 rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{t.theme}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4 shrink-0">
            <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed px-2">Your presentation will be exported as a professional PPTX file matching this visual theme.</p>
            <button onClick={handleDownload} disabled={step === 'selection'}
              className="w-full py-5 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-3xl font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
              <Icons.Download /> DOWNLOAD PPTX
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
