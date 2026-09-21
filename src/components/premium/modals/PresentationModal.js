// src/components/premium/modals/PresentationModal.js
'use client';

import { useState, useEffect } from 'react';
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
  Layers: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  HelpCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  RefreshCw: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
};

// Robust CORS-proof image to base64 converter
const fetchImageAsBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  // 1. Try direct client fetch first
  try {
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    // CORS or network error, fallback to proxy
  }

  // 2. Fallback to server-side image proxy
  try {
    const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.base64) return data.base64;
    }
  } catch (err) {
    console.warn('Proxy image fetch failed:', err);
  }

  return null;
};

// Export Slides directly to PPTX with real embedded images
async function exportSlidesToPPTX(slides, template, filename) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  
  const primaryColor = (template.primaryColor || '#0f172a').replace('#', '');
  const secondaryColor = (template.secondaryColor || '#1e293b').replace('#', '');
  const accentColor = (template.accentColor || '#6366f1').replace('#', '');

  slides.forEach((slide) => {
    const pptSlide = pptx.addSlide();

    switch (slide.type) {
      case 'title':
        pptSlide.background = { color: primaryColor };
        pptSlide.addText(slide.title.toUpperCase(), { 
          x: '10%', y: '30%', w: '80%', h: '20%', 
          fontSize: 32, bold: true, color: 'FFFFFF', align: 'center' 
        });
        if (slide.subtitle) {
          pptSlide.addText(slide.subtitle, { 
            x: '10%', y: '50%', w: '80%', h: '10%', 
            fontSize: 18, color: accentColor, align: 'center', italic: true 
          });
        }
        pptSlide.addText(`By: ${slide.author}\n${slide.institution}`, { 
          x: '10%', y: '68%', w: '80%', h: '16%', 
          fontSize: 14, color: 'CCCCCC', align: 'center' 
        });
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'section':
        pptSlide.background = { color: secondaryColor };
        pptSlide.addText(slide.title.toUpperCase(), { 
          x: '10%', y: '40%', w: '80%', h: '20%', 
          fontSize: 34, bold: true, color: 'FFFFFF', align: 'center' 
        });
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'qa':
        pptSlide.background = { color: '0F172A' };
        pptSlide.addText('DEFENSE QUESTIONS & MODEL ANSWERS', { 
          x: '8%', y: '8%', w: '84%', h: '12%', 
          fontSize: 22, bold: true, color: 'FFFFFF' 
        });
        if (slide.qaList && Array.isArray(slide.qaList)) {
          let yPos = 22;
          slide.qaList.forEach((qa, i) => {
            pptSlide.addText(`Q${i + 1}: ${qa.question}`, { 
              x: '8%', y: `${yPos}%`, w: '84%', h: '6%', 
              fontSize: 12, bold: true, color: accentColor 
            });
            pptSlide.addText(`A: ${qa.answer}`, { 
              x: '8%', y: `${yPos + 6}%`, w: '84%', h: '10%', 
              fontSize: 10, color: 'CBD5E1' 
            });
            yPos += 18;
          });
        }
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'conclusion':
        pptSlide.background = { color: primaryColor };
        pptSlide.addText(slide.title, { 
          x: '8%', y: '10%', w: '84%', h: '12%', 
          fontSize: 26, bold: true, color: 'FFFFFF' 
        });
        if (slide.bullets && slide.bullets.length > 0) {
          const concBullets = slide.bullets.slice(0, 3).map(text => ({
            text,
            options: { bullet: { type: 'star' }, paraSpaceBefore: 8, indent: 20 }
          }));
          pptSlide.addText(concBullets, { 
            x: '10%', y: '26%', w: '80%', h: '62%', 
            fontSize: 13, color: 'EEEEEE', valign: 'top', lineSpacing: 20 
          });
        }
        pptSlide.addShape('rect', { x: 0, y: '96%', w: '100%', h: '4%', fill: { color: accentColor } });
        break;

      case 'content':
      default:
        pptSlide.background = { color: 'FFFFFF' };
        pptSlide.addText(slide.title, { 
          x: '8%', y: '8%', w: '84%', h: '12%', 
          fontSize: 22, bold: true, color: primaryColor 
        });
        
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletObjects = slide.bullets.slice(0, 4).map(text => ({
            text,
            options: { bullet: true, paraSpaceBefore: 6, indent: 18 }
          }));

          if (slide.imageData) {
            // Split layout with Real Image
            pptSlide.addText(bulletObjects, { 
              x: '8%', y: '22%', w: '44%', h: '66%', 
              fontSize: 12, color: '334155', valign: 'top', lineSpacing: 18 
            });
            try {
              pptSlide.addImage({ data: slide.imageData, x: '55%', y: '22%', w: '38%', h: '62%' });
            } catch (err) {
              console.warn('Failed to embed slide image:', err);
            }
          } else {
            // Full width layout
            pptSlide.addText(bulletObjects, { 
              x: '8%', y: '22%', w: '84%', h: '66%', 
              fontSize: 13, color: '334155', valign: 'top', lineSpacing: 20 
            });
          }
        }
        pptSlide.addShape('rect', { x: 0, y: '97%', w: '100%', h: '3%', fill: { color: accentColor } });
        break;
    }
  });

  await pptx.writeFile({ fileName: filename });
}

