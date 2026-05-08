"use client";
import { useState, useRef, useEffect } from 'react';
import { 
  Monitor, RefreshCw, ChevronLeft, ChevronRight, Sparkles, Download, ListTree, FileText, Plus, X, MessageSquare, Hash, Upload, BookOpen, Palette, Layers, Search
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { SLIDE_TEMPLATES } from '@/lib/slideTemplates';
import pptxgen from "pptxgenjs";
import { toast } from 'sonner';

// --- Slide Preview Component ---
const SlideRenderer = ({ slide, template }) => {
    if (!slide) return <div className="w-full h-full bg-slate-900" />;
    const commonStyles = { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif' };
  
    switch (slide.type) {
      case 'title':
        return (
          <div style={{ ...commonStyles, backgroundColor: template.primaryColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10%', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', marginBottom: '1rem', lineHeight: '1.2' }}>{slide.title}</h1>
            <p style={{ fontSize: '1rem', color: template.accentColor, fontWeight: '600' }}>{slide.subtitle}</p>
            <div style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
              <p>By: {slide.author}</p>
              <p>{slide.institution}</p>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4%', background: template.accentColor }} />
          </div>
        );
      case 'section':
        return (
          <div style={{ ...commonStyles, backgroundColor: template.secondaryColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10%', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>{slide.title}</h2>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4%', background: template.accentColor }} />
          </div>
        );
      default:
        return (
          <div style={{ ...commonStyles, backgroundColor: 'white', padding: '8%' }}>
            <div style={{ width: '40px', height: '4px', background: template.accentColor, marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: template.primaryColor, marginBottom: '1.5rem' }}>{slide.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: slide.imageData ? '1fr 1fr' : '1fr', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {slide.bullets?.slice(0, 5).map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', fontWeight: '500' }}>
                    <span style={{ color: template.accentColor }}>•</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              {slide.imageData && (
                <div style={{ borderRadius: '16px', overflow: 'hidden', height: '200px' }}>
                  <img src={slide.imageData} className="w-full h-full object-cover" alt="" />
                </div>
              )}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: template.accentColor }} />
          </div>
        );
    }
};

export default function SlideGenerator({ 
  isProcessing, 
  setIsProcessing, 
  hasPaid, 
  setHasPaid, 
  setShowPaymentDialog,
  setPendingIterative,
  pendingIterative
}) {
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(SLIDE_TEMPLATES[0]);
  const [uploadedImages, setUploadedImages] = useState([]); 
  const [generatedSlides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [customOutline, setCustomOutline] = useState(['Introduction', 'Background', 'Methodology', 'Results', 'Conclusion']);
  const [newOutlineItem, setNewOutlineItem] = useState('');
  const [slideCountRange, setSlideCountRange] = useState('12-18');
  const fileInputRef = useRef(null);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const MAX_WORDS = 10000;
  const isOverLimit = wordCount > MAX_WORDS;

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && (input.trim() || pendingIterative)) {
      handleProcess(pendingIterative, true);
    }
  }, [hasPaid]);

  const handleAddOutline = () => {
    if (newOutlineItem.trim()) {
        setCustomOutline([...customOutline, newOutlineItem.trim()]);
        setNewOutlineItem('');
    }
  };

  const removeOutline = (index) => {
    setCustomOutline(customOutline.filter((_, i) => i !== index));
  };

  const processSlidesWithImages = (data) => {
    const slideList = [];
    slideList.push({ type: 'title', title: data.title, subtitle: data.subtitle, author: data.author, institution: data.institution });
    data.sections.forEach((sec) => {
      slideList.push({ type: 'section', title: sec.title });
      sec.slides.forEach((s) => {
        const slide = { type: 'content', title: s.title, bullets: s.bullets };
        if (s.imageCaption) {
          const img = uploadedImages.find(i => i.caption && i.caption.trim().toLowerCase() === s.imageCaption.toLowerCase());
          if (img) slide.imageData = img.data;
        }
        slideList.push(slide);
      });
    });
    if (data.conclusion) slideList.push({ type: 'conclusion', title: data.conclusion.title, bullets: data.conclusion.bullets });
    return slideList;
  };

  const handleProcess = async (isIterative = false, skipPaymentCheck = false) => {
    if (!input.trim() && !isIterative) {
      toast.error('Please enter some text to process');
      return;
    }

    if (isOverLimit) {
        toast.error(`Exceeded maximum limit of ${MAX_WORDS} words.`);
        return;
    }

    if (!hasPaid && !skipPaymentCheck) {
      setPendingIterative(isIterative);
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/marketplace/tools/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: input, 
          prompt: isIterative ? refinementPrompt : prompt,
          images: uploadedImages.map(img => ({ id: img.id, caption: img.caption })),
          currentSlides: isIterative ? generatedSlides : null,
          customOutline,
          slideCountRange
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const processed = processSlidesWithImages(data.data);
      setSlides(processed);
      setCurrentIndex(0);
      setRefinementPrompt('');
      toast.success('Ready!');
      setHasPaid(false);
    } catch (err) {
      toast.error(err.message || 'Processing failed');
      setHasPaid(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    if (uploadedImages.length + files.length > 5) {
        toast.error("Maximum 5 images allowed.");
        return;
    }
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, { id: Date.now() + Math.random(), data: reader.result, caption: '' }]);
        toast.info("Image added. Please provide a caption.");
      };
      reader.readAsDataURL(file);
    });
  };

  const updateImageCaption = (id, caption) => {
    setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, caption } : img));
  };

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDownloadPPTX = async () => {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    const template = selectedTemplate;
    const primaryColor = template.primaryColor.replace('#', '');
    const secondaryColor = template.secondaryColor.replace('#', '');
    const accentColor = template.accentColor.replace('#', '');

    generatedSlides.forEach((slide) => {
      const pptSlide = pptx.addSlide();
      switch (slide.type) {
        case 'title':
          pptSlide.background = { color: primaryColor };
          pptSlide.addText(slide.title.toUpperCase(), { x: '10%', y: '30%', w: '80%', h: '20%', fontSize: 32, bold: true, color: 'FFFFFF', align: 'center' });
          if (slide.subtitle) pptSlide.addText(slide.subtitle, { x: '10%', y: '50%', w: '80%', h: '10%', fontSize: 18, color: accentColor, align: 'center', italic: true });
          pptSlide.addText(`By: ${slide.author}\n${slide.institution}`, { x: '10%', y: '70%', w: '80%', h: '15%', fontSize: 14, color: 'CCCCCC', align: 'center' });
          break;
        case 'section':
          pptSlide.background = { color: secondaryColor };
          pptSlide.addText(slide.title.toUpperCase(), { x: '10%', y: '40%', w: '80%', h: '20%', fontSize: 36, bold: true, color: 'FFFFFF', align: 'center' });
          break;
        case 'content':
        case 'conclusion':
          pptSlide.background = { color: slide.type === 'conclusion' ? primaryColor : 'FFFFFF' };
          const textColor = slide.type === 'conclusion' ? 'FFFFFF' : '334155';
          const headingColor = slide.type === 'conclusion' ? 'FFFFFF' : primaryColor;
          pptSlide.addText(slide.title, { x: '8%', y: '8%', w: '84%', h: '12%', fontSize: 24, bold: true, color: headingColor });
          if (slide.bullets) {
            const bulletObjs = slide.bullets.map(text => ({ text, options: { bullet: true, paraSpaceBefore: 8, indent: 20 } }));
            if (slide.imageData) {
              pptSlide.addText(bulletObjs, { x: '8%', y: '22%', w: '42%', h: '65%', fontSize: 13, color: textColor, valign: 'top' });
              pptSlide.addImage({ data: slide.imageData, x: '55%', y: '22%', w: '38%', h: '60%' });
            } else {
              pptSlide.addText(bulletObjs, { x: '8%', y: '22%', w: '84%', h: '65%', fontSize: 14, color: textColor, valign: 'top' });
            }
          }
          break;
      }
    });
    await pptx.writeFile({ fileName: `${generatedSlides[0]?.title || 'Presentation'}.pptx` });
  };

  if (generatedSlides.length > 0) {
    return (
      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
              <div className="flex-1 min-w-0">
                  <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[48px] shadow-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-6 md:mb-8 text-zinc-900">
                          <div className="min-w-0">
                              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight truncate">Technical Preview</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Slide {currentIndex + 1} of {generatedSlides.length}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                              <button onClick={() => setCurrentIndex(p => Math.max(0, p-1))} className="p-2.5 md:p-3 bg-zinc-900/5 hover:bg-zinc-900 hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /></button>
                              <button onClick={() => setCurrentIndex(p => Math.min(generatedSlides.length-1, p+1))} className="p-2.5 md:p-3 bg-zinc-900/5 hover:bg-zinc-900 hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm"><ChevronRight className="w-4 h-4 md:w-5 md:h-5" /></button>
                          </div>
                      </div>
                      <div className="aspect-video rounded-[20px] md:rounded-[32px] overflow-hidden shadow-inner border border-slate-100 bg-slate-50">
                          <SlideRenderer slide={generatedSlides[currentIndex]} template={selectedTemplate} />
                      </div>
                      <div className="mt-6 md:mt-8 flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                          {generatedSlides.map((_, i) => (
                              <button key={i} onClick={() => setCurrentIndex(i)} className={`h-1.5 md:h-2 rounded-full transition-all flex-shrink-0 ${i === currentIndex ? 'w-10 md:w-12 bg-zinc-900' : 'w-1.5 md:w-2 bg-slate-200'}`} />
                          ))}
                      </div>
                  </div>
              </div>

              <div className="lg:w-96 space-y-6 md:space-y-8">
                  <div className="bg-zinc-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-2xl">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Remodification Suite</h4>
                      <div className="space-y-4">
                          <Textarea value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} placeholder="E.g. Add more detail..." className="bg-white/5 border-white/10 rounded-xl md:rounded-2xl min-h-[100px] md:min-h-[120px] text-sm focus:border-white/20 focus:ring-0 placeholder:text-zinc-600 text-white font-medium" />
                          <Button onClick={() => handleProcess(true)} disabled={isProcessing || !refinementPrompt.trim()} className="w-full bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl md:rounded-2xl py-5 md:py-6 font-black uppercase text-[9px] md:text-[10px] tracking-widest flex items-center justify-center gap-2">
                              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                              Refine Structure (₦500)
                          </Button>
                      </div>
                  </div>
                  <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-xl">
                      <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6">Export Package</h4>
                      <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 mb-6">
                              {SLIDE_TEMPLATES.map(t => (
                                  <button key={t.id} onClick={() => setSelectedTemplate(t)} className={`aspect-square rounded-lg md:rounded-xl transition-all border-2 flex items-center justify-center relative overflow-hidden ${selectedTemplate.id === t.id ? 'border-zinc-900 scale-105' : 'border-slate-50'}`} title={t.name}>
                                      <div className="absolute inset-0 opacity-20" style={{ backgroundColor: t.primaryColor }} /><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm" style={{ backgroundColor: t.accentColor }} />
                                  </button>
                              ))}
                          </div>
                          <Button onClick={handleDownloadPPTX} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl py-6 md:py-8 font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-lg flex items-center justify-center gap-2 md:gap-3"><Download className="w-4 h-4 md:w-5 md:h-5" /> Download PPTX</Button>
                          <button onClick={() => { setSlides([]); setInput(''); }} className="w-full text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-red-500 transition-colors">Create New Project</button>                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className={`grid lg:grid-cols-3 gap-8 md:gap-12 animate-in fade-in duration-700`}>
        <div className={'lg:col-span-2 space-y-8 md:space-y-10'}>
        
        {/* Slide Structure / Outline */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"><ListTree className="w-5 h-5 md:w-6 md:h-6" /></div>
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Presentation Outline</h2>
                        <p className="text-[10px] md:text-sm text-slate-500 font-medium">Define your required slide sequence</p>
                    </div>
                </div>
                <Badge className="w-fit bg-zinc-100 text-zinc-900 border-none px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[9px] md:text-[10px] uppercase">{customOutline.length} SECTIONS</Badge>
            </div>

            <div className="space-y-2 md:space-y-3 mb-6">
                {customOutline.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 group">
                        <div className="flex items-center gap-3 md:gap-4">
                            <span className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-600 shadow-sm border border-slate-100 shrink-0">{idx + 1}</span>
                            <span className="font-bold text-zinc-900 uppercase text-[10px] md:text-xs tracking-tight">{item}</span>
                        </div>
                        <button onClick={() => removeOutline(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 md:gap-3">
                <Input 
                    value={newOutlineItem}
                    onChange={(e) => setNewOutlineItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOutline()}
                    placeholder="Add heading..."
                    className="bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl h-12 md:h-14 px-4 md:px-6 font-bold text-sm md:text-base text-zinc-900 focus:border-black transition-all"
                />
                <Button onClick={handleAddOutline} className="h-12 w-12 md:h-14 md:w-14 bg-zinc-900 text-white rounded-xl md:rounded-2xl p-0 shrink-0 shadow-lg hover:bg-black active:scale-90 transition-all">
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
            </div>
        </div>

        {/* Context Input */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col h-[500px] md:h-[600px]">
            <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"><FileText className="w-5 h-5 md:w-6 md:h-6" /></div>
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Content Core</h2>
                        <p className="text-[10px] md:text-sm text-slate-500 font-medium">Research text</p>
                    </div>
                </div>
                <Badge variant="outline" className={`rounded-full px-3 md:px-4 py-1 md:py-1.5 font-black text-[9px] md:text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-600'}`}>
                    {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
                </Badge>
            </div>
            <Textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                className={`flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border-[#e5e7eb] rounded-[24px] md:rounded-[32px] p-6 md:p-8 focus:border-black focus:ring-0 text-zinc-900 leading-relaxed font-bold resize-none text-sm md:text-base`} 
                placeholder="Enter project content here..." 
            />
        </div>

        {/* Instructions */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5 md:w-6 md:h-6" /></div>
                <div>
                    <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Strategic Directives</h2>
                    <p className="text-[10px] md:text-sm text-slate-500 font-medium">Style instructions</p>
                </div>
            </div>
            <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="E.g. Focus on mathematical models..." className="h-14 md:h-16 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-6 font-black text-xs md:text-sm text-zinc-900 focus:border-black transition-all placeholder:text-slate-400" />
        </div>
        </div>

        {/* Sidebar Configuration */}
        <div className="space-y-6 md:space-y-8">
            {/* Length Selector */}
            <div className="bg-white border border-slate-200 rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Slide Count Range</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {['8-12', '12-18', '18-25', '25-35'].map(range => (
                        <button
                            key={range}
                            onClick={() => setSlideCountRange(range)}
                            className={`py-2.5 md:py-3 rounded-lg md:rounded-xl border-2 font-black text-[10px] md:text-xs transition-all ${slideCountRange === range ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                        >
                            {range} SLIDES
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm">
                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 md:mb-8">Technical Visuals</h3>
                <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-100 rounded-[20px] md:rounded-[28px] p-6 md:p-8 flex flex-col items-center justify-center gap-3 md:gap-4 cursor-pointer hover:border-zinc-900 hover:bg-slate-50 transition-all group">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Upload className="w-5 h-5 md:w-6 md:h-6 text-slate-400" /></div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600">Add Figures (Max 5)</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />
                <div className="mt-6 md:mt-8 space-y-3 md:space-y-4 max-h-[250px] md:max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {uploadedImages.map(img => (
                        <div key={img.id} className="bg-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 flex gap-3 md:gap-4 border border-slate-100 relative group">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border border-white shadow-sm"><img src={img.data} className="w-full h-full object-cover" alt="" /></div>
                            <div className="flex-1 min-w-0">
                                <input autoFocus={!img.caption} value={img.caption} onChange={(e) => updateImageCaption(img.id, e.target.value)} placeholder="Caption..." className="w-full bg-transparent border-none p-0 text-[10px] md:text-xs font-black uppercase tracking-tighter focus:ring-0 placeholder:text-red-400 text-zinc-900" />
                                <p className="text-[8px] md:text-[9px] text-zinc-600 font-bold mt-1 uppercase">Required Key</p>
                            </div>
                            <button onClick={() => removeImage(img.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900 rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl">
                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 md:mb-8">Design Language</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {SLIDE_TEMPLATES.map(t => {
                        const ThemeIcon = t.id === 'academic' ? BookOpen : t.id === 'modern' ? Monitor : t.id === 'sunset' ? Palette : t.id === 'forest' ? Layers : t.id === 'royal' ? Sparkles : Search;
                        return (
                            <button key={t.id} onClick={() => setSelectedTemplate(t)} className={`p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${selectedTemplate.id === t.id ? 'border-white shadow-lg scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: t.primaryColor }} />
                                <div className="relative z-10">
                                    <ThemeIcon className={`w-4 h-4 md:w-5 md:h-5 mb-2 md:mb-3 ${selectedTemplate.id === t.id ? 'text-white' : 'text-zinc-500'}`} />
                                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-tighter ${selectedTemplate.id === t.id ? 'text-white' : 'text-zinc-500'}`}>{t.name}</p>
                                    <div className="mt-2 w-full h-1 rounded-full overflow-hidden flex"><div className="h-full w-1/3" style={{ backgroundColor: t.primaryColor }} /><div className="h-full w-1/3" style={{ backgroundColor: t.secondaryColor }} /><div className="h-full w-1/3" style={{ backgroundColor: t.accentColor }} /></div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <Button onClick={() => handleProcess()} disabled={isProcessing || !input.trim() || isOverLimit} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] md:rounded-[32px] py-8 md:py-10 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-4 h-16 md:h-20">
                {isProcessing ? <RefreshCw className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Monitor className="w-5 h-5 md:w-6 md:h-6" />}
                {isProcessing ? 'Architecting...' : `Build Presentation (₦500)`}
            </Button>
        </div>
    </div>
  );
}
