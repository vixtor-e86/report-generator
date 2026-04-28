"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Presentation, BarChart3, Search, Lightbulb,
  SpellCheck, Quote, Image, Code2, RefreshCw as RefreshIcon,
  ClipboardCheck, Wallet, Sparkles, UserCheck, X, ChevronLeft, ChevronRight,
  Monitor, Palette, FileText, Type, Plus, Upload, MessageSquare, Layers
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { getToolById } from '@/data/marketplace/tools';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { SLIDE_TEMPLATES } from '@/lib/slideTemplates';
import pptxgen from "pptxgenjs";

const iconMap = {
  ShieldCheck,
  UserCheck,
  Presentation,
  BookOpen,
  Search,
  Lightbulb,
  BarChart3,
  SpellCheck,
  Quote,
  Image,
  Code2,
  RefreshCw: RefreshIcon,
};

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

export default function ToolInterfacePage() {
  const { id: toolId } = useParams();
  const navigate = useRouter();
  const { wallet, deductFunds, setShowFundingModal } = useWallet();

  const [tool, setTool] = useState(undefined);
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingIterative, setPendingIterative] = useState(false);

  // --- Slide Generator Specific States ---
  const [selectedTemplate, setSelectedTemplate] = useState(SLIDE_TEMPLATES[0]);
  const [uploadedImages, setUploadedImages] = useState([]); // [{id, data, caption}]
  const [generatedSlides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const fileInputRef = useRef(null);

  // Word count logic
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const MAX_WORDS = toolId === 'slide-generator' ? 10000 : 1500;
  const isOverLimit = wordCount > MAX_WORDS;

  useEffect(() => {
    if (toolId) {
      const found = getToolById(toolId);
      setTool(found);
    }
  }, [toolId]);

  const handleProcess = async (isIterative = false) => {
    if (!input.trim() && !isIterative) {
      toast.error('Please enter some text to process');
      return;
    }

    if (isOverLimit) {
        toast.error(`Exceeded maximum limit of ${MAX_WORDS} words.`);
        return;
    }

    // Always require payment for Humanizer or refinements
    if (!hasPaid) {
      setPendingIterative(isIterative);
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      if (toolId === 'ai-humanizer') {
        const response = await fetch('/api/marketplace/tools/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: input })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setOutput(data.result);
      } 
      else if (toolId === 'slide-generator') {
        const response = await fetch('/api/marketplace/tools/generate-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: input, 
            prompt: isIterative ? refinementPrompt : prompt,
            images: uploadedImages.map(img => ({ id: img.id, caption: img.caption })),
            currentSlides: isIterative ? generatedSlides : null
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        // Match images with placeholders
        const processed = processSlidesWithImages(data.data);
        setSlides(processed);
        setCurrentIndex(0);
        setRefinementPrompt('');
      }
      else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setOutput(`PROCESSED_RESULT_FOR_${toolId.toUpperCase()}`);
      }
      toast.success('Ready!');
      
      // RESET payment for next use
      setHasPaid(false);
      setPendingIterative(false);

    } catch (err) {
      toast.error(err.message || 'Processing failed');
      setHasPaid(false);
    } finally {
      setIsProcessing(false);
    }
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

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files) return;

    if (uploadedImages.length + files.length > 5) {
        toast.error("Maximum 5 images allowed for the Slide Generator.");
        return;
    }
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: reader.result,
          caption: ''
        }]);
        toast.info("Image added. Please provide a caption for the AI.");
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

  const handlePayment = async () => {
    if (!tool) return;
    if (wallet.balance < tool.pricePerUse) {
      toast.error('Insufficient balance.');
      return;
    }
    const label = pendingIterative ? `Refinement: ${tool.name}` : `Tool: ${tool.name}`;
    const success = await deductFunds(tool.pricePerUse, label);
    if (success) {
      setHasPaid(true);
      setShowPaymentDialog(false);
      toast.success('Payment successful!');
      handleProcess(pendingIterative);
    }
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

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied!');
  };

  if (!tool) return null;
  const Icon = iconMap[tool.icon] || Wrench;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate.back()} className="flex items-center gap-2 text-[#6b7280] hover:text-black transition-colors mb-6 text-xs font-black uppercase tracking-widest"><ArrowLeft className="w-4 h-4" />Back</button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-[24px] flex items-center justify-center">
                <Icon className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tight uppercase">{tool.name}</h1>
                <p className="text-[#6b7280] font-medium mt-1">{tool.description}</p>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-[24px] px-8 py-4 text-center text-white font-black text-2xl shadow-xl">{formatCurrency(tool.pricePerUse)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {generatedSlides.length > 0 ? (
          // --- PREVIEW MODE ---
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Slide Preview */}
                <div className="flex-1">
                    <div className="bg-white p-8 rounded-[48px] shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Technical Preview</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Slide {currentIndex + 1} of {generatedSlides.length}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentIndex(p => Math.max(0, p-1))} className="p-3 bg-zinc-900/5 hover:bg-zinc-900 hover:text-white rounded-2xl transition-all shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setCurrentIndex(p => Math.min(generatedSlides.length-1, p+1))} className="p-3 bg-zinc-900/5 hover:bg-zinc-900 hover:text-white rounded-2xl transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="aspect-video rounded-[32px] overflow-hidden shadow-inner border border-slate-100 bg-slate-50">
                            <SlideRenderer slide={generatedSlides[currentIndex]} template={selectedTemplate} />
                        </div>

                        <div className="mt-8 flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                            {generatedSlides.map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentIndex(i)}
                                    className={`h-2 rounded-full transition-all flex-shrink-0 ${i === currentIndex ? 'w-12 bg-zinc-900' : 'w-2 bg-slate-200'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Refinement & Download */}
                <div className="lg:w-96 space-y-8">
                    <div className="bg-zinc-900 p-8 rounded-[40px] text-white shadow-2xl">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Remodification Suite</h4>
                        <div className="space-y-4">
                            <Textarea 
                                value={refinementPrompt}
                                onChange={(e) => setRefinementPrompt(e.target.value)}
                                placeholder="E.g. Add more detail about the hardware, or make it more visual..."
                                className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] text-sm focus:border-white/20 focus:ring-0 placeholder:text-zinc-600 text-white font-medium"
                            />
                            <Button 
                                onClick={() => handleProcess(true)}
                                disabled={isProcessing || !refinementPrompt.trim()}
                                className="w-full bg-white text-zinc-900 hover:bg-zinc-100 rounded-2xl py-6 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Refine Structure (₦500)
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Export Package</h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {SLIDE_TEMPLATES.map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => setSelectedTemplate(t)}
                                        className={`aspect-square rounded-xl transition-all border-2 flex items-center justify-center relative overflow-hidden ${selectedTemplate.id === t.id ? 'border-zinc-900 scale-105' : 'border-slate-50'}`}
                                        title={t.name}
                                    >
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: t.primaryColor }} />
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: t.accentColor }} />
                                    </button>
                                ))}
                            </div>
                            <Button 
                                onClick={handleDownloadPPTX}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-8 font-black uppercase text-[11px] tracking-widest shadow-lg flex items-center justify-center gap-3"
                            >
                                <Download className="w-5 h-5" /> Download PowerPoint
                            </Button>
                            <button 
                                onClick={() => { setSlides([]); setInput(''); }}
                                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                            >
                                Create New Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          // --- INPUT MODE ---
          <div className="grid lg:grid-cols-3 gap-12 animate-in fade-in duration-700">
            <div className="lg:col-span-2 space-y-10">
              {/* Context Input */}
              <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[600px]">
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Content Core</h2>
                        <p className="text-sm text-slate-500 font-medium">Paste your research paper or technical documentation</p>
                    </div>
                    <Badge variant="outline" className={`rounded-full px-4 py-1.5 font-black text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-400'}`}>
                        {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} WORDS
                    </Badge>
                </div>
                <Textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    className={`flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border-[#e5e7eb] rounded-[32px] p-8 focus:border-black focus:ring-0 text-zinc-900 leading-relaxed font-bold resize-none ${isOverLimit ? 'border-red-300' : ''}`} 
                    placeholder="Enter project content here..." 
                />
              </div>

              {/* Instructions */}
              <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
                    <div>
                        <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Strategic Directives</h2>
                        <p className="text-sm text-slate-500 font-medium">Any specific goals or style instructions?</p>
                    </div>
                </div>
                <Input 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g. Focus on the mathematical models, or make it simplified for non-technical audience..."
                    className="h-16 bg-slate-50 border-slate-100 rounded-2xl px-6 font-black text-zinc-900 focus:border-black transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Sidebar Configuration */}
            <div className="space-y-8">
              {/* Image Matrix */}
              <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Technical Visuals</h3>
                
                <div 
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-slate-100 rounded-[28px] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-zinc-900 hover:bg-slate-50 transition-all group"
                >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Figures (Max 5)</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />

                <div className="mt-8 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {uploadedImages.map(img => (
                        <div key={img.id} className="bg-slate-50 rounded-2xl p-4 flex gap-4 border border-slate-100 relative group">
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white shadow-sm">
                                <img src={img.data} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <input 
                                    autoFocus={!img.caption}
                                    value={img.caption}
                                    onChange={(e) => updateImageCaption(img.id, e.target.value)}
                                    placeholder="Enter Caption..."
                                    className="w-full bg-transparent border-none p-0 text-xs font-black uppercase tracking-tighter focus:ring-0 placeholder:text-red-400 text-zinc-900"
                                />
                                <p className="text-[9px] text-zinc-400 font-bold mt-1">REQUIRED FOR AI PLACEMENT</p>
                            </div>
                            <button onClick={() => removeImage(img.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
              </div>

              {/* Template Select */}
              <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Design Language</h3>
                 <div className="grid grid-cols-2 gap-4">
                    {SLIDE_TEMPLATES.map(t => {
                        const ThemeIcon = t.id === 'academic' ? BookOpen : 
                                          t.id === 'modern' ? Monitor : 
                                          t.id === 'sunset' ? Palette :
                                          t.id === 'forest' ? Layers :
                                          t.id === 'royal' ? Sparkles : Search;
                        return (
                            <button 
                                key={t.id} 
                                onClick={() => setSelectedTemplate(t)}
                                className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${selectedTemplate.id === t.id ? 'border-white shadow-lg scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700'}`}
                            >
                                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: t.primaryColor }} />
                                <div className="relative z-10">
                                    <ThemeIcon className={`w-5 h-5 mb-3 ${selectedTemplate.id === t.id ? 'text-white' : 'text-zinc-500'}`} />
                                    <p className={`text-[9px] font-black uppercase tracking-tighter ${selectedTemplate.id === t.id ? 'text-white' : 'text-zinc-500'}`}>{t.name}</p>
                                    <div className="mt-2 w-full h-1 rounded-full overflow-hidden flex">
                                        <div className="h-full w-1/3" style={{ backgroundColor: t.primaryColor }} />
                                        <div className="h-full w-1/3" style={{ backgroundColor: t.secondaryColor }} />
                                        <div className="h-full w-1/3" style={{ backgroundColor: t.accentColor }} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                 </div>
              </div>

              <Button 
                onClick={() => handleProcess()}
                disabled={isProcessing || !input.trim() || isOverLimit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[32px] py-10 font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Monitor className="w-6 h-6" />}
                {isProcessing ? 'Architecting...' : `Build Presentation (${formatCurrency(tool.pricePerUse)})`}
              </Button>
            </div>
          </div>
        )}

        {/* AI Humanizer Output Section */}
        {toolId === 'ai-humanizer' && output && (
            <div className="mt-12 bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Humanized Result</h2>
                    <Button onClick={handleCopy} variant="outline" className="rounded-full px-6 border-[#e5e7eb] font-black uppercase text-[10px] tracking-widest"><Copy className="w-4 h-4 mr-2" /> Copy to clipboard</Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900 rounded-[32px] p-8 text-zinc-300 font-bold leading-relaxed whitespace-pre-wrap">
                    {output}
                </div>
            </div>
        )}
      </div>

      {showPaymentDialog && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-center mb-8 tracking-tight uppercase text-zinc-900">Authorize Tool Usage</h2>
            
            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 mb-8">
                <button 
                    onClick={() => {
                        setShowFundingModal(true);
                        setShowPaymentDialog(false);
                    }}
                    className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-100 shadow-sm"><Wallet className="w-5 h-5" /></div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance</p>
                        <p className="text-zinc-900 font-black">{formatCurrency(wallet.balance)}</p>
                    </div>
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fee</p>
                    <p className="text-blue-600 font-black">{formatCurrency(tool.pricePerUse)}</p>
                </div>
            </div>

            {wallet.balance < tool.pricePerUse ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-[10px] text-red-600 font-black uppercase tracking-widest leading-tight">Insufficient funds to launch tool.</p>
                    </div>
                    <Button 
                        onClick={() => {
                            setShowFundingModal(true);
                            setShowPaymentDialog(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-7 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <Zap className="w-4 h-4" /> Fund Wallet Now
                    </Button>
                    <Button variant="ghost" className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                </div>
            ) : (
                <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-full py-8" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                    <Button className="flex-[2] bg-black text-white rounded-full py-8 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all" onClick={handlePayment}>Authorize & Pay</Button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