// --- Preview Component ---
const SlideRenderer = ({ slide, template }) => {
  if (!slide) return <div className="w-full h-full bg-slate-900" />;
  const commonStyles = { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif' };

  switch (slide.type) {
    case 'title':
      return (
        <div style={{ ...commonStyles, backgroundColor: template.primaryColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', marginBottom: '1rem', lineHeight: 1.2 }}>{slide.title}</h1>
          <p style={{ fontSize: '1.1rem', color: template.accentColor, fontWeight: '600' }}>{slide.subtitle}</p>
          <div style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
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
          <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>{slide.title}</h2>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4%', background: template.accentColor }} />
        </div>
      );
    case 'qa':
      return (
        <div style={{ ...commonStyles, backgroundColor: '#0f172a', padding: '6%', color: 'white', overflowY: 'auto' }}>
          <div style={{ width: '40px', height: '4px', background: template.accentColor, marginBottom: '0.8rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white', marginBottom: '1rem', textTransform: 'uppercase' }}>
            {slide.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {slide.qaList?.map((qa, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '800', color: template.accentColor, marginBottom: '4px' }}>
                  Q{i + 1}: {qa.question}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '500', lineHeight: '1.4' }}>
                  A: {qa.answer}
                </p>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: template.accentColor }} />
        </div>
      );
    case 'conclusion':
      return (
        <div style={{ ...commonStyles, backgroundColor: template.primaryColor, padding: '6% 8%', color: 'white', overflow: 'hidden' }}>
          <div style={{ width: '40px', height: '4px', background: template.accentColor, marginBottom: '0.8rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white', marginBottom: '1.2rem', lineHeight: 1.25 }}>{slide.title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {slide.bullets?.slice(0, 3).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.4', fontWeight: '500' }}>
                <span style={{ color: template.accentColor, flexShrink: 0 }}>★</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: template.accentColor }} />
        </div>
      );
    default:
      return (
        <div style={{ ...commonStyles, backgroundColor: 'white', padding: '6% 7%', overflow: 'hidden' }}>
          <div style={{ width: '40px', height: '4px', background: template.accentColor, marginBottom: '0.6rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: template.primaryColor, marginBottom: '1.2rem', lineHeight: 1.25 }}>{slide.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: slide.imageData ? '1.1fr 0.9fr' : '1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {slide.bullets?.slice(0, 4).map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.38', fontWeight: '500' }}>
                  <span style={{ color: template.accentColor, flexShrink: 0 }}>•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
            {slide.imageData && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', height: '210px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <img src={slide.imageData} className="w-full h-full object-cover" alt="Slide Visual" />
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: template.accentColor }} />
        </div>
      );
  }
};

// --- Main PresentationModal Component ---
export default function PresentationModal({ 
  isOpen, 
  onClose, 
  chapters = [], 
  projectId, 
  userId, 
  setIsGlobalLoading, 
  setGlobalLoadingText, 
  showNotification, 
  images = [] 
}) {
  const [step, setStep] = useState('config'); // 'config' | 'images' | 'preview'
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [slideCountRange, setSlideCountRange] = useState('10-15');
  const [includeQA, setIncludeQA] = useState(false);
  const [slides, setSlides] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(SLIDE_TEMPLATES[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const READY_THRESHOLD = 200;

  const LENGTH_TIERS = [
    { id: '5-8', label: 'Brief / Express', count: '5-8 Slides', desc: 'Fast Pitch & Overview' },
    { id: '10-15', label: 'Academic Defense', count: '10-15 Slides', desc: 'Standard Project Defense (Recommended)' },
    { id: '15-20', label: 'Comprehensive', count: '15-20 Slides', desc: 'Deep Technical Evaluation' },
    { id: '20-25', label: 'Full Thesis', count: '20-25 Slides', desc: 'Exhaustive Project Presentation' },
  ];

  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setSlides([]);
      setCurrentIndex(0);
      // Auto-select all chapters that have content
      const readyChapters = chapters
        .filter(ch => ch.content && ch.content.trim().length >= READY_THRESHOLD)
        .map(ch => ch.number || ch.chapter);
      setSelectedChapters(readyChapters);
      setSelectedImageIds([]);
    }
  }, [isOpen, chapters]);

  const toggleChapter = (num) => {
    const chapter = chapters.find(ch => (ch.number || ch.chapter) === num);
    if (!chapter || !chapter.content || chapter.content.trim().length < READY_THRESHOLD) {
      showNotification('Chapter Not Ready', `Chapter ${num} has insufficient content to build slides.`, 'warning');
      return;
    }
    setSelectedChapters(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b));
  };

  const handleGenerate = async () => {
    if (selectedChapters.length === 0) {
      showNotification('Select Chapters', 'Please select at least one chapter.', 'warning');
      return;
    }

    setIsGenerating(true);
    setGlobalLoadingText('AI Architect is compiling technical presentation slides...');
    setIsGlobalLoading(true);

    try {
      // 1. Preload base64 for selected images
      const selectedImgs = images.filter(img => selectedImageIds.includes(img.id));
      const imageMap = {};
      for (const img of selectedImgs) {
        const b64 = await fetchImageAsBase64(img.file_url || img.src);
        if (b64) imageMap[img.id] = b64;
      }

      // 2. Request slide structure from API
      const response = await fetch('/api/premium/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          userId, 
          selectedChapterNumbers: selectedChapters,
          slideCountRange,
          includeQA,
          images: selectedImgs.map(i => ({ id: i.id, name: i.name, caption: i.caption }))
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Slide generation failed');

      // 3. Process returned slide data and assign real images with strict count enforcement
      const targetCount = data.targetTotalSlides || parseInt(String(slideCountRange).split('-')[1] || String(slideCountRange).split('-')[0], 10) || 15;
      const processed = processSlideData(data.data, selectedImageIds, imageMap, targetCount);
      setSlides(processed);
      setStep('preview');
      setCurrentIndex(0);
      showNotification('Presentation Ready', `Generated ${processed.length} professional presentation slides!`, 'success');
    } catch (err) {
      showNotification('Error', err.message || 'Failed to generate presentation.', 'error');
    } finally {
      setIsGenerating(false);
      setIsGlobalLoading(false);
    }
  };

  const processSlideData = (data, imageIds, imageMap, targetTotalSlides = 15) => {
    let slideList = [];
    let counter = 1;
    let imagePointer = 0;

    // Title Slide
    slideList.push({
      id: String(counter++),
      type: 'title',
      title: data.title || 'Project Presentation',
      subtitle: data.subtitle || '',
      author: data.author || 'Author',
      institution: data.institution || ''
    });

    // Content Sections
    if (data.sections && Array.isArray(data.sections)) {
      data.sections.forEach((sec) => {
        // Include separate section break slide ONLY if large presentation budget (>= 18 slides)
        if (targetTotalSlides >= 18) {
          slideList.push({
            id: String(counter++),
            type: 'section',
            title: sec.title || 'Section Overview'
          });
        }

        // If backend returned modern 'slides' array
        if (sec.slides && Array.isArray(sec.slides) && sec.slides.length > 0) {
          sec.slides.forEach((s) => {
            const slide = {
              id: String(counter++),
              type: 'content',
              title: s.title || sec.title,
              bullets: (s.bullets || []).slice(0, 4)
            };
            
            // Assign image if matched by backend or fallback to next available selected image
            const targetImgId = s.imageDbId || (imagePointer < imageIds.length ? imageIds[imagePointer++] : null);
            if (targetImgId && imageMap[targetImgId]) {
              slide.imageData = imageMap[targetImgId];
            }
            slideList.push(slide);
          });
        } 
        // Fallback if backend returned raw bullets array
        else if (sec.bullets && Array.isArray(sec.bullets)) {
          const chunked = [];
          for (let i = 0; i < sec.bullets.length; i += 4) {
            chunked.push(sec.bullets.slice(i, i + 4));
          }
          chunked.forEach((chunk) => {
            const slide = {
              id: String(counter++),
              type: 'content',
              title: sec.title,
              bullets: chunk.slice(0, 4)
            };
            if (imagePointer < imageIds.length) {
              const targetImgId = imageIds[imagePointer++];
              if (imageMap[targetImgId]) slide.imageData = imageMap[targetImgId];
            }
            slideList.push(slide);
          });
        }
      });
    }

    // Conclusion Slide
    if (data.conclusion) {
      slideList.push({
        id: String(counter++),
        type: 'conclusion',
        title: data.conclusion.title || 'Synthesis & Next Steps',
        bullets: (data.conclusion.bullets || []).slice(0, 3)
      });
    }

    // Defense Q&A Slide
    if (data.defenseQA && Array.isArray(data.defenseQA) && data.defenseQA.length > 0) {
      slideList.push({
        id: String(counter++),
        type: 'qa',
        title: 'ANTICIPATED DEFENSE QUESTIONS & ANSWERS',
        qaList: data.defenseQA.slice(0, 4)
      });
    }

    // Programmatic Clamping: Ensure total slides strictly never exceed targetTotalSlides
    if (targetTotalSlides && slideList.length > targetTotalSlides) {
      const titleSlide = slideList.find(s => s.type === 'title');
      const conclusionSlide = slideList.find(s => s.type === 'conclusion');
      const qaSlide = slideList.find(s => s.type === 'qa');
      
      const middleSlides = slideList.filter(s => s !== titleSlide && s !== conclusionSlide && s !== qaSlide);
      const specialCount = (titleSlide ? 1 : 0) + (conclusionSlide ? 1 : 0) + (qaSlide ? 1 : 0);
      const maxMiddle = Math.max(1, targetTotalSlides - specialCount);

      slideList = [
        ...(titleSlide ? [titleSlide] : []),
        ...middleSlides.slice(0, maxMiddle),
        ...(conclusionSlide ? [conclusionSlide] : []),
        ...(qaSlide ? [qaSlide] : [])
      ];
    }

    return slideList.map((s, idx) => ({ ...s, id: String(idx + 1) }));
  };

  const handleDownload = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      const filename = `${(slides[0]?.title || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`;
      await exportSlidesToPPTX(slides, selectedTemplate, filename);
      showNotification('Success', 'PowerPoint presentation downloaded successfully!', 'success');
    } catch (err) {
      showNotification('Export Error', 'Failed to generate PPTX file: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 lg:p-10">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="relative bg-white rounded-none md:rounded-[40px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-full max-h-[920px] border border-slate-200"
      >
        {/* Modal Top Header */}
        <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Icons.Monitor />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">PowerPoint Deck Builder</h2>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-full tracking-widest">Premium</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Generate Defense-Ready Slides with Real Project Diagrams</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <Icons.X />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Main Content Workspace */}
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar p-6 md:p-10">
            
            {/* Step 1: Config (Chapters, Slide Length, Defense QA) */}
            {step === 'config' && (
              <div className="w-full max-w-2xl mx-auto space-y-8 my-auto animate-in fade-in duration-300">
                <div className="text-center">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Presentation Configuration</h3>
                  <p className="text-slate-500 font-medium text-sm mt-1">Configure your slide count and choose which chapters to include.</p>
                </div>

                {/* Slide Count Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Icons.Layers /> Desired Slide Count:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LENGTH_TIERS.map((tier) => {
                      const isSelected = slideCountRange === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSlideCountRange(tier.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                            isSelected 
                              ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900/10' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black uppercase text-slate-900">{tier.label}</span>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                              {tier.count}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium m-0">{tier.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Defense Q&A Option */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Icons.HelpCircle />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Include Defense Q&A Section</h4>
                      <p className="text-[11px] text-slate-500 font-medium m-0">Generate likely examiner questions and prepared answers</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeQA}
                    onChange={(e) => setIncludeQA(e.target.checked)}
                    className="w-5 h-5 accent-slate-900 cursor-pointer rounded"
                  />
                </div>

                {/* Chapter Basis Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Select Project Chapters:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {chapters.map(ch => {
                      const num = ch.number || ch.chapter;
                      const hasContent = ch.content && ch.content.trim().length >= READY_THRESHOLD;
                      const isSelected = selectedChapters.includes(num);
                      return (
                        <button
                          key={ch.id || num}
                          type="button"
                          disabled={!hasContent}
                          onClick={() => toggleChapter(num)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                            isSelected 
                              ? 'border-slate-900 bg-white shadow-md' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          } ${!hasContent ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex-1 pr-2 truncate">
                            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                              Chapter {num}
                            </span>
                            <h5 className="text-xs font-black text-slate-900 truncate mt-0.5 m-0">
                              {ch.title || `Chapter ${num}`}
                            </h5>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                              <Icons.Check />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setStep('images')}
                    disabled={selectedChapters.length === 0}
                    className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Next: Embed Project Images ({images.length} available) <Icons.ChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Images Selection */}
            {step === 'images' && (
              <div className="w-full max-w-3xl mx-auto space-y-8 my-auto animate-in fade-in duration-300">
                <div className="text-center">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Select Project Diagrams & Figures</h3>
                  <p className="text-slate-500 font-medium text-sm mt-1">
                    Select images from your project gallery to embed directly into your slides.
                  </p>
                </div>

                {images.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
                    <Icons.Image style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
                    <p className="text-sm font-bold text-slate-600">No project images uploaded yet.</p>
                    <p className="text-xs text-slate-400 mt-1">You can still generate text and data slides now, or upload images via the Assets tab later.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[45vh] overflow-y-auto custom-scrollbar p-2">
                    {images.map(img => {
                      const isSelected = selectedImageIds.includes(img.id);
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setSelectedImageIds(prev => 
                            prev.includes(img.id) ? prev.filter(i => i !== img.id) : [...prev, img.id]
                          )}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all text-left group ${
                            isSelected 
                              ? 'border-slate-900 scale-95 shadow-xl' 
                              : 'border-white shadow-sm opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.file_url || img.src} alt={img.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                            <p className="text-[10px] font-bold truncate">{img.caption || img.original_name || img.name || 'Diagram'}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-md">
                              <Icons.Check />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setStep('config')}
                    className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Icons.Sparkles /> Build {slideCountRange} Slides Presentation
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Interactive Slide Preview */}
            {step === 'preview' && (
              <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-300">
                {/* Slide Viewport */}
                <div className="w-full max-w-[840px] aspect-video rounded-3xl shadow-2xl overflow-hidden relative group border-8 border-white bg-white">
                  <SlideRenderer slide={slides[currentIndex]} template={selectedTemplate} />
                  
                  {/* Navigation Arrows */}
                  <button 
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} 
                    disabled={currentIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                  >
                    <Icons.ChevronLeft />
                  </button>
                  <button 
                    onClick={() => setCurrentIndex(p => Math.min(slides.length - 1, p + 1))} 
                    disabled={currentIndex === slides.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                  >
                    <Icons.ChevronRight />
                  </button>

                  <div className="absolute bottom-3 right-4 px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    Slide {currentIndex + 1} of {slides.length}
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="mt-8 flex flex-col items-center gap-4">
                  {/* Dot Indicators */}
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-lg">
                    {slides.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentIndex(i)} 
                        className={`h-2 rounded-full transition-all ${
                          i === currentIndex ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`} 
                      />
                    ))}
                  </div>

                  <button 
                    onClick={() => setStep('config')} 
                    className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                  >
                    ← Reconfigure Settings & Slides
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar: Theme & Actions */}
          <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col shrink-0 p-6 md:p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Color Palette & Theme
              </h4>
              <div className="space-y-3">
                {SLIDE_TEMPLATES.map(t => {
                  const isSelected = selectedTemplate.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t)}
                      className={`w-full relative p-4 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                        isSelected 
                          ? 'border-slate-900 shadow-md ring-2 ring-slate-900/10' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: t.primaryColor }} />
                        <div className="flex-1">
                          <div className="font-black text-slate-900 text-xs uppercase">{t.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{t.theme} Theme</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Export Action */}
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={handleDownload}
                disabled={step !== 'preview' || isExporting || slides.length === 0}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-95"
              >
                {isExporting ? <Icons.RefreshCw /> : <Icons.Download />}
                {isExporting ? 'Generating PPTX...' : 'Download PPTX File'}
              </button>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider mt-2">
                Compatible with Microsoft PowerPoint & Google Slides
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
