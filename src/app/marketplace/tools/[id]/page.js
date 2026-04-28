"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Wrench, Zap, AlertCircle, Check, 
  Copy, Download, RefreshCw, ShieldCheck,
  BookOpen, Presentation, BarChart3, Search, Lightbulb,
  SpellCheck, Quote, Image, Code2, RefreshCw as RefreshIcon,
  ClipboardCheck, Wallet, Sparkles, UserCheck, X, ChevronLeft, ChevronRight,
  Monitor, Palette, FileText, Type, Plus, Upload, MessageSquare, Layers,
  ListTree, Hash, ArrowUpDown, ExternalLink, GraduationCap, Globe
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
  const [uploadedImages, setUploadedImages] = useState([]); 
  const [generatedSlides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [customOutline, setCustomOutline] = useState(['Introduction', 'Background', 'Methodology', 'Results', 'Conclusion']);
  const [newOutlineItem, setNewOutlineItem] = useState('');
  const [slideCountRange, setSlideCountRange] = useState('12-18');
  const fileInputRef = useRef(null);

  // --- Reference Finder Specific States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [yearStart, setYearStart] = useState('2020');
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear().toString());
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('free'); // 'free' or 'deep'

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

  const handleAddOutline = () => {
    if (newOutlineItem.trim()) {
        setCustomOutline([...customOutline, newOutlineItem.trim()]);
        setNewOutlineItem('');
    }
  };

  const removeOutline = (index) => {
    setCustomOutline(customOutline.filter((_, i) => i !== index));
  };

  const handleProcess = async (isIterative = false, skipPaymentCheck = false) => {
    if (toolId === 'reference-finder') {
        return handleReferenceSearch(skipPaymentCheck);
    }

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
      }
      toast.success('Ready!');
      setHasPaid(false);
      setPendingIterative(false);
    } catch (err) {
      toast.error(err.message || 'Processing failed');
      setHasPaid(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReferenceSearch = async (skipPaymentCheck = false) => {
    if (!searchQuery.trim()) return toast.error("Enter a research topic");
    
    if (searchMode === 'deep' && !hasPaid && !skipPaymentCheck) {
        setShowPaymentDialog(true);
        return;
    }

    setIsProcessing(true);
    try {
        const response = await fetch('/api/marketplace/tools/reference-finder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: searchQuery,
                mode: searchMode,
                yearRange: `${yearStart}-${yearEnd}`
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setSearchResults(data.data);
        toast.success(searchMode === 'deep' ? 'DeepSearch Complete!' : 'Search Complete!');
        setHasPaid(false);
    } catch (err) {
        toast.error(err.message);
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

  const handlePayment = async () => {
    if (!tool) return;
    const price = toolId === 'reference-finder' && searchMode === 'deep' ? 500 : tool.pricePerUse;
    if (wallet.balance < price) {
      toast.error('Insufficient balance.');
      return;
    }
    const label = toolId === 'reference-finder' ? `DeepSearch: ${searchQuery}` : 
                  pendingIterative ? `Refinement: ${tool.name}` : `Tool: ${tool.name}`;
    const success = await deductFunds(price, label);
    if (success) {
      setHasPaid(true);
      setShowPaymentDialog(false);
      toast.success('Payment successful!');
      if (toolId === 'reference-finder') handleReferenceSearch(true);
      else handleProcess(pendingIterative, true);
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
            <div className="bg-zinc-900 rounded-[24px] px-8 py-4 text-center text-white font-black text-2xl shadow-xl">
                {toolId === 'reference-finder' && searchMode === 'deep' ? '₦500' : formatCurrency(tool.pricePerUse)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- REFERENCE FINDER UI --- */}
        {toolId === 'reference-finder' && (
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <Input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter research topic, keywords, or author names..."
                                className="h-16 pl-14 bg-slate-50 border-slate-100 rounded-3xl font-bold text-zinc-900 focus:border-black transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input type="number" value={yearStart} onChange={(e) => setYearStart(e.target.value)} className="w-24 h-16 bg-slate-50 border-slate-100 rounded-2xl text-center font-black text-zinc-900 focus:border-black transition-all" />
                            <div className="flex items-center text-zinc-400 font-black uppercase text-[10px] tracking-widest px-1">to</div>
                            <Input type="number" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className="w-24 h-16 bg-slate-50 border-slate-100 rounded-2xl text-center font-black text-zinc-900 focus:border-black transition-all" />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-8">
                        <button 
                            onClick={() => { setSearchMode('free'); handleReferenceSearch(); }}
                            disabled={isProcessing}
                            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${searchMode === 'free' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Globe className="w-4 h-4" /> Semantic Search (Free)
                        </button>
                        <button 
                            onClick={() => setSearchMode('deep')}
                            disabled={isProcessing}
                            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${searchMode === 'deep' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Sparkles className="w-4 h-4 text-blue-200" /> DeepSearch (₦500)
                        </button>
                        {searchMode === 'deep' && (
                            <Button 
                                onClick={() => handleReferenceSearch()}
                                disabled={isProcessing || !searchQuery.trim()}
                                className="px-10 bg-black text-white rounded-2xl py-4 font-black uppercase text-xs animate-in zoom-in-95"
                            >
                                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Launch DeepSearch'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {searchResults.map((paper, idx) => (
                        <div key={idx} className="bg-white border border-[#e5e7eb] rounded-[40px] p-8 shadow-sm hover:border-blue-400 transition-all group relative overflow-hidden">
                            {searchMode === 'deep' && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />}
                            <div className="flex justify-between items-start mb-6">
                                <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">{paper.year} • {paper.venue || 'Academic Journal'}</Badge>
                                <a href={paper.url} target="_blank" className="p-3 bg-slate-50 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all"><ExternalLink className="w-4 h-4" /></a>
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 mb-4 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{paper.title}</h3>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><GraduationCap className="w-4 h-4" /></div>
                                <p className="text-xs font-bold text-slate-500">{paper.authors?.join(', ')}</p>
                            </div>
                            {paper.abstract && (
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 italic text-sm text-slate-600 leading-relaxed font-medium">
                                    "{paper.abstract}"
                                </div>
                            )}
                        </div>
                    ))}
                    {!isProcessing && searchResults.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-300"><Search className="w-10 h-10" /></div>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Academic discovery results will appear here</p>
                        </div>
                    )}
                    {isProcessing && (
                        <div className="py-20 text-center animate-pulse">
                            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-6 animate-spin" />
                            <p className="text-blue-600 font-black uppercase text-[10px] tracking-[0.2em]">AI Scholar is searching global archives...</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- SLIDE GENERATOR / HUMANIZER UI --- */}
        {toolId !== 'reference-finder' && (
          generatedSlides.length > 0 ? (
            // --- SLIDE PREVIEW MODE ---
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1">
                        <div className="bg-white p-8 rounded-[48px] shadow-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-8 text-zinc-900">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Technical Preview</h3>
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
                                    <button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 rounded-full transition-all flex-shrink-0 ${i === currentIndex ? 'w-12 bg-zinc-900' : 'w-2 bg-slate-200'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-96 space-y-8">
                        <div className="bg-zinc-900 p-8 rounded-[40px] text-white shadow-2xl">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Remodification Suite</h4>
                            <div className="space-y-4">
                                <Textarea value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} placeholder="E.g. Add more detail about the hardware..." className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] text-sm focus:border-white/20 focus:ring-0 placeholder:text-zinc-600 text-white font-medium" />
                                <Button onClick={() => handleProcess(true)} disabled={isProcessing || !refinementPrompt.trim()} className="w-full bg-white text-zinc-900 hover:bg-zinc-100 rounded-2xl py-6 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
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
                                        <button key={t.id} onClick={() => setSelectedTemplate(t)} className={`aspect-square rounded-xl transition-all border-2 flex items-center justify-center relative overflow-hidden ${selectedTemplate.id === t.id ? 'border-zinc-900 scale-105' : 'border-slate-50'}`} title={t.name}>
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: t.primaryColor }} /><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: t.accentColor }} />
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={handleDownloadPPTX} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-8 font-black uppercase text-[11px] tracking-widest shadow-lg flex items-center justify-center gap-3"><Download className="w-5 h-5" /> Download PowerPoint</Button>
                                <button onClick={() => { setSlides([]); setInput(''); }} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Create New Project</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            // --- STANDARD INPUT MODE ---
            <div className={`grid ${toolId === 'slide-generator' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-12 animate-in fade-in duration-700`}>
                <div className={toolId === 'slide-generator' ? 'lg:col-span-2 space-y-10' : 'space-y-10'}>
                
                {/* Slide Structure / Outline */}
                {toolId === 'slide-generator' && (
                    <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ListTree className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Presentation Outline</h2>
                                    <p className="text-sm text-slate-500 font-medium">Define your required slide sequence</p>
                                </div>
                            </div>
                            <Badge className="bg-zinc-100 text-zinc-900 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase">{customOutline.length} SECTIONS</Badge>
                        </div>

                        <div className="space-y-3 mb-6">
                            {customOutline.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm border border-slate-100">{idx + 1}</span>
                                        <span className="font-bold text-zinc-900 uppercase text-xs tracking-tight">{item}</span>
                                    </div>
                                    <button onClick={() => removeOutline(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Input 
                                value={newOutlineItem}
                                onChange={(e) => setNewOutlineItem(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddOutline()}
                                placeholder="Add slide heading..."
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 px-6 font-bold text-zinc-900 focus:border-black transition-all"
                            />
                            <Button onClick={handleAddOutline} className="h-14 w-14 bg-zinc-900 text-white rounded-2xl p-0 shrink-0 shadow-lg hover:bg-black active:scale-90 transition-all">
                                <Plus className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Context Input */}
                <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[600px]">
                    <div className="flex justify-between items-center mb-8 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Content Core</h2>
                                <p className="text-sm text-slate-500 font-medium">{toolId === 'ai-humanizer' ? 'AI generated text' : 'Research or technical text'}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className={`rounded-full px-4 py-1.5 font-black text-[10px] ${isOverLimit ? 'text-red-500 border-red-200 bg-red-50' : 'text-slate-400'}`}>
                            {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
                        </Badge>
                    </div>
                    <Textarea 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        className={`flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border-[#e5e7eb] rounded-[32px] p-8 focus:border-black focus:ring-0 text-zinc-900 leading-relaxed font-bold resize-none ${isOverLimit ? 'border-red-300' : ''}`} 
                        placeholder="Enter project content here..." 
                    />
                    
                    {toolId === 'ai-humanizer' && (
                        <Button onClick={() => handleProcess()} disabled={isProcessing || !input.trim() || isOverLimit} className="w-full bg-black hover:bg-zinc-800 text-white rounded-[24px] py-8 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-8 flex items-center justify-center gap-4 shrink-0">
                            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
                            {isProcessing ? 'Humanizing...' : `Execute Humanizer (₦1,000)`}
                        </Button>
                    )}
                </div>

                {/* Instructions - Only for Slide Gen */}
                {toolId === 'slide-generator' && (
                    <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Strategic Directives</h2>
                                <p className="text-sm text-slate-500 font-medium">Style instructions or focus areas</p>
                            </div>
                        </div>
                        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="E.g. Focus on mathematical models..." className="h-16 bg-slate-50 border-slate-100 rounded-2xl px-6 font-black text-zinc-900 focus:border-black transition-all placeholder:text-slate-400" />
                    </div>
                )}

                {/* AI Humanizer Output Section - INSIDE GRID */}
                {toolId === 'ai-humanizer' && (
                    <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-10 shadow-sm flex flex-col h-[600px] animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-8 shrink-0">
                            <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter">Result</h2>
                            {output && <Button onClick={handleCopy} variant="outline" className="rounded-full px-6 border-[#e5e7eb] font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all"><Copy className="w-4 h-4 mr-2" /> Copy Results</Button>}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900 rounded-[32px] p-8 text-zinc-300 font-bold leading-relaxed whitespace-pre-wrap">
                            {output || (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
                                    <UserCheck className="w-12 h-12 mb-4 opacity-10" />
                                    Humanized output will appear here
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>

                {/* Sidebar Configuration - Only for Slide Gen */}
                {toolId === 'slide-generator' && (
                    <div className="space-y-8">
                    {/* Length Selector */}
                    <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Hash className="w-4 h-4 text-blue-600" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Slide Count Range</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['8-12', '12-18', '18-25', '25-35'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setSlideCountRange(range)}
                                    className={`py-3 rounded-xl border-2 font-black text-xs transition-all ${slideCountRange === range ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                >
                                    {range} SLIDES
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Technical Visuals</h3>
                        <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-100 rounded-[28px] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-zinc-900 hover:bg-slate-50 transition-all group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-slate-400" /></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Figures (Max 5)</p>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />
                        <div className="mt-8 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {uploadedImages.map(img => (
                                <div key={img.id} className="bg-slate-50 rounded-2xl p-4 flex gap-4 border border-slate-100 relative group">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white shadow-sm"><img src={img.data} className="w-full h-full object-cover" alt="" /></div>
                                    <div className="flex-1 min-w-0">
                                        <input autoFocus={!img.caption} value={img.caption} onChange={(e) => updateImageCaption(img.id, e.target.value)} placeholder="Enter Caption..." className="w-full bg-transparent border-none p-0 text-xs font-black uppercase tracking-tighter focus:ring-0 placeholder:text-red-400 text-zinc-900" />
                                        <p className="text-[9px] text-zinc-400 font-bold mt-1 uppercase">Required Key</p>
                                    </div>
                                    <button onClick={() => removeImage(img.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Design Language</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {SLIDE_TEMPLATES.map(t => {
                                const ThemeIcon = t.id === 'academic' ? BookOpen : t.id === 'modern' ? Monitor : t.id === 'sunset' ? Palette : t.id === 'forest' ? Layers : t.id === 'royal' ? Sparkles : Search;
                                return (
                                    <button key={t.id} onClick={() => setSelectedTemplate(t)} className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${selectedTemplate.id === t.id ? 'border-white shadow-lg scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: t.primaryColor }} />
                                        <div className="relative z-10">
                                            <ThemeIcon className={`w-5 h-5 mb-3 ${selectedTemplate.id === t.id ? 'text-white' : 'text-zinc-500'}`} />
                                            <p className={`text-[9px] font-black uppercase tracking-tighter ${selectedTemplate.id === t.id ? 'text-white' : 'text-zinc-500'}`}>{t.name}</p>
                                            <div className="mt-2 w-full h-1 rounded-full overflow-hidden flex"><div className="h-full w-1/3" style={{ backgroundColor: t.primaryColor }} /><div className="h-full w-1/3" style={{ backgroundColor: t.secondaryColor }} /><div className="h-full w-1/3" style={{ backgroundColor: t.accentColor }} /></div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Button onClick={() => handleProcess()} disabled={isProcessing || !input.trim() || isOverLimit} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[32px] py-10 font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-4">
                        {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Monitor className="w-6 h-6" />}
                        {isProcessing ? 'Architecting...' : `Build Presentation (${formatCurrency(tool.pricePerUse)})`}
                    </Button>
                    </div>
                )}
            </div>
          )
        )}
      </div>

      {showPaymentDialog && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-center mb-8 tracking-tight uppercase text-zinc-900">Authorize Tool Usage</h2>
            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 mb-8">
                <button onClick={() => { setShowFundingModal(true); setShowPaymentDialog(false); }} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-100 shadow-sm"><Wallet className="w-5 h-5" /></div>
                    <div><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance</p><p className="text-zinc-900 font-black">{formatCurrency(wallet.balance)}</p></div>
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fee</p>
                    <p className="text-blue-600 font-black">
                        {toolId === 'reference-finder' && searchMode === 'deep' ? '₦500' : formatCurrency(tool.pricePerUse)}
                    </p>
                </div>
            </div>
            {wallet.balance < (toolId === 'reference-finder' && searchMode === 'deep' ? 500 : tool.pricePerUse) ? (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-[10px] text-red-600 font-black uppercase tracking-widest leading-tight">Insufficient funds to launch tool.</p></div>
                    <Button onClick={() => { setShowFundingModal(true); setShowPaymentDialog(false); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-7 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Zap className="w-4 h-4" /> Fund Wallet Now</Button>
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
